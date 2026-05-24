import "./globals.css";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_MARKETING_URL || "https://scanops.io"),
  title: {
    default: "ScanOps | Operational QR Automation",
    template: "%s | ScanOps",
  },
  description: "ScanOps is a multi-tenant SaaS platform for dynamic QR codes, operational analytics, workflow automation, and business support experiences.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ScanOps",
    description: "Operational QR automation, analytics, and workflow intelligence for business teams.",
    url: "https://scanops.io",
    siteName: "ScanOps",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ScanOps",
    description: "Dynamic QR management and operational intelligence for business workflows.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
