"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";

const publicPaths = ["/login", "/setup"];

export function ConditionalNav() {
  const pathname = usePathname();
  const isPublicPage = publicPaths.some((p) => pathname.startsWith(p));

  if (isPublicPage) return null;

  return <BottomNav />;
}
