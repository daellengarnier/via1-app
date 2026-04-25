"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { HamburgerMenu } from "@/components/HamburgerMenu";

const publicPaths = ["/login", "/setup", "/registrieren"];
const hiddenPaths = ["/tetris"];

export function ConditionalNav() {
  const pathname = usePathname();
  const isPublicPage = publicPaths.some((p) => pathname.startsWith(p));
  const isHidden = hiddenPaths.some((p) => pathname.startsWith(p));

  if (isPublicPage || isHidden) return null;

  return (
    <>
      <HamburgerMenu />
      <BottomNav />
    </>
  );
}
