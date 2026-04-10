import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "via1-app",
  description: "Organisation der Hausgemeinschaft",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
