"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function WohnwagenIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
    >
      <rect x="2" y="6" width="14" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M16 10H18.5V13H16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="15" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="13" cy="15" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="4" y1="9" x2="8" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="10" y1="9" x2="14" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

const navItems = [
  { href: "/", label: "Home", icon: <span className="text-lg">⌂</span> },
  { href: "/termine", label: "Termine", icon: <span className="text-lg">◉</span> },
  { href: "/aufgaben", label: "Aufgaben", icon: <span className="text-lg">✓</span> },
  { href: "/sauna", label: "Sauna", icon: <span className="text-lg">♨</span> },
  { href: "/gaesti", label: "Gästi", icon: <WohnwagenIcon /> },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-800 bg-dark/95 backdrop-blur-sm">
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
              {item.icon}
              <span className="font-mono">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
