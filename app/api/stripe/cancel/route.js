import Stripe from "stripe";
import { createAdminSupabase } from "../../../../lib/supabase-admin";

export async function POST(request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "Login required." }, { status: 401 });
  if (!process.env.STRIPE_SECRET_KEY) return Response.json({ error: "Stripe is not configured." }, { status: 400 });

  const supabase = createAdminSupabase();
  const { data: authData } = await supabase.auth.getUser(token);
  const user = authData.user;
  if (!user) return Response.json({ error: "Login required." }, { status: 401 });

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription?.stripe_subscription_id) {
    return Response.json({ error: "No active subscription found." }, { status: 404 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const updated = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    cancel_at_period_end: true,
  });

  await supabase
    .from("subscriptions")
    .update({
      cancel_at_period_end: true,
      current_period_ends_at: updated.current_period_end ? new Date(updated.current_period_end * 1000).toISOString() : subscription.current_period_ends_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscription.id);

  return Response.json({
    ok: true,
    message: "Your plan will stay active until the current paid period ends.",
  });
}
