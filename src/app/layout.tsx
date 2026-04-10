import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "via1-app",
  description: "Organisations-App fuer die Wohngemeinschaft Via 1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-dark font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
