import { createAdminSupabase } from "../../../../lib/supabase-admin";
import { getPlanLimits } from "../../../../lib/pricing";

export async function POST(request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const body = await request.json();
  if (!token) return Response.json({ error: "Login required." }, { status: 401 });
  if (!body.email || !body.accountId) return Response.json({ error: "Email and account are required." }, { status: 400 });

  const supabase = createAdminSupabase();
  const { data: authData } = await supabase.auth.getUser(token);
  const requester = authData.user;
  if (!requester) return Response.json({ error: "Login required." }, { status: 401 });

  const { data: account } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", body.accountId)
    .eq("owner_user_id", requester.id)
    .maybeSingle();
  if (!account) return Response.json({ error: "Only the account owner can invite users." }, { status: 403 });

  const { count } = await supabase
    .from("account_members")
    .select("id", { count: "exact", head: true })
    .eq("account_id", account.id);
  const { userLimit } = getPlanLimits(account.plan || "free");
  if ((count || 0) >= userLimit) {
    return Response.json({ error: `Seat limit reached for the ${account.plan || "free"} plan.` }, { status: 400 });
  }

  const { data: inviteData, error } = await supabase.auth.admin.inviteUserByEmail(body.email, {
    data: {
      company_name: account.company_name,
      invited_account_id: account.id,
      invited_role: "member",
      username: body.username || body.email.split("@")[0],
    },
  });
  if (error) return Response.json({ error: error.message }, { status: 400 });

  return Response.json({ ok: true, userId: inviteData.user?.id || null });
}
