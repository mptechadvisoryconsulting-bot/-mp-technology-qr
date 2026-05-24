import { createAdminSupabase } from "../../../../lib/supabase-admin";

export async function POST(request) {
  const user = await getRequestUser(request);
  const ownerEmails = getOwnerEmails();
  if (!ownerEmails.length) {
    return Response.json({ error: "Add OWNER_EMAILS in Vercel to enable owner actions." }, { status: 403 });
  }
  if (!user || !ownerEmails.includes(user.email?.toLowerCase())) {
    return Response.json({ error: "Owner access only." }, { status: 403 });
  }

  const body = await request.json();
  const accountId = String(body.accountId || "").trim();
  const action = String(body.action || "").trim();
  if (!accountId) return Response.json({ error: "Account ID is required." }, { status: 400 });
  if (!["suspend", "restore"].includes(action)) return Response.json({ error: "Unknown owner action." }, { status: 400 });

  const supabase = createAdminSupabase();
  const suspendedAt = action === "suspend" ? new Date().toISOString() : null;
  const { error } = await supabase
    .from("accounts")
    .update({ suspended_at: suspendedAt, updated_at: new Date().toISOString() })
    .eq("id", accountId);
  if (error) return Response.json({ error: error.message }, { status: 400 });

  await supabase.from("audit_logs").insert({
    account_id: accountId,
    user_id: user.id,
    action: `owner.${action}_account`,
    entity_type: "account",
    entity_id: accountId,
  });

  return Response.json({ ok: true, suspendedAt });
}

async function getRequestUser(request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const supabase = createAdminSupabase();
  const { data } = await supabase.auth.getUser(token);
  return data.user || null;
}

function getOwnerEmails() {
  return (process.env.OWNER_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
