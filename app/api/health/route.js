import { createAdminSupabase } from "../../../lib/supabase-admin";

export async function GET() {
  const startedAt = Date.now();
  const checks = {
    app: "ok",
    database: "unknown",
    stripe: process.env.STRIPE_SECRET_KEY ? "configured" : "missing",
    supabase: process.env.NEXT_PUBLIC_SUPABASE_URL ? "configured" : "missing",
  };

  try {
    const supabase = createAdminSupabase();
    const { error } = await supabase.from("accounts").select("id", { count: "exact", head: true });
    checks.database = error ? "error" : "ok";
  } catch {
    checks.database = "error";
  }

  const healthy = checks.database === "ok";
  return Response.json(
    {
      status: healthy ? "ok" : "degraded",
      checks,
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
