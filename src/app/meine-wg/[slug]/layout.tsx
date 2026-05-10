import { WgAnimatedBg } from "@/components/WgAnimatedBg";

// Layout fuer den "Meine WG"-Bereich: rendert den bewegten Pink/Fuchsia/Cyan
// Hintergrund als fixed Layer hinter der Page. Ueberschreibt das Standard
// "via-bg" der App.
export default function MeineWgSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WgAnimatedBg />
      {children}
    </>
  );
}
