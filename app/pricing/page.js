"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { billingTerms, plans } from "../../lib/pricing";
import { createBrowserSupabase } from "../../lib/supabase-browser";

export default function PricingPage() {
  const [termId, setTermId] = useState("monthly");
  const [user, setUser] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState("");
  const [message, setMessage] = useState("");
  const term = useMemo(() => billingTerms.find((item) => item.id === termId), [termId]);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
  }, []);

  async function startCheckout(planId) {
    const selectedPlan = plans.find((plan) => plan.id === planId);
    if (selectedPlan?.custom) {
      setMessage("Enterprise is custom pricing. Contact the platform owner to set up a custom plan.");
      return;
    }
    setLoadingPlan(planId);
    setMessage("Opening secure checkout...");

    try {
      const supabase = createBrowserSupabase();
      const { data: sessionData } = supabase ? await supabase.auth.getSession() : { data: {} };
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionData.session?.access_token ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {}),
        },
        body: JSON.stringify({
          planId,
          termId,
          userId: user?.id,
          email: user?.email,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || "Stripe is not configured yet.");
        setLoadingPlan("");
        return;
      }
      window.location.href = data.url || "/dashboard?billing=updated";
    } catch (error) {
      setMessage(error.message);
      setLoadingPlan("");
    }
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
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/login">Log in</Link>
            <Link className="nav-cta" href="/signup">Start free trial</Link>
          </nav>
        </header>

        <section className="pricing-hero panel">
          <div>
            <p className="eyebrow">ScanOps billing</p>
            <h1>Operational QR automation plans built for scale.</h1>
            <p className="lead">
              Start first-time accounts with a 14-day trial, then upgrade or downgrade with Stripe proration while
              preserving billing cycles and subscription history.
            </p>
          </div>
          <div className="billing-toggle" aria-label="Billing period">
            {billingTerms.map((item) => (
              <button
                className={item.id === termId ? "active" : ""}
                key={item.id}
                type="button"
                onClick={() => setTermId(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="pricing-grid">
          {plans.map((plan) => (
            <article className={`price-card panel ${plan.popular ? "featured" : ""}`} key={plan.id}>
              {plan.popular && <span className="popular-badge">Best value</span>}
              <div>
                <p className="eyebrow">{plan.limits}</p>
                <h2>{plan.name}</h2>
                <p>{plan.description}</p>
              </div>
              <div className="price-line">
                {plan.custom ? (
                  <>
                    <strong>Custom</strong>
                    <span>pricing</span>
                  </>
                ) : (
                  <>
                    <strong>${plan.prices[termId]}</strong>
                    <span>{term?.suffix}</span>
                  </>
                )}
              </div>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button
                className="primary-button"
                type="button"
                disabled={loadingPlan === plan.id}
                onClick={() => startCheckout(plan.id)}
              >
                {plan.custom ? "Contact sales" : loadingPlan === plan.id ? "Opening..." : user ? "Choose plan" : "Start trial"}
              </button>
            </article>
          ))}
        </section>

        <section className="panel payment-note">
          <div>
            <p className="eyebrow">Payment ownership</p>
            <h2>Built for low-maintenance SaaS ownership.</h2>
            <p>
              ScanOps uses Stripe subscriptions, customer billing portals, webhooks, and plan limits so customers can
              manage their own account with minimal owner involvement.
            </p>
          </div>
          <div className="setup-list">
            <span>Stripe account</span>
            <span>Products and prices</span>
            <span>Webhook endpoint</span>
          </div>
        </section>

        {message && <p className="form-message pricing-message">{message}</p>}
      </section>
    </main>
  );
}
