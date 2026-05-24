"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SetupAssistant from "../../components/SetupAssistant";
import { createBrowserSupabase } from "../../lib/supabase-browser";

export default function OwnerPage() {
  const [summary, setSummary] = useState(null);
  const [message, setMessage] = useState("Loading owner dashboard...");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const supabase = createBrowserSupabase();
    if (!supabase) {
      setMessage("Supabase env vars are missing.");
      return;
    }
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setMessage("Log in with an owner account first.");
      return;
    }
    const response = await fetch("/api/owner/summary", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error || "Owner dashboard is not available.");
      return;
    }
    setSummary(payload);
    setMessage("");
  }

  return (
    <main className="app-shell">
      <section className="workspace dashboard-shell">
        <header className="topbar">
          <Link className="brand" href="/owner">
            <span className="brand-mark">QR</span>
            <span>Owner Console</span>
          </Link>
          <nav aria-label="Primary">
            <Link href="/demo">Demo</Link>
            <Link href="/signup">Create customer</Link>
            <Link href="/dashboard">Customer dashboard</Link>
            <Link href="/pricing">Pricing</Link>
            <button className="secondary-button" type="button" onClick={load}>Refresh</button>
          </nav>
        </header>

        <section className="dashboard-hero">
          <div>
            <p className="eyebrow">Operator dashboard</p>
            <h1>Accounts, usage, and customer support in one view.</h1>
            <p className="lead">Monitor new accounts, plan status, dynamic QR usage, and scan volume across the service.</p>
            <div className="hero-actions">
              <Link className="primary-button" href="/signup">Sign up a customer</Link>
              <Link className="secondary-button" href="/demo">Open client demo</Link>
            </div>
          </div>
          <div className="metric-grid">
            <Metric label="Accounts" value={summary?.totals.accounts || 0} />
            <Metric label="Dynamic QR codes" value={summary?.totals.dynamicCodes || 0} />
            <Metric label="Total scans" value={summary?.totals.scans || 0} />
            <Metric label="Monthly scans" value={summary?.totals.monthlyScans || 0} />
          </div>
        </section>

        {message && <section className="panel"><p className="form-message">{message}</p></section>}

        {summary && (
          <section className="panel saved-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Customers</p>
                <h2>Account list</h2>
              </div>
              <span className="status">{summary.accounts.length} accounts</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>QR Codes</th>
                    <th>Scans</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.accounts.map((account) => (
                    <tr key={account.id}>
                      <td><strong>{account.company}</strong></td>
                      <td>{account.email}</td>
                      <td>{account.plan} / {account.status}</td>
                      <td>{account.dynamicCount} dynamic, {account.qrCount} total</td>
                      <td>{account.monthlyScanCount} month, {account.scanCount} total</td>
                      <td>{new Date(account.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

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
