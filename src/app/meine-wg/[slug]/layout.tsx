import { WgBackground } from "@/components/WgBackground";

// Schwarzer Hintergrund mit nur weiss-leuchtenden, fliegenden Partikeln.
// Keine Glow-Spots, keine Themen-Farbe.
export default function MeineWgSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WgBackground />
      {children}
    </>
  );
}
