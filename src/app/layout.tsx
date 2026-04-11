import type { Metadata } from "next";
import "./globals.css";
import { ConditionalNav } from "@/components/ConditionalNav";

export const metadata: Metadata = {
  title: "via1-app",
  description: "Organisations-App für die Wohngemeinschaft Via 1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-dark font-sans antialiased">
        <div className="mx-auto max-w-lg">{children}</div>
        <ConditionalNav />
      </body>
    </html>
  );
}
