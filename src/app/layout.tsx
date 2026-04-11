import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ConditionalNav } from "@/components/ConditionalNav";

export const metadata: Metadata = {
  title: "VIA1 – Hausgemeinschaft",
  description: "Organisations-App für die Wohngemeinschaft Via 1, Spinnereiweg 17, Bern",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VIA1",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen bg-dark font-sans antialiased">
        <div className="mx-auto max-w-lg">{children}</div>
        <ConditionalNav />
      </body>
    </html>
  );
}
