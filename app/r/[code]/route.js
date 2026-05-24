import { NextResponse } from "next/server";
import { createAdminSupabase } from "../../../lib/supabase-admin";
import { getPlanLimits } from "../../../lib/pricing";

const DEFAULT_PUBLIC_SITE_URL = "https://mp-technology-qr.vercel.app";

export async function GET(request, { params }) {
  const { code } = await params;
  const supabase = createAdminSupabase();
  const { data: qrCode, error } = await supabase
    .from("qr_codes")
    .select("id, user_id, account_id, type, destination_url")
    .eq("short_code", code)
    .eq("is_dynamic", true)
    .maybeSingle();

  if (error || !qrCode) {
    return new Response(renderNotFoundPage(code), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const userAgent = request.headers.get("user-agent") || "";
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ipAddress = forwarded.split(",")[0]?.trim() || null;
  let planId = "free";
  if (qrCode.account_id) {
    const { data: account } = await supabase.from("accounts").select("plan").eq("id", qrCode.account_id).maybeSingle();
    planId = account?.plan || "free";
  } else {
    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", qrCode.user_id).maybeSingle();
    planId = profile?.plan || "free";
  }
  const { scanLimit } = getPlanLimits(planId);
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("qr_scans")
    .select("id, qr_codes!inner(user_id)", { count: "exact", head: true })
    .eq(qrCode.account_id ? "qr_codes.account_id" : "qr_codes.user_id", qrCode.account_id || qrCode.user_id)
    .gte("scanned_at", monthStart.toISOString());

  if ((count || 0) < scanLimit) {
    await supabase.from("qr_scans").insert({
      qr_code_id: qrCode.id,
      user_agent: userAgent,
      ip_address: ipAddress,
    });
  }

  if (qrCode.type === "text") {
    return new Response(renderTextPage(qrCode.destination_url), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (qrCode.type === "support") {
    return NextResponse.redirect(qrCode.destination_url || `${getPublicSiteUrl()}/support/${code}`);
  }

  if (/^(mailto|tel|sms):/i.test(qrCode.destination_url)) {
    return new Response(renderSchemeRedirect(qrCode.destination_url), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return NextResponse.redirect(normalizeRedirectDestination(qrCode.destination_url));
}

function getPublicSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_PUBLIC_SITE_URL;
  return configuredUrl.replace(/\/$/, "");
}

function renderSchemeRedirect(destination) {
  const safeDestination = JSON.stringify(destination);
  return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Opening QR action</title>
    <script>window.location.replace(${safeDestination});</script>
    <style>
      body{font-family:Arial,sans-serif;margin:0;min-height:100vh;display:grid;place-items:center;background:#f4f7fb;color:#101828}
      main{max-width:520px;padding:28px;border:1px solid #d9e2ec;border-radius:14px;background:#fff}
      a{color:#0f766e;font-weight:800}
    </style>
  </head>
  <body>
    <main>
      <h1>Opening your QR action...</h1>
      <p>If nothing happens, <a href=${safeDestination}>tap here</a>.</p>
    </main>
  </body>
</html>`;
}

function renderTextPage(text) {
  const escaped = escapeHtml(text);
  return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>QR Text</title>
    <style>
      body{font-family:Arial,sans-serif;margin:0;min-height:100vh;display:grid;place-items:center;background:#f4f7fb;color:#101828}
      main{max-width:720px;padding:28px;border:1px solid #d9e2ec;border-radius:14px;background:#fff;white-space:pre-wrap;line-height:1.55}
    </style>
  </head>
  <body><main>${escaped}</main></body>
</html>`;
}

function renderNotFoundPage(code) {
  const escapedCode = escapeHtml(code);
  return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>QR link not found</title>
    <style>
      body{font-family:Arial,sans-serif;margin:0;min-height:100vh;display:grid;place-items:center;background:#f4f7fb;color:#101828}
      main{max-width:560px;padding:28px;border:1px solid #d9e2ec;border-radius:14px;background:#fff;line-height:1.55}
      a{color:#0f766e;font-weight:800}
    </style>
  </head>
  <body>
    <main>
      <h1>QR link not found.</h1>
      <p>The tracked code <strong>${escapedCode}</strong> is not saved, was deleted, or has not been deployed yet.</p>
      <p><a href="/">Return to the QR platform</a></p>
    </main>
  </body>
</html>`;
}

function normalizeRedirectDestination(value) {
  if (!value) return getPublicSiteUrl();
  const trimmed = String(value).trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(mailto|tel|sms):/i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
