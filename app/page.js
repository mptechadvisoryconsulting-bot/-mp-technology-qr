import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminSupabase } from "../lib/supabase-admin";
import { getPlanLimits } from "../lib/pricing";

export const dynamic = "force-dynamic";

const DEFAULT_PUBLIC_SITE_URL = "https://app.scanops.io";

const capabilities = [
  ["Dynamic links", "Change destinations without reprinting codes."],
  ["Brand kits", "Keep customer logos, colors, and defaults together."],
  ["Scan tracking", "Record visits through secure redirect links."],
  ["Customer workspaces", "Give each business a private dashboard."],
];

export default async function HomePage({ searchParams }) {
  const params = await searchParams;
  if (params?.qr) {
    const qrCode = String(params.qr || "").trim();
    const redirectResult = await resolveQrCode(qrCode);
    if (redirectResult?.kind === "redirect") {
      redirect(redirectResult.destination);
    }
    if (redirectResult?.kind === "text") {
      return (
        <main className="app-shell auth-shell">
          <section className="panel auth-panel">
            <p className="eyebrow">QR text</p>
            <h1>Message</h1>
            <p className="lead text-result">{redirectResult.destination}</p>
          </section>
        </main>
      );
    }
    if (redirectResult?.kind === "scheme") {
      return (
        <main className="app-shell auth-shell">
          <section className="panel auth-panel">
            <p className="eyebrow">QR action</p>
            <h1>Opening...</h1>
            <p className="lead">If nothing opens automatically, use the button below.</p>
            <a className="primary-button" href={redirectResult.destination}>Open QR action</a>
            <script dangerouslySetInnerHTML={{ __html: `window.location.replace(${JSON.stringify(redirectResult.destination)});` }} />
          </section>
        </main>
      );
    }
    return <QrNotFound code={qrCode} />;
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <Link className="brand" href="/">
            <span className="brand-mark">QR</span>
            <span>ScanOps</span>
          </Link>
          <nav aria-label="Primary">
            <Link href="/demo">Demo</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/owner">Owner</Link>
            <Link href="/login">Log in</Link>
            <Link className="nav-cta" href="/signup">Launch workspace</Link>
          </nav>
        </header>

        <section className="hero hero-modern">
          <div className="hero-copy">
            <p className="eyebrow">Operational intelligence platform</p>
            <h1>Dynamic QR automation for the teams that keep operations moving.</h1>
            <p className="lead">
              ScanOps gives each business a secure workspace for dynamic QR codes, editable redirects, scan analytics,
              support workflows, and brand-controlled field experiences.
            </p>
            <div className="hero-actions">
              <Link className="primary-button" href="/signup">Create customer account</Link>
              <Link className="secondary-button" href="/pricing">View plans</Link>
            </div>
          </div>

          <div className="product-preview" aria-label="Product preview">
            <div className="preview-topline">
              <span>Live QR campaign</span>
              <strong>Ready</strong>
            </div>
            <div className="preview-grid">
              <div className="preview-form">
                <span className="mini-label">Destination</span>
                <strong>scanops.io/workflows</strong>
                <span className="mini-label">Mode</span>
                <strong>Dynamic tracked link</strong>
                <div className="segmented">
                  <span className="active">URL</span>
                  <span>vCard</span>
                  <span>Wi-Fi</span>
                </div>
              </div>
              <div className="qr-mock" aria-hidden="true">
                <div />
                <div />
                <div />
                <span />
              </div>
            </div>
            <div className="preview-stats">
              <div><strong>1,284</strong><span>Scans</span></div>
              <div><strong>42</strong><span>Codes</span></div>
              <div><strong>98%</strong><span>Uptime</span></div>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          {capabilities.map(([title, text]) => (
            <article className="feature-card" key={title}>
              <strong>{title}</strong>
              <p>{text}</p>
            </article>
          ))}
        </section>

        <section className="pricing-band">
          <div>
            <p className="eyebrow">Simple packages</p>
            <h2>Start with a 14-day trial, then bill monthly, quarterly, or yearly.</h2>
          </div>
          <div className="plan-list horizontal">
            <Link href="/pricing"><strong>Starter</strong><span>$12/mo for focused teams</span></Link>
            <Link href="/pricing"><strong>Professional</strong><span>$29/mo for active operations</span></Link>
            <Link href="/pricing"><strong>Business</strong><span>$79/mo for teams and reporting</span></Link>
          </div>
        </section>
      </section>
    </main>
  );
}

async function resolveQrCode(code) {
  if (!code || code === "preview") return null;
  const supabase = createAdminSupabase();
  const { data: qrCode, error } = await supabase
    .from("qr_codes")
    .select("id, user_id, account_id, type, destination_url, status, expires_at")
    .eq("short_code", code)
    .eq("is_dynamic", true)
    .maybeSingle();

  if (error || !qrCode) return null;
  if (qrCode.status && qrCode.status !== "active") return null;
  if (qrCode.expires_at && new Date(qrCode.expires_at).getTime() <= Date.now()) return null;
  if (qrCode.account_id) {
    const { data: account } = await supabase.from("accounts").select("suspended_at").eq("id", qrCode.account_id).maybeSingle();
    if (account?.suspended_at) return null;
  }

  await trackScan(supabase, qrCode);

  if (qrCode.type === "text") return { kind: "text", destination: qrCode.destination_url };
  if (qrCode.type === "support") return { kind: "redirect", destination: qrCode.destination_url || `${getPublicSiteUrl()}/support/${code}` };
  if (/^(mailto|tel|sms):/i.test(qrCode.destination_url)) return { kind: "scheme", destination: qrCode.destination_url };
  const destination = normalizeRedirectDestination(qrCode.destination_url);
  if (!destination) return null;
  return { kind: "redirect", destination };
}

function getPublicSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_PUBLIC_SITE_URL;
  return configuredUrl.replace(/\/$/, "");
}

async function trackScan(supabase, qrCode) {
  let planId = "free";
  if (qrCode.account_id) {
    const { data: account } = await supabase.from("accounts").select("plan").eq("id", qrCode.account_id).maybeSingle();
    planId = account?.plan || "free";
  } else {
    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", qrCode.user_id).maybeSingle();
    planId = profile?.plan || "free";
  }

  const { scanLimit } = getPlanLimits(planId);
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("qr_scans")
    .select("id, qr_codes!inner(user_id)", { count: "exact", head: true })
    .eq(qrCode.account_id ? "qr_codes.account_id" : "qr_codes.user_id", qrCode.account_id || qrCode.user_id)
    .gte("scanned_at", monthStart.toISOString());

  if ((count || 0) < scanLimit) {
    await supabase.from("qr_scans").insert({ qr_code_id: qrCode.id });
  }
}

function normalizeRedirectDestination(value) {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(mailto|tel|sms):/i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

function QrNotFound({ code }) {
  return (
    <main className="app-shell auth-shell">
      <section className="panel auth-panel">
        <p className="eyebrow">Tracked QR link</p>
        <h1>QR link not found.</h1>
        <p className="lead">
          This tracked code is not saved in the database yet, was deleted, or belongs to an older upload.
        </p>
        <p className="form-message">Code checked: {code || "blank"}</p>
        <Link className="primary-button" href="/login">Log in to check campaigns</Link>
      </section>
    </main>
  );
}
