import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ConditionalNav } from "@/components/ConditionalNav";
export const metadata: Metadata = {
  title: "Via 1 – Hausgemeinschaft",
  description: "Organisations-App für die Wohngemeinschaft Via 1, Spinnereiweg 17, Bern",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Via 1",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        {/* Tab-Icons + Pyramide vorladen, damit sie sofort beim ersten
            Paint ohne sichtbaren "Rand"-Flash angezeigt werden */}
        <link rel="preload" as="image" href="/pyramid.webp" />
        <link rel="preload" as="image" href="/icon-termine.webp" />
        <link rel="preload" as="image" href="/icon-aufgaben.webp" />
        <link rel="preload" as="image" href="/icon-sauna.webp" />
        <link rel="preload" as="image" href="/icon-gaesti.webp" />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <div className="relative mx-auto max-w-lg">{children}</div>
        <ConditionalNav />
      </body>
    </html>
  );
}
