import Link from "next/link";

const demoCodes = [
  { name: "Warehouse Asset Tag", type: "Inventory", scans: 184, status: "Active", destination: "Asset support form" },
  { name: "Aftermarket Manual", type: "PDF", scans: 92, status: "Active", destination: "Hosted product document" },
  { name: "Field Service Request", type: "Support", scans: 41, status: "Active", destination: "Customer ticket intake" },
];

export default function DemoPage() {
  return (
    <main className="app-shell">
      <section className="workspace dashboard-shell">
        <header className="topbar app-topbar">
          <Link className="brand" href="/demo">
            <span className="brand-mark">QR</span>
            <span>QR Operations Demo</span>
          </Link>
          <nav aria-label="Primary">
            <Link href="/">Home</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/signup">Start trial</Link>
            <Link className="nav-cta" href="/login">Log in</Link>
          </nav>
        </header>

        <section className="dashboard-hero">
          <div className="panel hero-copy">
            <p className="eyebrow">Client presentation demo</p>
            <h1>Operational QR automation without custom setup work.</h1>
            <p className="lead">
              Show how warehouses, manufacturing teams, aftermarket support, and field operations can create tracked QR
              campaigns, update destinations, and review scan activity from one secure workspace.
            </p>
            <div className="hero-actions">
              <Link className="primary-button" href="/signup">Create demo account</Link>
              <Link className="secondary-button" href="/dashboard">Open live dashboard</Link>
            </div>
          </div>
          <div className="metric-grid">
            <Metric label="Weekly scans" value="317" />
            <Metric label="Dynamic QR codes" value="48" />
            <Metric label="Support tickets" value="12" />
            <Metric label="Active users" value="5" />
          </div>
        </section>

        <section className="panel saved-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Demo workspace</p>
              <h2>All QR campaigns</h2>
            </div>
            <span className="status">Presentation mode</span>
          </div>
          <div className="qr-card-list">
            {demoCodes.map((code) => (
              <article className="qr-row-card" key={code.name}>
                <div className="qr-thumb">
                  <MiniQr />
                  <span>DL</span>
                </div>
                <div className="qr-row-body">
                  <div className="qr-row-title">
                    <h2>{code.name}</h2>
                    <span className="active-pill">{code.status}</span>
                  </div>
                  <p>
                    <strong>{code.type}</strong>
                    <span>Updated today</span>
                  </p>
                  <div className="qr-row-link">
                    <span className="table-link">qr.example/{code.name.toLowerCase().replaceAll(" ", "-")}</span>
                    <small>{code.destination}</small>
                  </div>
                </div>
                <div className="qr-row-actions">
                  <span>{code.scans}</span>
                  <small>scans</small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="feature-grid">
          <article className="feature-card">
            <strong>Dynamic redirects</strong>
            <p>Printed QR codes keep working while the destination can change in the dashboard.</p>
          </article>
          <article className="feature-card">
            <strong>Team controls</strong>
            <p>Company users stay inside their own workspace with plan-based seat limits.</p>
          </article>
          <article className="feature-card">
            <strong>Owner console</strong>
            <p>The platform owner can review signups, usage, scans, and customer growth.</p>
          </article>
          <article className="feature-card">
            <strong>Support automation</strong>
            <p>QR scans can open support forms for assets, products, documents, or customer requests.</p>
          </article>
        </section>
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

function MiniQr() {
  return (
    <div className="mini-qr" aria-hidden="true">
      {Array.from({ length: 25 }).map((_, index) => (
        <i key={index} />
      ))}
    </div>
  );
}
