"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/termine", label: "Termine", icon: "◉" },
  { href: "/aufgaben", label: "Aufgaben", icon: "✓" },
  { href: "/sauna", label: "Sauna", icon: "♨" },
  { href: "/profil", label: "Profil", icon: "◎" },
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
              <span className="text-lg">{item.icon}</span>
              <span className="font-mono">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
