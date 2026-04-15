"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useCurrentKaffee } from "@/lib/kaffee-store";

interface MehrItem {
  id: string;
  href: string;
  // Entweder ein Bildpfad (wenn mit / beginnend) oder ein Emoji
  icon: string;
  glowClass?: string;
  title: string;
  subtitle: string;
}

const MEHR_ITEMS: MehrItem[] = [
  {
    id: "bewohnende",
    href: "/bewohnende",
    icon: "/pic-bewohnende.webp",
    glowClass: "glow-green",
    title: "WGs & Bewohnende",
    subtitle: "Zimmer, Schluessel, Historie",
  },
  {
    id: "sauna",
    href: "/sauna",
    icon: "/icon-sauna.webp",
    glowClass: "glow-red",
    title: "Sauna",
    subtitle: "Heizen & Regeln",
  },
  {
    id: "gaesti",
    href: "/gaesti",
    icon: "/icon-gaesti.webp",
    glowClass: "glow-blue",
    title: "Gästewohnwagen",
    subtitle: "Buchungen & Belegung",
  },
  {
    id: "hausbuch",
    href: "/hausbuch",
    icon: "/pic-hausbuch.webp",
    glowClass: "glow-violet",
    title: "Hausbuch",
    subtitle: "Wissen & Infos",
  },
  {
    id: "flohmi",
    href: "/flohmi",
    icon: "/pic-flohmi.webp",
    glowClass: "glow-pink",
    title: "Flohmi",
    subtitle: "Dinge zum Weitergeben",
  },
];

const PINS_KEY = "via1-mehr-pins";

