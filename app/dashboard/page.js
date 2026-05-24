"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QrEditor from "../../components/QrEditor";
import SetupAssistant from "../../components/SetupAssistant";
import { createBrowserSupabase } from "../../lib/supabase-browser";
import { findPlan, getPlanLimits } from "../../lib/pricing";

export default function DashboardPage() {
  const router = useRouter();
  const [supabase] = useState(() => createBrowserSupabase());
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [account, setAccount] = useState(null);
  const [members, setMembers] = useState([]);
  const [codes, setCodes] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [monthlyScanCount, setMonthlyScanCount] = useState(0);
  const [weeklyScanCount, setWeeklyScanCount] = useState(0);
  const [subscription, setSubscription] = useState(null);
  const [teamEmail, setTeamEmail] = useState("");
  const [teamUsername, setTeamUsername] = useState("");
  const [teamMessage, setTeamMessage] = useState("");
  const [billingMessage, setBillingMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/login");
      return;
    }
    setUser(data.user);

    const { data: profileRow } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
    const activeProfile = profileRow || { company_name: "Customer", logo_url: null, plan: "free" };
    setProfile(activeProfile);

    let activeAccount = null;
    if (activeProfile.account_id) {
      const { data: accountRow } = await supabase.from("accounts").select("*").eq("id", activeProfile.account_id).maybeSingle();
      activeAccount = accountRow;
      setAccount(accountRow);
      const { data: memberRows } = await supabase
        .from("account_members")
        .select("*")
        .eq("account_id", activeProfile.account_id)
        .order("created_at", { ascending: true });
      const userIds = (memberRows || []).map((member) => member.user_id).filter(Boolean);
      let profileMap = new Map();
      if (userIds.length) {
        const { data: memberProfiles } = await supabase
          .from("profiles")
          .select("id, username, company_name")
          .in("id", userIds);
        profileMap = new Map((memberProfiles || []).map((memberProfile) => [memberProfile.id, memberProfile]));
      }
      setMembers((memberRows || []).map((member) => ({ ...member, profiles: profileMap.get(member.user_id) || null })));
    }
    const activeAccountId = activeAccount?.id || activeProfile.account_id;

    const { data: subscriptionRow } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", data.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription(subscriptionRow || null);

    let qrQuery = supabase
      .from("qr_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (activeAccountId) {
      qrQuery = qrQuery.eq("account_id", activeAccountId);
    } else {
      qrQuery = qrQuery.eq("user_id", data.user.id);
    }
    const { data: rawQrRows } = await qrQuery;
    const qrRows = rawQrRows || [];
    const qrIds = qrRows.map((code) => code.id);

    let scanCounts = new Map();
    if (qrIds.length) {
      const { data: countRows } = await supabase
        .from("qr_scans")
        .select("qr_code_id")
        .in("qr_code_id", qrIds);
      scanCounts = (countRows || []).reduce((map, scan) => {
        map.set(scan.qr_code_id, (map.get(scan.qr_code_id) || 0) + 1);
        return map;
      }, new Map());
    }

    const ownedQrRows = qrRows.map((code) => ({
      ...code,
      qr_scans: [{ count: scanCounts.get(code.id) || 0 }],
    }));
    setCodes(ownedQrRows);

    if (qrIds.length) {
      const { data: scans } = await supabase
        .from("qr_scans")
        .select("id, qr_code_id, scanned_at, user_agent, ip_address")
        .in("qr_code_id", qrIds)
        .order("scanned_at", { ascending: false })
        .limit(50);
      const qrById = new Map(ownedQrRows.map((code) => [code.id, code]));
      setScanHistory((scans || []).map((scan) => ({ ...scan, qr_code: qrById.get(scan.qr_code_id) })));
    } else {
      setScanHistory([]);
    }

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const weekStart = new Date();
    weekStart.setUTCDate(weekStart.getUTCDate() - 7);
    if (qrIds.length) {
      const { count: scanCount } = await supabase
        .from("qr_scans")
        .select("id", { count: "exact", head: true })
        .in("qr_code_id", qrIds)
        .gte("scanned_at", monthStart.toISOString());
      setMonthlyScanCount(scanCount || 0);
      const { count: weekCount } = await supabase
        .from("qr_scans")
        .select("id", { count: "exact", head: true })
        .in("qr_code_id", qrIds)
        .gte("scanned_at", weekStart.toISOString());
      setWeeklyScanCount(weekCount || 0);
    } else {
      setMonthlyScanCount(0);
      setWeeklyScanCount(0);
    }
    setLoading(false);
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
  }

  async function inviteTeamMember(event) {
    event.preventDefault();
    setTeamMessage("Sending invite...");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const response = await fetch("/api/team/invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        accountId: account?.id || profile?.account_id,
        email: teamEmail,
        username: teamUsername,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setTeamMessage(payload.error || "Could not send invite.");
      return;
    }
    setTeamEmail("");
    setTeamUsername("");
    setTeamMessage("Invite sent. The user will join this company workspace after accepting.");
    load();
  }

  async function cancelAtPeriodEnd() {
    setBillingMessage("Sending cancellation request...");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const response = await fetch("/api/stripe/cancel", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();
    setBillingMessage(payload.message || payload.error || "Cancellation request finished.");
  }

  async function openBillingPortal() {
    setBillingMessage("Opening billing portal...");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const response = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();
    if (!response.ok) {
      setBillingMessage(payload.next ? `${payload.error} Open Plans to continue.` : payload.error || "Billing portal is not available yet.");
      return;
    }
    window.location.href = payload.url;
  }

  if (loading) {
    return <main className="app-shell"><div className="panel">Loading workspace...</div></main>;
  }

  if (!supabase) {
    return (
      <main className="app-shell">
        <section className="workspace">
          <div className="panel setup-card">
            <p className="eyebrow">Setup needed</p>
            <h1>Add Supabase environment variables.</h1>
            <p className="lead">
              Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in Vercel.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const dynamicCount = codes.filter((code) => code.is_dynamic).length;
  const scans = codes.reduce((sum, code) => sum + (code.qr_scans?.[0]?.count || 0), 0);
  const plan = findPlan(profile?.plan || "free");
  const isOwner = account?.owner_user_id === user?.id;
  const trialDays = getDaysUntil(subscription?.trial_ends_at);
  const accessEnds = subscription?.cancel_at_period_end ? getDaysUntil(subscription?.current_period_ends_at) : null;
  const usage = {
    dynamicCount,
    monthlyScans: monthlyScanCount,
    ...getPlanLimits(profile?.plan || "free"),
  };
  const seatCount = Math.max(members.length, 1);
  const seatCapLocked = seatCount >= usage.userLimit;

  return (
    <main className="app-shell">
      <section className="workspace dashboard-shell">
        <header className="topbar app-topbar">
          <Link className="brand" href="/dashboard">
            {profile.logo_url ? (
              <img className="brand-logo" src={profile.logo_url} alt="" />
            ) : (
              <span className="brand-mark">QR</span>
            )}
            <span>{profile.brand_name || profile.company_name || "Customer QR"}</span>
          </Link>
          <nav aria-label="Primary">
            <Link href="/pricing">Plans</Link>
            <Link href="/">Public site</Link>
            <button className="secondary-button" type="button" onClick={signOut}>Sign out</button>
          </nav>
        </header>

        <div className="qr-dashboard-layout">
          <aside className="qr-sidebar panel">
            <div className="sidebar-block">
              <p className="eyebrow">Weekly scans</p>
              <div className="big-stat">{weeklyScanCount}</div>
              <span>last 7 days</span>
            </div>

            <div className="sidebar-divider" />

            <div className="sidebar-block">
              <div className="sidebar-heading">
                <strong>Folders</strong>
                <span>+</span>
              </div>
              <div className="folder-row">
                <span className="folder-icon" />
                <strong>{account?.company_name || profile.company_name || "Company workspace"}</strong>
                <em>{codes.length}</em>
              </div>
            </div>

            <div className="sidebar-spacer" />

            <div className="sidebar-block">
              <p className="eyebrow">Overview</p>
              <UsageMini label="Dynamic QR Codes" value={dynamicCount} limit={usage.dynamicLimit} />
              <UsageMini label="Team users" value={seatCount} limit={usage.userLimit} />
              <div className="trial-row">
                <span>{subscription?.cancel_at_period_end ? "Access ends in" : "Trial ends in"}</span>
                <strong>
                  {subscription?.cancel_at_period_end
                    ? `${accessEnds ?? 0} days`
                    : trialDays !== null
                      ? `${trialDays} days`
                      : "Free plan"}
                </strong>
              </div>
              <Link className="upgrade-button" href="/pricing">Upgrade</Link>
            </div>
          </aside>

          <section className="qr-main panel">
            <div className="qr-list-header">
              <div>
                <p className="eyebrow">Command center</p>
                <h1>All QR Codes</h1>
              </div>
              <a className="primary-button create-qr-button" href="#generator">Create QR code</a>
            </div>

            <div className="qr-toolbar">
              <label className="toolbar-check">
                <input type="checkbox" aria-label="Select all QR codes" />
              </label>
              <span className="toolbar-divider" />
              <button type="button">Filters</button>
              <button type="button">Status</button>
              <button type="button">Type</button>
              <span className="toolbar-fill" />
              <button type="button">Last created</button>
              <button type="button" aria-label="Card view">Grid</button>
              <button type="button" aria-label="List view">List</button>
            </div>

            <div className="qr-card-list">
              {codes.map((code) => {
                const path = code.is_dynamic ? `/?qr=${code.short_code}` : "";
                return (
                  <article className="qr-row-card" key={code.id}>
                    <div className="qr-thumb">
                      <MiniQr />
                      <span>DL</span>
                    </div>
                    <div className="qr-row-body">
                      <div className="qr-row-title">
                        <h2>{code.name}</h2>
                        <span className="active-pill">Active</span>
                      </div>
                      <p>
                        <strong>{code.type.toUpperCase()}</strong>
                        <span>{new Date(code.created_at).toLocaleDateString()}</span>
                      </p>
                      <div className="qr-row-link">
                        {code.is_dynamic ? (
                          <Link className="table-link" href={path} target="_blank">{path}</Link>
                        ) : (
                          <span>Static direct QR</span>
                        )}
                        <small>{code.destination_url}</small>
                      </div>
                    </div>
                    <div className="qr-row-actions">
                      <span>{code.qr_scans?.[0]?.count || 0}</span>
                      <small>scans</small>
                    </div>
                  </article>
                );
              })}
              {!codes.length && (
                <div className="empty-list">
                  <h2>No QR codes yet</h2>
                  <p>Create your first tracked QR code below.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="panel usage-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Usage</p>
              <h2>Plan limits</h2>
            </div>
            <Link className="secondary-button" href="/pricing">Upgrade</Link>
          </div>
          <div className="usage-grid">
            <UsageBar label="Dynamic QR codes" value={dynamicCount} limit={usage.dynamicLimit} />
            <UsageBar label="Saved scan history this month" value={monthlyScanCount} limit={usage.scanLimit} />
            <UsageBar label="Team seats" value={seatCount} limit={usage.userLimit} />
          </div>
          <p className="form-message">
            Scans keep redirecting even when the history limit is reached. Upgrade to store more scan records and analytics.
          </p>
        </section>

        <section className="panel team-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Team</p>
              <h2>Company users</h2>
            </div>
            <span className="status">{seatCount}/{usage.userLimit} seats</span>
          </div>
          <div className="team-list">
            {members.map((member) => (
              <div key={member.id}>
                <strong>{member.profiles?.username || member.role}</strong>
                <span>{member.role}</span>
              </div>
            ))}
            {!members.length && (
              <div>
                <strong>{profile.username || "owner"}</strong>
                <span>owner</span>
              </div>
            )}
          </div>
          {isOwner && (
            <form className="team-form" onSubmit={inviteTeamMember}>
              <input value={teamUsername} onChange={(event) => setTeamUsername(event.target.value.replace(/[^a-z0-9_.-]/gi, "").toLowerCase())} placeholder="username" />
              <input value={teamEmail} onChange={(event) => setTeamEmail(event.target.value)} type="email" placeholder="private login email" required />
              <button className="secondary-button" type="submit" disabled={seatCapLocked}>Invite user</button>
            </form>
          )}
          <p className="form-message">
            {teamMessage || (seatCapLocked
              ? "Seat cap is locked on this plan. Upgrade before inviting another user."
              : "Email is used privately for secure login; username is what the workspace shows.")}
          </p>
        </section>

        <section className="panel billing-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Billing</p>
              <h2>Subscription access</h2>
            </div>
            <div className="button-row">
              <button className="secondary-button" type="button" onClick={openBillingPortal}>Billing portal</button>
              <button className="secondary-button" type="button" onClick={cancelAtPeriodEnd}>Cancel at period end</button>
            </div>
          </div>
          <p className="form-message">
            If a customer cancels, their paid access stays active until the end of the current monthly, quarterly, or yearly period.
          </p>
          {billingMessage && <p className="form-message">{billingMessage}</p>}
        </section>

        <div id="generator" />
        {user && <QrEditor supabase={supabase} user={user} profile={profile} accountId={account?.id || profile?.account_id} usage={usage} onSaved={load} />}

        <section className="panel saved-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Library</p>
              <h2>Saved QR campaigns</h2>
            </div>
            <span className="status">{codes.length} total</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Tracked link</th>
                  <th>Destination</th>
                  <th>Scans</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => {
                  const publicPath = code.is_dynamic ? `/?qr=${code.short_code}` : "";
                  return (
                    <tr key={code.id}>
                      <td><strong>{code.name}</strong></td>
                      <td>{code.type}</td>
                      <td>
                        {code.is_dynamic ? (
                          <Link className="table-link" href={publicPath} target="_blank">{publicPath}</Link>
                        ) : (
                          "Static"
                        )}
                      </td>
                      <td className="destination-cell">{code.destination_url}</td>
                      <td>{code.qr_scans?.[0]?.count || 0}</td>
                    </tr>
                  );
                })}
                {!codes.length && (
                  <tr><td colSpan="5">No QR campaigns saved yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel saved-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Analytics</p>
              <h2>Recent scan history</h2>
            </div>
            <span className="status">{scanHistory.length} latest</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Tracked link</th>
                  <th>Scanned</th>
                  <th>Device</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {scanHistory.map((scan) => (
                  <tr key={scan.id}>
                    <td><strong>{scan.qr_code?.name || "QR campaign"}</strong></td>
                    <td>
                      {scan.qr_code?.short_code ? (
                        <Link className="table-link" href={`/?qr=${scan.qr_code.short_code}`} target="_blank">
                          ?qr={scan.qr_code.short_code}
                        </Link>
                      ) : (
                        "Static"
                      )}
                    </td>
                    <td>{new Date(scan.scanned_at).toLocaleString()}</td>
                    <td className="destination-cell">{formatDevice(scan.user_agent)}</td>
                    <td>{scan.ip_address || "Private"}</td>
                  </tr>
                ))}
                {!scanHistory.length && (
                  <tr><td colSpan="5">No scan history yet. Open a saved ?qr link to test tracking.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <SetupAssistant />
      </section>
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function UsageMini({ label, value, limit }) {
  const percent = Math.min(100, Math.round((value / Math.max(limit, 1)) * 100));
  return (
    <div className="usage-mini">
      <div>
        <span>{label}</span>
        <strong>{value} of {limit}</strong>
      </div>
      <div className="usage-track" aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function MiniQr() {
  return (
    <div className="mini-qr" aria-hidden="true">
      {Array.from({ length: 25 }).map((_, index) => (
        <i key={index} />
      ))}
    </div>
  );
}

function UsageBar({ label, value, limit }) {
  const percent = Math.min(100, Math.round((value / Math.max(limit, 1)) * 100));
  return (
    <div className="usage-card">
      <div>
        <strong>{label}</strong>
        <span>{value.toLocaleString()} of {limit.toLocaleString()}</span>
      </div>
      <div className="usage-track" aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function formatDevice(userAgent) {
  if (!userAgent) return "Unknown";
  if (/iphone|ipad|ios/i.test(userAgent)) return "iOS device";
  if (/android/i.test(userAgent)) return "Android device";
  if (/windows/i.test(userAgent)) return "Windows browser";
  if (/macintosh|mac os/i.test(userAgent)) return "Mac browser";
  return userAgent.slice(0, 80);
}

function getDaysUntil(dateValue) {
  if (!dateValue) return null;
  const diff = new Date(dateValue).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}
