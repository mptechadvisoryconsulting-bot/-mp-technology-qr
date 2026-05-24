import Stripe from "stripe";
import { createAdminSupabase } from "../../../../lib/supabase-admin";

export async function POST(request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "Login required." }, { status: 401 });
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json(
      {
        error: "Stripe billing is not connected yet. Add STRIPE_SECRET_KEY and the plan price IDs in Vercel before using the billing portal.",
        next: "/pricing",
      },
      { status: 501 },
    );
  }

  const supabase = createAdminSupabase();
  const { data: authData } = await supabase.auth.getUser(token);
  const user = authData.user;
  if (!user) return Response.json({ error: "Login required." }, { status: 401 });

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription?.stripe_customer_id) {
    return Response.json(
      {
        error: "This account does not have a Stripe billing customer yet. Choose a paid plan first, then the billing portal will open.",
        next: "/pricing",
      },
      { status: 404 },
    );
  }

  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://app.scanops.io";
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${origin}/dashboard`,
  });

  return Response.json({ url: session.url });
}
