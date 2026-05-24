import { createAdminSupabase } from "../../../lib/supabase-admin";
import { checkRateLimit } from "../../../lib/rate-limit";

export async function POST(request) {
  const rate = checkRateLimit(request, "support-ticket", 10, 60000);
  if (!rate.allowed) return Response.json({ error: "Too many support requests. Try again shortly." }, { status: 429 });

  const body = await request.json();
  const code = String(body.code || "").trim();
  const subject = String(body.subject || "").trim();
  const message = String(body.message || "").trim();

  if (!code || !subject || !message) {
    return Response.json({ error: "Code, subject, and message are required." }, { status: 400 });
  }

  const supabase = createAdminSupabase();
  const { data: qrCode, error } = await supabase
    .from("qr_codes")
    .select("id, account_id, name")
    .eq("short_code", code)
    .eq("is_dynamic", true)
    .maybeSingle();

  if (error || !qrCode?.account_id) {
    return Response.json({ error: "Support QR code was not found." }, { status: 404 });
  }

  const { error: insertError } = await supabase.from("support_tickets").insert({
    account_id: qrCode.account_id,
    qr_code_id: qrCode.id,
    requester_name: String(body.name || "").trim() || null,
    requester_email: String(body.email || "").trim() || null,
    subject,
    message,
  });

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  const webhookUrl = process.env.OWNER_ALERT_WEBHOOK_URL;
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `New QR support request: ${subject}`,
        event: "support_ticket",
        qrName: qrCode.name,
        requesterName: body.name,
        requesterEmail: body.email,
        createdAt: new Date().toISOString(),
      }),
    }).catch(() => {});
  }

  return Response.json({ ok: true });
}
