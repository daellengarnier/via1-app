"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import {
  wgs,
  roomTypeIcons,
  roomTypeLabels,
} from "@/lib/bewohnende-data";
import type { Room, Wg } from "@/lib/bewohnende-data";
import { RoomDetail } from "@/components/RoomDetail";

interface ApiUser {
  id: string;
  name: string;
  fullName: string;
  favoriteAnimal: string;
  avatar: string | null;
  birthday: string | null;
  diet: string | null;
  allergies: string;
  roomKey: string | null;
  roomNumber: number | null;
  wgName: string | null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (
    parts[0]!.charAt(0).toUpperCase() +
    parts[parts.length - 1]!.charAt(0).toUpperCase()
  );
}

function RoundAvatar({
  user,
  size = 40,
}: {
  user: ApiUser | null;
  size?: number;
}) {
  if (user?.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatar}
        alt={user.name}
        className="shrink-0 rounded-full object-cover ring-1 ring-accent/40"
        style={{ width: size, height: size }}
      />
    );
  }
  if (user) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full bg-accent/20 font-bold text-accent ring-1 ring-accent/40"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initials(user.name)}
      </div>
    );
  }
  return null;
}

function calcAge(birthday: string): number | null {
  const d = new Date(birthday);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function UserProfileModal({
  user,
  onClose,
}: {
  user: ApiUser;
  onClose: () => void;
}) {
  const age = user.birthday ? calcAge(user.birthday) : null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm pt-[env(safe-area-inset-top,0px)]"
      onClick={onClose}
    >
      <div
        className="my-4 w-full max-w-lg overflow-hidden rounded-2xl border border-gray-800 bg-dark pb-[env(safe-area-inset-bottom,0px)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-800 bg-dark/95 px-5 py-4 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <RoundAvatar user={user} size={56} />
              <div>
                <h2 className="text-xl font-bold text-accent">{user.name}</h2>
                {user.fullName && user.fullName !== user.name && (
                  <p className="text-xs text-gray-500">{user.fullName}</p>
                )}
                {user.wgName && user.roomKey && (
                  <p className="mt-0.5 font-mono text-[10px] text-gray-600">
                    {user.wgName} · {user.roomKey}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white"
              aria-label="Schliessen"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 6l12 12M6 18L18 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 p-5">
          {user.diet && (
            <InfoRow label="Isst" value={user.diet} />
          )}
          {user.allergies && user.allergies.trim() !== "" && (
            <InfoRow label="Allergien" value={user.allergies} />
          )}
          {user.favoriteAnimal && (
            <InfoRow label="Lieblingstier" value={user.favoriteAnimal} />
          )}
          {user.birthday && (
            <InfoRow
              label="Geburtstag"
              value={
                new Date(user.birthday).toLocaleDateString("de-CH", {
                  day: "numeric",
                  month: "long",
                }) + (age !== null ? ` (${age})` : "")
              }
            />
          )}
          {!user.diet &&
            !user.allergies &&
            !user.favoriteAnimal &&
            !user.birthday && (
              <p className="text-center text-sm text-gray-600">
                Noch keine weiteren Infos hinterlegt.
              </p>
            )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-white">{value}</p>
    </div>
  );
}

export default function BewohnendePage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? "";
  const [apiUsers, setApiUsers] = useState<ApiUser[]>([]);
  const [selectedWg, setSelectedWg] = useState<Wg>(wgs[0]!);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [showGrundrisse, setShowGrundrisse] = useState(false);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : []))
      .then((u: ApiUser[]) => setApiUsers(u))
      .catch(() => {});
  }, []);

  // Springe in die WG des eingeloggten Users, sobald wir die Users haben
  useEffect(() => {
    const me = apiUsers.find((u) => u.id === currentUserId);
    if (!me || !me.wgName) return;
    const wg = wgs.find((w) => w.name === me.wgName);
    if (wg) setSelectedWg(wg);
  }, [apiUsers, currentUserId]);

  // Staffelung wie im Schnitt: Nordwind unten, Bonzen oben
  const wgOrder: Wg[] = [
    wgs.find((w) => w.slug === "bonzen")!,
    wgs.find((w) => w.slug === "family-wg")!,
    wgs.find((w) => w.slug === "kleenex")!,
    wgs.find((w) => w.slug === "dreiecksbar")!,
    wgs.find((w) => w.slug === "ostblock")!,
    wgs.find((w) => w.slug === "nordwind")!,
  ];

  const zimmer = selectedWg.rooms.filter((r) => r.type === "zimmer");
  const commonRooms = selectedWg.rooms.filter((r) => r.type !== "zimmer");

  // Mapping Zimmer-keyNumber -> API-User
  const usersByRoom = new Map<string, ApiUser>();
  for (const u of apiUsers) {
    if (u.roomKey) usersByRoom.set(u.roomKey, u);
  }

  const occupiedCount = zimmer.filter((r) =>
    usersByRoom.has(r.keyNumber)
  ).length;

  return (
    <div className="relative p-4 pb-24">
      <AnimatedBackground
        icon="/pic-bewohnende.webp"
        glowClass="glow-green"
        showIcon={false}
      />
      <div className="mb-2 flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/pic-bewohnende.webp"
          alt=""
          className="tab-btn-icon glow-green"
          loading="eager"
          fetchPriority="high"
        />
      </div>
      <h1 className="mb-1 text-center font-cinzel text-3xl text-accent">
        WGs & Bewohnende
      </h1>
      <p className="mb-4 text-center text-sm text-accent/70">
        Bewohnende, Zimmer, Schlüssel, Historie & Schäden
      </p>
      <div className="mb-5 flex justify-center">
        <button
          onClick={() => setShowGrundrisse(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-accent transition-colors hover:bg-accent/20"
        >
          📐 Grundrisse anzeigen
        </button>
      </div>

      {/* WG-Auswahl als gestaffelte Buttons (wie Schnitt). */}
      <div className="mb-6 space-y-1">
        {wgOrder.map((wg) => {
          const isActive = wg.slug === selectedWg.slug;
          const isNord = wg.side === "nord";
          const count = wg.rooms
            .filter((r) => r.type === "zimmer")
            .filter((r) => usersByRoom.has(r.keyNumber)).length;
          const total = wg.rooms.filter((r) => r.type === "zimmer").length;
          return (
            <button
              key={wg.slug}
              onClick={() => setSelectedWg(wg)}
              className={`flex w-[88%] items-center justify-between rounded-lg border px-3 py-2 text-left font-mono text-sm transition-all ${
                isNord ? "mr-auto" : "ml-auto"
              } ${
                isActive
                  ? isNord
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-secondary bg-secondary/10 text-secondary"
                  : "border-gray-800 bg-gray-900/40 text-gray-400 hover:border-gray-600"
              }`}
            >
              <span className="font-bold">{wg.name}</span>
              <span className="text-[10px] opacity-70">
                {wg.floor} · {count}/{total}
              </span>
            </button>
          );
        })}
      </div>

      {/* WG Header */}
      <div className="mb-4 rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              {selectedWg.name}
            </h2>
            <p className="text-xs text-gray-500">{selectedWg.floor}</p>
          </div>
          <div>
            <p className="font-mono text-lg font-bold text-accent">
              {occupiedCount}/{zimmer.length}
            </p>
            <p className="text-right text-[10px] text-gray-500">belegt</p>
          </div>
        </div>
      </div>

      {/* Schlafzimmer — mit Bett-Icon, Avatar+Name drunter */}
      <section className="mb-5">
        <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-accent">
          Schlafzimmer
        </h3>
        <div className="space-y-1.5">
          {zimmer.map((room) => {
            const user = usersByRoom.get(room.keyNumber) ?? null;
            const isMine = user?.id === currentUserId;
            const hasOpenDamage = room.damages.some((d) => !d.resolvedAt);
            return (
              <button
                key={room.id}
                onClick={() => {
                  if (user) {
                    setSelectedUser(user);
                  } else {
                    setSelectedRoom(room);
                  }
                }}
                className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left transition-all ${
                  isMine
                    ? "border-accent bg-accent/10 shadow-[0_0_12px_rgba(184,240,104,0.2)]"
                    : user
                      ? "border-accent/30 bg-accent/5 hover:border-accent/60"
                      : "border-gray-800 bg-gray-900/40 hover:border-gray-600"
                }`}
              >
                <span className="mt-0.5 shrink-0 text-lg">
                  {roomTypeIcons[room.type]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm text-gray-300">{room.label}</p>
                    <p className="font-mono text-[10px] text-gray-600">
                      {room.keyNumber}
                    </p>
                    {hasOpenDamage && (
                      <span
                        className="inline-flex items-center gap-0.5 rounded-full bg-red-500/20 px-1.5 py-0.5 font-mono text-[8px] font-bold text-red-300 ring-1 ring-red-500/40"
                        title="Offener Schaden"
                      >
                        ⚠ Schaden
                      </span>
                    )}
                  </div>
                  {user ? (
                    <div className="mt-1.5 flex items-center gap-2">
                      <RoundAvatar user={user} size={28} />
                      <p className="truncate text-sm font-medium text-white">
                        {user.name}
                        {isMine && (
                          <span className="ml-1 text-[10px] text-accent">
                            (du)
                          </span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600">Frei</p>
                  )}
                </div>
                <span className="shrink-0 self-center text-gray-600">›</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Gemeinschaftsraeume — gleiche Liste wie Schlafzimmer */}
      <section>
        <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-accent">
          Gemeinschaftsräume
        </h3>
        <div className="space-y-1.5">
          {commonRooms.map((room) => {
            const hasOpenDamage = room.damages.some((d) => !d.resolvedAt);
            return (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className="flex w-full items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/40 px-3 py-2 text-left transition-all hover:border-gray-600"
              >
                <span className="shrink-0 text-lg">
                  {roomTypeIcons[room.type]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm text-gray-300">{room.label}</p>
                    <p className="font-mono text-[10px] text-gray-600">
                      {room.keyNumber}
                    </p>
                    {hasOpenDamage && (
                      <span
                        className="inline-flex items-center gap-0.5 rounded-full bg-red-500/20 px-1.5 py-0.5 font-mono text-[8px] font-bold text-red-300 ring-1 ring-red-500/40"
                        title="Offener Schaden"
                      >
                        ⚠ Schaden
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-gray-600">
                    {roomTypeLabels[room.type]}
                  </p>
                </div>
                <span className="shrink-0 text-gray-600">›</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Room Detail Modal (leere Zimmer + Gemeinschaftsraeume) */}
      {selectedRoom && (
        <RoomDetail
          room={{ ...selectedRoom, currentResident: undefined }}
          wgName={selectedWg.name}
          onClose={() => setSelectedRoom(null)}
        />
      )}

      {/* User Profile Modal (belegtes Zimmer) */}
      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {/* Grundrisse Modal — zoombar per Pinch */}
      {showGrundrisse && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm"
          onClick={() => setShowGrundrisse(false)}
        >
          <div
            className="flex items-center justify-between border-b border-gray-800 px-4 py-3"
            style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="font-display text-[10px] font-bold uppercase tracking-widest text-accent">
                GRUNDRISSE & SCHNITTE
              </p>
              <p className="text-[10px] text-gray-500">
                Tippen zum Schliessen · Zwei Finger zum Zoomen
              </p>
            </div>
            <button
              onClick={() => setShowGrundrisse(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-700 text-gray-400 hover:text-white"
              aria-label="Schliessen"
            >
              ×
            </button>
          </div>
          <div
            className="flex-1 overflow-auto"
            style={{ touchAction: "pan-x pan-y pinch-zoom" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/grundrisse.webp"
              alt="Grundrisse Via 1"
              className="mx-auto h-auto w-full max-w-none select-none bg-white p-2"
              draggable={false}
              style={{ minWidth: "100%" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