interface Notification {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

function formatAge(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "jetzt";
  if (mins < 60) return `vor ${mins} Min.`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `vor ${hrs} Std.`;
  const days = Math.floor(hrs / 24);
  return `vor ${days} ${days === 1 ? "Tag" : "Tagen"}`;
}

export function HamburgerMenu() {
  const { data: session } = useSession();
  const isAdmin = (session?.user?.roles || []).includes("ADMIN");
  const [open, setOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [pinned, setPinned] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [kaffeeState] = useCurrentKaffee();
  const [hasKaffeeAbo, setHasKaffeeAbo] = useState(false);
  const notifCount = notifications.length;

  // Kaffee-Abo Status vom Profil laden
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) return;
        const data = (await res.json()) as { hasKaffeeAbo?: boolean };
        if (!cancelled) setHasKaffeeAbo(Boolean(data.hasKaffeeAbo));
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Notifications laden
  const loadNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as Notification[];
      setNotifications(data);
    } catch {
      // ignore
    }
  };
  useEffect(() => {
    loadNotifications();
    // Alle 60s pollen
    const id = setInterval(loadNotifications, 60000);
    return () => clearInterval(id);
  }, []);

  // Pins aus localStorage laden
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(PINS_KEY);
      if (stored) setPinned(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  function togglePin(id: string) {
    setPinned((prev) => {
      const next = prev.includes(id)
        ? prev.filter((p) => p !== id)
        : [...prev, id];
      if (typeof window !== "undefined") {
        localStorage.setItem(PINS_KEY, JSON.stringify(next));
      }
      return next;
    });
  }

  // Sortierung: Angeheftete zuerst (in Pin-Reihenfolge), dann Rest
  const sortedMehr = [
    ...pinned
      .map((id) => MEHR_ITEMS.find((i) => i.id === id))
      .filter((i): i is MehrItem => !!i),
    ...MEHR_ITEMS.filter((i) => !pinned.includes(i.id)),
  ];

  async function dismissNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    } catch {
      // ignore
    }
  }

  async function clearAllNotifications() {
    setNotifications([]);
    try {
      await fetch("/api/notifications", { method: "DELETE" });
    } catch {
      // ignore
    }
  }

  return (
    <>
      {/* Notification Bell — LINKS */}
      <button
        onClick={() => setShowNotifs(!showNotifs)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-black/80 backdrop-blur-sm transition-colors hover:border-accent"
        aria-label="Benachrichtigungen"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {notifCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-white">
            {notifCount}
          </span>
        )}
      </button>

      {/* Hamburger Button — RECHTS */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-black/80 backdrop-blur-sm transition-colors hover:border-accent"
        aria-label="Menu öffnen"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Notification Dropdown */}
      {showNotifs && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
          <div className="fixed left-4 top-16 z-50 w-72 rounded-lg border border-gray-800 bg-black/95 p-3 shadow-xl backdrop-blur-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display text-[10px] font-bold uppercase tracking-widest text-accent">
                BENACHRICHTIGUNGEN
              </p>
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="font-mono text-[9px] text-gray-500 hover:text-red-400"
                >
                  ALLE LÖSCHEN
                </button>
              )}
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {notifications.map((n) => {
                const content = (
                  <>
                    <p className="text-xs font-semibold text-gray-200">
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="mt-0.5 text-[10px] text-gray-400">
                        {n.body}
                      </p>
                    )}
                    <p className="mt-0.5 text-[9px] text-gray-600">
                      {formatAge(n.createdAt)}
                    </p>
                  </>
                );
                return (
                  <div
                    key={n.id}
                    className="group relative rounded border border-white/5 bg-white/3 p-2 pr-6"
                  >
                    {n.link ? (
                      <Link
                        href={n.link}
                        onClick={() => setShowNotifs(false)}
                        className="block"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div>{content}</div>
                    )}
                    <button
                      onClick={() => dismissNotification(n.id)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center text-gray-600 hover:text-red-400"
                      aria-label="Benachrichtigung entfernen"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
              {notifications.length === 0 && (
                <p className="py-3 text-center text-xs text-gray-600">
                  Keine neuen Benachrichtigungen
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-in Menu */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] transform border-l border-gray-800 bg-dark transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div
          className="flex h-full flex-col overflow-y-auto overscroll-contain p-5"
          style={{
            paddingTop: "calc(1.25rem + env(safe-area-inset-top, 0px))",
            paddingBottom:
              "calc(1.25rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {/* Close */}
          <button
            onClick={() => setOpen(false)}
            className="mb-6 self-end text-gray-500 hover:text-white"
            aria-label="Menu schliessen"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* Profil Link */}
          <Link
            href="/profil"
            onClick={() => setOpen(false)}
            className="mb-6 flex items-center gap-3 rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-4 transition-colors hover:border-accent"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-lg font-bold text-accent">
              A
            </div>
            <div>
              <p className="font-medium text-white">Mein Profil</p>
            </div>
          </Link>

          {/* Meine Abos — nur wenn Kaffee-Abo aktiv */}
          {hasKaffeeAbo && (
            <>
              <h2 className="mb-3 font-display text-[10px] font-bold uppercase tracking-widest text-accent">
                MEINE ABOS
              </h2>
              <div className="mb-6 space-y-2">
                <Link
                  href="/kaffee"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg border border-amber-600/30 bg-amber-700/10 p-3 transition-colors hover:border-amber-500"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/pic-kaffee.webp"
                    alt=""
                    className="menu-item-icon glow-amber"
                    loading="eager"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-amber-200">
                      Kaffee-Abo
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {kaffeeState.kaffee.name}
                      {kaffeeState.changedBy
                        ? ` · von ${kaffeeState.changedBy}`
                        : ""}
                    </p>
                  </div>
                </Link>
              </div>
            </>
          )}

          {/* Mehr */}
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[10px] font-bold uppercase tracking-widest text-accent">
              WEITERES
            </h2>
            <span className="font-mono text-[9px] text-gray-600">
              📌 zum Anheften
            </span>
          </div>
          <div className="mb-6 space-y-2">
            {sortedMehr.map((item) => {
              const isPinned = pinned.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 rounded-lg border p-3 transition-colors ${
                    isPinned
                      ? "border-accent/40 bg-accent/5"
                      : "border-gray-800 bg-gray-900/40 hover:border-accent"
                  }`}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    {item.icon.startsWith("/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.icon}
                        alt=""
                        className={`menu-item-icon ${item.glowClass ?? ""}`}
                        loading="eager"
                      />
                    ) : (
                      <span className="text-lg">{item.icon}</span>
                    )}
                    <p className="min-w-0 flex-1 truncate font-medium text-white">
                      {item.title}
                    </p>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      togglePin(item.id);
                    }}
                    className={`rounded p-1.5 text-sm transition-colors ${
                      isPinned
                        ? "text-accent"
                        : "text-gray-600 hover:text-accent"
                    }`}
                    aria-label={isPinned ? "Abheften" : "Anheften"}
                  >
                    {isPinned ? "📌" : "📍"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Feedback */}
          <Link
            href="/feedback"
            onClick={() => setOpen(false)}
            className="block rounded-lg border border-accent/30 bg-accent/5 py-3 text-center font-display text-[10px] font-bold uppercase tracking-widest text-accent transition-colors hover:bg-accent/10"
          >
            IDEE ODER BUG MELDEN
          </Link>

          {/* Admin — nur fuer Admins */}
          {isAdmin && (
            <Link
              href="/admin/users"
              onClick={() => setOpen(false)}
              className="mt-3 block rounded-lg border border-orange-500/40 bg-orange-500/10 py-3 text-center font-display text-[10px] font-bold uppercase tracking-widest text-orange-300 transition-colors hover:bg-orange-500/20"
            >
              ADMIN · USER-VERWALTUNG
            </Link>
          )}

          {/* Abmelden */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-3 w-full rounded-lg border border-gray-700 py-2 font-display text-[10px] font-bold uppercase tracking-widest text-gray-400 transition-colors hover:border-red-500 hover:text-red-400"
          >
            ABMELDEN
          </button>
        </div>
      </div>
    </>
  );
}
