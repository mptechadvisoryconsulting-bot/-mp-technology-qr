export async function POST(request) {
  const body = await request.json();
  const webhookUrl = process.env.OWNER_ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    return Response.json({ ok: true, skipped: "OWNER_ALERT_WEBHOOK_URL is not configured." });
  }

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `New QR SaaS account: ${body.company || "Customer"} (${body.email || "no email"})`,
      event: "new_account",
      company: body.company,
      email: body.email,
      username: body.username,
      createdAt: new Date().toISOString(),
    }),
  });

  return Response.json({ ok: true });
}
