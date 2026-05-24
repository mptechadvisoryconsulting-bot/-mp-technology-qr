import Stripe from "stripe";
import { findPlan, findTerm } from "../../../../lib/pricing";

export async function POST(request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return Response.json(
      { error: "Stripe is not connected yet. Add STRIPE_SECRET_KEY and Stripe price IDs in Vercel." },
      { status: 400 },
    );
  }

  const body = await request.json();
  const plan = findPlan(body.planId);
  const term = findTerm(body.termId);
  if (!plan || !term) {
    return Response.json({ error: "Unknown pricing plan." }, { status: 400 });
  }

  const priceId = process.env[plan.priceEnv[term.id]];
  if (!priceId) {
    return Response.json(
      { error: `Missing Stripe price ID for ${plan.name} ${term.label}. Add ${plan.priceEnv[term.id]} in Vercel.` },
      { status: 400 },
    );
  }

  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://mp-technology-qr.vercel.app";
  const stripe = new Stripe(stripeSecretKey);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    client_reference_id: body.userId || undefined,
    customer_email: body.email || undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    metadata: {
      userId: body.userId || "",
      planId: plan.id,
      termId: term.id,
    },
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        userId: body.userId || "",
        planId: plan.id,
        termId: term.id,
      },
    },
  });

  return Response.json({ url: session.url });
}
