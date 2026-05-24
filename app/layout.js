import "./globals.css";

export const metadata = {
  title: "QR Operations",
  description: "Operational QR automation SaaS with customer workspaces.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
