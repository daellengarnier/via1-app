"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type { ReactNode } from "react";

// Monochrom Line-Art SVG Icons — passend zum Text-Style
function HomeIcon() {
  return <span className="text-lg leading-none">⌂</span>;
}

function CheckIcon() {
  return <span className="text-lg leading-none">✓</span>;
}

function EinkaufIcon() {
  // Einkaufskorb (Line-Art, monochrom) — etwas groesser
  return (
    <svg
      width="24"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="-mt-0.5"
    >
      {/* Bügel */}
      <path d="M7 10V8a5 5 0 0110 0v2" />
      {/* Korb */}
      <path d="M4 10h16l-1.5 9a2 2 0 01-2 1.7H7.5a2 2 0 01-2-1.7L4 10z" />
    </svg>
  );
}

function KalenderIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </svg>
  );
}

function HausIcon() {
  return (
    <svg
      width="20"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

function AktivitaetIcon() {
  // Pilz (Fliegenpilz-Stil, monochrom)
  return (
    <svg
      width="20"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Hut */}
      <path d="M3 12a9 6 0 0118 0z" />
      {/* Stiel */}
      <path d="M10 12v6a2 2 0 004 0v-6" />
      {/* Punkte auf dem Hut */}
      <circle cx="8" cy="9" r="0.8" fill="currentColor" />
      <circle cx="12" cy="7.5" r="0.8" fill="currentColor" />
      <circle cx="16" cy="9" r="0.8" fill="currentColor" />
    </svg>
  );
}

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: "/", label: "HOME", icon: <HomeIcon /> },
  { href: "/termine", label: "TERMINE", icon: <KalenderIcon /> },
  { href: "/aufgaben", label: "AUFGABEN", icon: <CheckIcon /> },
  { href: "/einkauf", label: "BESCHAFFUNG", icon: <EinkaufIcon /> },
  { href: "/aktivitaeten", label: "AKTIVITÄT", icon: <AktivitaetIcon /> },
  { href: "/meine-wg", label: "MEINE WG", icon: <HausIcon /> },
];

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user?.roles ?? []).includes("ADMIN");
  const visibleItems = navItems.filter((i) => !i.adminOnly || isAdmin);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-800 bg-black/95"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
    >
      <div className="mx-auto flex max-w-lg px-2">
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                isActive
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <span className="flex h-[18px] items-center">{item.icon}</span>
              <span className="whitespace-nowrap font-display text-[9px] font-bold tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
