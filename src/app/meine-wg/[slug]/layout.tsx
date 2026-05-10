import { AnimatedBackground } from "@/components/AnimatedBackground";

// Layout fuer den "Meine WG"-Bereich: schwarzer Hintergrund mit
// weiss-leuchtenden Partikeln + Glow-Spots wie auf den anderen Tabs,
// nur in monochromem Weiss.
export default function MeineWgSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnimatedBackground glowClass="glow-white" showIcon={false} />
      {children}
    </>
  );
}
