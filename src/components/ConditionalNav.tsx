"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { HamburgerMenu } from "@/components/HamburgerMenu";

const publicPaths = ["/login", "/setup"];

export function ConditionalNav() {
  const pathname = usePathname();
  const isPublicPage = publicPaths.some((p) => pathname.startsWith(p));

  if (isPublicPage) return null;

  return (
    <>
      <HamburgerMenu />
      <BottomNav />
    </>
  );
}
