"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Monochrom Line-Art SVG Icons — passend zum Text-Style
function HomeIcon() {
  return <span className="text-lg leading-none">⌂</span>;
}

function CheckIcon() {
  return <span className="text-lg leading-none">✓</span>;
}

function SaunaIcon() {
  return <span className="text-lg leading-none">♨</span>;
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

function AktivitaetIcon() {
  return (
    <svg
      width="20"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
    </svg>
  );
}

const navItems: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/", label: "HOME", icon: <HomeIcon /> },
  { href: "/termine", label: "TERMINE", icon: <KalenderIcon /> },
  { href: "/aufgaben", label: "AUFGABEN", icon: <CheckIcon /> },
  { href: "/sauna", label: "SAUNA", icon: <SaunaIcon /> },
  { href: "/aktivitaeten", label: "AKTIVITÄT", icon: <AktivitaetIcon /> },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-800 bg-black/90">
      <div className="mx-auto flex max-w-lg">
        {navItems.map((item) => {
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
                  ? "text-accent"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <span className="flex h-[18px] items-center">{item.icon}</span>
              <span className="font-display text-[9px] font-bold tracking-wider">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
