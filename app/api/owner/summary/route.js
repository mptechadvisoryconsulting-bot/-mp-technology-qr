import { createAdminSupabase } from "../../../../lib/supabase-admin";

export async function GET(request) {
  const user = await getRequestUser(request);
  const ownerEmails = getOwnerEmails();
  if (!ownerEmails.length) {
    return Response.json({ error: "Add OWNER_EMAILS in Vercel to enable the owner dashboard." }, { status: 403 });
  }
  if (!user || !ownerEmails.includes(user.email?.toLowerCase())) {
    return Response.json({ error: "Owner access only." }, { status: 403 });
  }

  const supabase = createAdminSupabase();
  const [{ data: usersData }, { data: profiles }, { data: qrCodes }, { data: scans }, { data: subscriptions }] =
    await Promise.all([
      supabase.auth.admin.listUsers({ page: 1, perPage: 200 }),
      supabase.from("profiles").select("*"),
      supabase.from("qr_codes").select("id, user_id, account_id, is_dynamic, created_at"),
      supabase.from("qr_scans").select("id, qr_code_id, scanned_at"),
      supabase.from("subscriptions").select("*"),
    ]);

  const qrByUser = groupBy(qrCodes || [], "user_id");
  const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const subscriptionByUser = new Map((subscriptions || []).map((sub) => [sub.user_id, sub]));
  const qrOwnerById = new Map((qrCodes || []).map((code) => [code.id, code.user_id]));
  const scansByUser = new Map();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  for (const scan of scans || []) {
    const ownerId = qrOwnerById.get(scan.qr_code_id);
    if (!ownerId) continue;
    const current = scansByUser.get(ownerId) || { total: 0, month: 0 };
    current.total += 1;
    if (new Date(scan.scanned_at) >= monthStart) current.month += 1;
    scansByUser.set(ownerId, current);
  }

  const accounts = (usersData?.users || []).map((account) => {
    const accountCodes = qrByUser.get(account.id) || [];
    const accountScans = scansByUser.get(account.id) || { total: 0, month: 0 };
    const profile = profileById.get(account.id);
    const subscription = subscriptionByUser.get(account.id);
    return {
      id: account.id,
      email: account.email,
      company: profile?.company_name || account.user_metadata?.company_name || "Customer",
      createdAt: account.created_at,
      plan: subscription?.plan || profile?.plan || "free",
      status: subscription?.status || "free",
      qrCount: accountCodes.length,
      dynamicCount: accountCodes.filter((code) => code.is_dynamic).length,
      scanCount: accountScans.total,
      monthlyScanCount: accountScans.month,
    };
  });

  accounts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return Response.json({
    totals: {
      accounts: accounts.length,
      dynamicCodes: accounts.reduce((sum, account) => sum + account.dynamicCount, 0),
      scans: accounts.reduce((sum, account) => sum + account.scanCount, 0),
      monthlyScans: accounts.reduce((sum, account) => sum + account.monthlyScanCount, 0),
    },
    accounts,
  });
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

function groupBy(rows, key) {
  return rows.reduce((map, row) => {
    const value = row[key];
    const group = map.get(value) || [];
    group.push(row);
    map.set(value, group);
    return map;
  }, new Map());
}
