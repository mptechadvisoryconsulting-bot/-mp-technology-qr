import Stripe from "stripe";
import { createAdminSupabase } from "../../../../lib/supabase-admin";

export async function POST(request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeSecretKey || !webhookSecret) {
    return Response.json({ error: "Stripe webhook is not configured." }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();
  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    await saveCheckoutSession(event.data.object);
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    await saveSubscription(event.data.object);
  }

  return Response.json({ received: true });
}

async function saveCheckoutSession(session) {
  if (!session.subscription || !session.metadata?.userId) return;

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  await saveSubscription(subscription, session.metadata.userId, session.customer);
}

async function saveSubscription(subscription, fallbackUserId, fallbackCustomerId) {
  const userId = subscription.metadata?.userId || fallbackUserId;
  if (!userId) return;

  const supabase = createAdminSupabase();
  const trialEndsAt = toIso(subscription.trial_end);
  const currentPeriodEndsAt = toIso(subscription.current_period_end);

  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: subscription.customer || fallbackCustomerId || null,
      stripe_subscription_id: subscription.id,
      plan: subscription.metadata?.planId || "unknown",
      billing_term: subscription.metadata?.termId || "unknown",
      status: subscription.status,
      trial_ends_at: trialEndsAt,
      current_period_ends_at: currentPeriodEndsAt,
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      canceled_at: toIso(subscription.canceled_at),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );

  const paidAccess =
    subscription.status === "active" ||
    subscription.status === "trialing" ||
    (subscription.cancel_at_period_end && subscription.current_period_end && subscription.current_period_end * 1000 > Date.now());
  const plan = paidAccess ? subscription.metadata?.planId : "free";

  await supabase.from("profiles").update({ plan }).eq("id", userId);
  const { data: profile } = await supabase.from("profiles").select("account_id").eq("id", userId).maybeSingle();
  if (profile?.account_id) {
    await supabase.from("accounts").update({ plan, updated_at: new Date().toISOString() }).eq("id", profile.account_id);
  }
}

function toIso(unixSeconds) {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null;
}
