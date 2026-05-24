import { createAdminSupabase } from "../../../../lib/supabase-admin";
import { getPlanLimits } from "../../../../lib/pricing";
import { checkRateLimit } from "../../../../lib/rate-limit";

export async function POST(request) {
  const rate = checkRateLimit(request, "team-invite", 15, 60000);
  if (!rate.allowed) return Response.json({ error: "Too many invite attempts. Try again shortly." }, { status: 429 });

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const body = await request.json();
  if (!token) return Response.json({ error: "Login required." }, { status: 401 });
  const email = String(body.email || "").trim().toLowerCase();
  const accountId = String(body.accountId || "").trim();
  if (!email || !accountId) return Response.json({ error: "Email and account are required." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Enter a valid invite email." }, { status: 400 });

  const supabase = createAdminSupabase();
  const { data: authData } = await supabase.auth.getUser(token);
  const requester = authData.user;
  if (!requester) return Response.json({ error: "Login required." }, { status: 401 });

  const { data: account } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", accountId)
    .eq("owner_user_id", requester.id)
    .maybeSingle();
  if (!account) return Response.json({ error: "Only the account owner can invite users." }, { status: 403 });

  const { count } = await supabase
    .from("account_members")
    .select("id", { count: "exact", head: true })
    .eq("account_id", account.id);
  const { userLimit } = getPlanLimits(account.plan || "free");
  if ((count || 0) >= userLimit) {
    return Response.json(
      { error: `Seat cap is locked for the ${account.plan || "free"} plan. Upgrade before inviting another user.` },
      { status: 400 },
    );
  }

  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://app.scanops.io";
  const { data: inviteData, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin.replace(/\/$/, "")}/login`,
    data: {
      company_name: account.company_name,
      invited_account_id: account.id,
      invited_role: "member",
      username: sanitizeUsername(body.username) || email.split("@")[0],
    },
  });
  if (error) {
    return Response.json(
      {
        error: `${error.message}. Check that Supabase Auth email invites are enabled and the Site URL points to your Vercel domain.`,
      },
      { status: 400 },
    );
  }

  return Response.json({ ok: true, userId: inviteData.user?.id || null });
}

function sanitizeUsername(value) {
  return String(value || "")
    .replace(/[^a-z0-9_.-]/gi, "")
    .slice(0, 40);
}
