import Stripe from "stripe";
import { findPlan, findTerm } from "../../../../lib/pricing";
import { createAdminSupabase } from "../../../../lib/supabase-admin";
import { checkRateLimit } from "../../../../lib/rate-limit";

const DEFAULT_SITE_URL = "https://app.scanops.io";

export async function POST(request) {
  const rate = checkRateLimit(request, "stripe-checkout", 20, 60000);
  if (!rate.allowed) return Response.json({ error: "Too many checkout attempts. Try again shortly." }, { status: 429 });

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return Response.json(
      { error: "Stripe is not connected yet. Add STRIPE_SECRET_KEY and Stripe price IDs in Vercel." },
      { status: 400 },
    );
  }

  const body = await request.json();
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  let currentUser = null;
  let existingSubscription = null;
  let hasPriorSubscription = false;

  if (token) {
    const supabase = createAdminSupabase();
    const { data: authData } = await supabase.auth.getUser(token);
    currentUser = authData.user || null;
    if (currentUser) {
      const { data: subscriptionRows } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });
      hasPriorSubscription = Boolean(subscriptionRows?.length);
      existingSubscription = (subscriptionRows || []).find((subscription) =>
        subscription.stripe_subscription_id &&
        ["active", "trialing", "past_due"].includes(subscription.status)
      ) || null;
    }
  }

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

  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  const stripe = new Stripe(stripeSecretKey);
  if (existingSubscription?.stripe_subscription_id) {
    const subscription = await stripe.subscriptions.retrieve(existingSubscription.stripe_subscription_id);
    const itemId = subscription.items.data[0]?.id;
    if (!itemId) return Response.json({ error: "Stripe subscription item was not found." }, { status: 400 });

    await stripe.subscriptions.update(existingSubscription.stripe_subscription_id, {
      cancel_at_period_end: false,
      proration_behavior: "create_prorations",
      items: [{ id: itemId, price: priceId }],
      metadata: {
        userId: currentUser?.id || body.userId || "",
        planId: plan.id,
        termId: term.id,
      },
    });

    return Response.json({ url: `${origin}/dashboard?billing=updated`, updated: true });
  }

  const subscriptionData = {
    metadata: {
      userId: currentUser?.id || body.userId || "",
      planId: plan.id,
      termId: term.id,
    },
  };
  if (!hasPriorSubscription) {
    subscriptionData.trial_period_days = 14;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    client_reference_id: currentUser?.id || body.userId || undefined,
    customer_email: currentUser?.email || body.email || undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    metadata: {
      userId: currentUser?.id || body.userId || "",
      planId: plan.id,
      termId: term.id,
    },
    subscription_data: subscriptionData,
  });

  return Response.json({ url: session.url });
}
