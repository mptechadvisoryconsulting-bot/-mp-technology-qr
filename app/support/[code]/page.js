import Link from "next/link";
import SupportRequestForm from "../../../components/SupportRequestForm";
import { createAdminSupabase } from "../../../lib/supabase-admin";

export default async function SupportPage({ params }) {
  const { code } = await params;
  const supabase = createAdminSupabase();
  const { data: qrCode } = await supabase
    .from("qr_codes")
    .select("name, short_code, type")
    .eq("short_code", code)
    .eq("is_dynamic", true)
    .maybeSingle();

  if (!qrCode) {
    return (
      <main className="app-shell auth-shell">
        <section className="panel auth-panel">
          <p className="eyebrow">Not found</p>
          <h1>This support QR code is not active.</h1>
          <p className="lead">Check the code or contact the business directly.</p>
          <Link className="secondary-button" href="/">Go back</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell auth-shell">
      <SupportRequestForm code={code} campaignName={qrCode.name} />
    </main>
  );
}
