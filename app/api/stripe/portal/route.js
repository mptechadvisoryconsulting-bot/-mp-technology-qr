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
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription?.stripe_customer_id) {
    return Response.json({ error: "No Stripe customer found yet. Start a plan first." }, { status: 404 });
  }

  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://mp-technology-qr.vercel.app";
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${origin}/dashboard`,
  });

  return Response.json({ url: session.url });
}
