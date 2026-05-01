"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import {
  wgs,
  roomTypeIcons,
  roomTypeLabels,
} from "@/lib/bewohnende-data";
import type { Room, Wg } from "@/lib/bewohnende-data";
import { RoomDetail } from "@/components/RoomDetail";
import { animalAvatarUrl } from "@/lib/avatar-utils";

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
  // DiceBear-Fallback wenn Lieblingstier vorhanden
  const diceBear = user ? animalAvatarUrl(user.favoriteAnimal, size * 2) : null;
  if (user && diceBear) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={diceBear}
        alt={user.favoriteAnimal ?? user.name}
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
  isAdmin,
  currentUserId,
  onDelete,
}: {
  user: ApiUser;
  onClose: () => void;
  isAdmin: boolean;
  currentUserId: string;
  onDelete: (id: string, name: string) => void;
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
          {isAdmin && user.id !== currentUserId && (
            <button
              onClick={() => onDelete(user.id, user.name)}
              className="mt-4 w-full rounded-lg border border-red-500/40 bg-red-500/10 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-red-300 hover:bg-red-500/20"
            >
              User löschen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function GrundrisseModal({ onClose }: { onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);

  const MIN = 1;
  const MAX = 6;

  function clampScale(s: number) {
    return Math.min(MAX, Math.max(MIN, s));
  }

  function applyZoom(nextScale: number, centerX?: number, centerY?: number) {
    const el = wrapRef.current;
    if (!el) {
      setScale(clampScale(nextScale));
      return;
    }
    const rect = el.getBoundingClientRect();
    const cx = centerX ?? rect.width / 2;
    const cy = centerY ?? rect.height / 2;
    const s = clampScale(nextScale);
    // Punkt unter der Maus soll fix bleiben
    const dx = (cx - tx) * (s / scale - 1);
    const dy = (cy - ty) * (s / scale - 1);
    setScale(s);
    setTx(tx - dx);
    setTy(ty - dy);
  }

  function reset() {
    setScale(1);
    setTx(0);
    setTy(0);
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      dragStart.current = { x: e.clientX, y: e.clientY, tx, ty };
    } else if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      const dx = pts[0]!.x - pts[1]!.x;
      const dy = pts[0]!.y - pts[1]!.y;
      pinchStart.current = { dist: Math.hypot(dx, dy), scale };
      dragStart.current = null;
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const pts = Array.from(pointers.current.values());
      const dx = pts[0]!.x - pts[1]!.x;
      const dy = pts[0]!.y - pts[1]!.y;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchStart.current.dist;
      const rect = wrapRef.current?.getBoundingClientRect();
      const cx = rect
        ? (pts[0]!.x + pts[1]!.x) / 2 - rect.left
        : undefined;
      const cy = rect
        ? (pts[0]!.y + pts[1]!.y) / 2 - rect.top
        : undefined;
      applyZoom(pinchStart.current.scale * ratio, cx, cy);
    } else if (pointers.current.size === 1 && dragStart.current) {
      setTx(dragStart.current.tx + (e.clientX - dragStart.current.x));
      setTy(dragStart.current.ty + (e.clientY - dragStart.current.y));
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) {
      pinchStart.current = null;
    }
    if (pointers.current.size === 0) {
      dragStart.current = null;
    }
  }

  function onDoubleClick(e: React.MouseEvent) {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    if (scale < 2.5) {
      applyZoom(3, cx, cy);
    } else {
      reset();
    }
  }

  function onWheel(e: React.WheelEvent) {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    applyZoom(scale * delta, cx, cy);
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm">
      <div
        className="flex items-center justify-between border-b border-gray-800 px-4 py-3"
        style={{
          paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))",
        }}
      >
        <div>
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-accent">
            GRUNDRISSE & SCHNITTE
          </p>
          <p className="text-[10px] text-gray-500">
            Ziehen zum Verschieben · Doppeltipp zum Zoomen
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-700 text-gray-400 hover:text-white"
          aria-label="Schliessen"
        >
          ×
        </button>
      </div>
      <div
        ref={wrapRef}
        className="relative flex-1 overflow-hidden bg-white"
        style={{ touchAction: "none", cursor: scale > 1 ? "grab" : "auto" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
        onWheel={onWheel}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/grundrisse.webp"
          alt="Grundrisse Via 1"
          draggable={false}
          className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
          style={{
            width: "auto",
            height: "auto",
            maxWidth: "100%",
            maxHeight: "100%",
            transform: `translate(-50%, -50%) translate(${tx}px, ${ty}px) scale(${scale})`,
            transformOrigin: "center",
            transition: pointers.current.size > 0 ? "none" : "transform 0.15s",
          }}
        />

        {/* Zoom-Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => applyZoom(scale * 1.5)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-700 bg-black/80 text-xl text-white shadow-lg hover:bg-black"
            aria-label="Vergrössern"
          >
            +
          </button>
          <button
            onClick={() => applyZoom(scale / 1.5)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-700 bg-black/80 text-xl text-white shadow-lg hover:bg-black"
            aria-label="Verkleinern"
          >
            −
          </button>
          <button
            onClick={reset}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-700 bg-black/80 font-mono text-[10px] text-white shadow-lg hover:bg-black"
            aria-label="Zurücksetzen"
          >
            1:1
          </button>
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
  const isAdmin = (session?.user?.roles || []).includes("ADMIN");
  const [apiUsers, setApiUsers] = useState<ApiUser[]>([]);
  const [selectedWg, setSelectedWg] = useState<Wg>(wgs[0]!);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [showGrundrisse, setShowGrundrisse] = useState(false);
  // Map roomKey -> hat offenen Schaden?
  const [damagesByRoom, setDamagesByRoom] = useState<Map<string, boolean>>(
    new Map()
  );
  // Map roomKey -> aktive Untermiete
  const [subletsByRoom, setSubletsByRoom] = useState<
    Map<string, { subtenantName: string; fromDate: string; toDate: string }>
  >(new Map());

  function loadUsers() {
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : []))
      .then((u: ApiUser[]) => setApiUsers(u))
      .catch(() => {});
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function deleteUser(id: string, name: string) {
    if (
      !confirm(
        `"${name}" wirklich löschen?\n\nAlle von diesem User erstellten Inhalte werden ebenfalls gelöscht.`
      )
    )
      return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        alert(data.error ?? "Löschen fehlgeschlagen.");
        return;
      }
      setSelectedUser(null);
      loadUsers();
    } catch {
      alert("Netzwerkfehler.");
    }
  }

  // Schaeden-Indikatoren laden
  const loadDamages = () => {
    fetch("/api/rooms/damages")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { roomKeysWithOpenDamage: string[] } | null) => {
        if (!data) return;
        const m = new Map<string, boolean>();
        for (const k of data.roomKeysWithOpenDamage) m.set(k, true);
        setDamagesByRoom(m);
      })
      .catch(() => {});
  };
  const loadActiveSublets = () => {
    fetch("/api/rooms/sublets")
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          data: {
            activeByRoom: Record<
              string,
              { subtenantName: string; fromDate: string; toDate: string }
            >;
          } | null
        ) => {
          if (!data) return;
          const m = new Map<
            string,
            { subtenantName: string; fromDate: string; toDate: string }
          >();
          for (const [k, v] of Object.entries(data.activeByRoom)) {
            m.set(k, v);
          }
          setSubletsByRoom(m);
        }
      )
      .catch(() => {});
  };
  useEffect(() => {
    loadDamages();
    loadActiveSublets();
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

  // Mapping Zimmer-keyNumber -> API-Users (mehrere pro Zimmer möglich)
  const usersByRoom = new Map<string, ApiUser[]>();
  for (const u of apiUsers) {
    if (u.roomKey) {
      const list = usersByRoom.get(u.roomKey) ?? [];
      list.push(u);
      usersByRoom.set(u.roomKey, list);
    }
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

      {/* Schlafzimmer — Avatar inline nach Zimmer-Label */}
      <section className="mb-5">
        <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-accent">
          Schlafzimmer
        </h3>
        <div className="space-y-1.5">
          {zimmer.map((room) => {
            const users = usersByRoom.get(room.keyNumber) ?? [];
            const isMine = users.some((u) => u.id === currentUserId);
            const hasOpenDamage = damagesByRoom.get(room.keyNumber) ?? false;
            const activeSublet = subletsByRoom.get(room.keyNumber) ?? null;
            return (
              <div
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`w-full cursor-pointer rounded-lg border px-3 py-2 text-left transition-all ${
                  isMine
                    ? "border-accent bg-accent/10 shadow-[0_0_12px_rgba(184,240,104,0.2)]"
                    : users.length > 0
                      ? "border-accent/30 bg-accent/5 hover:border-accent/60"
                      : "border-gray-800 bg-gray-900/40 hover:border-gray-600"
                }`}
              >
                <div className="flex w-full items-center gap-2">
                  <span className="shrink-0 text-lg">
                    {roomTypeIcons[room.type]}
                  </span>
                  <p className="shrink-0 text-sm text-gray-300">
                    {room.label}
                  </p>
                  <p className="shrink-0 font-mono text-[10px] text-gray-600">
                    {room.keyNumber}
                  </p>
                  {users.length > 0 && (
                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                      {users.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
                          }}
                          className="shrink-0 rounded-full hover:ring-2 hover:ring-accent/50"
                          title={`Profil von ${user.name}`}
                          aria-label={`Profil von ${user.name}`}
                        >
                          <RoundAvatar user={user} size={22} />
                        </button>
                      ))}
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-white">
                        {users.map((u) => u.name).join(" & ")}
                        {isMine && (
                          <span className="ml-1 text-[9px] text-accent">
                            (du)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {users.length === 0 && (
                    <span className="flex-1 text-[11px] text-gray-600">
                      Frei
                    </span>
                  )}
                  {hasOpenDamage && (
                    <span
                      className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-red-500/25 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-300 ring-1 ring-red-500/50"
                      title="Offener Schaden"
                    >
                      ⚠ Schaden
                    </span>
                  )}
                  <span className="shrink-0 text-gray-600">›</span>
                </div>
                {/* Aktive Untermiete: zeigt Untermieter zusaetzlich an */}
                {activeSublet && (
                  <div className="ml-[1.75rem] mt-1 flex items-center gap-1.5 rounded border-l-2 border-amber-400/50 bg-amber-400/5 py-0.5 pl-2">
                    <span className="text-[10px]">🔑</span>
                    <span className="min-w-0 flex-1 truncate text-[11px] text-amber-200">
                      <span className="text-amber-200/60">Untermiete: </span>
                      <span className="font-medium">
                        {activeSublet.subtenantName}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[9px] text-amber-200/60">
                      bis{" "}
                      {new Date(activeSublet.toDate).toLocaleDateString(
                        "de-CH",
                        { day: "numeric", month: "short" }
                      )}
                    </span>
                  </div>
                )}
              </div>
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
            const hasOpenDamage = damagesByRoom.get(room.keyNumber) ?? false;
            return (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className="flex w-full items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/40 px-3 py-2 text-left transition-all hover:border-gray-600"
              >
                <span className="shrink-0 text-lg">
                  {roomTypeIcons[room.type]}
                </span>
                <p className="shrink-0 text-sm text-gray-300">{room.label}</p>
                <p className="shrink-0 font-mono text-[10px] text-gray-600">
                  {room.keyNumber}
                </p>
                <span className="flex-1 truncate text-[11px] text-gray-600">
                  {roomTypeLabels[room.type]}
                </span>
                {hasOpenDamage && (
                  <span
                    className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-red-500/25 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-300 ring-1 ring-red-500/50"
                    title="Offener Schaden"
                  >
                    ⚠ Schaden
                  </span>
                )}
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
          residents={(usersByRoom.get(selectedRoom.keyNumber) ?? []).map((u) => ({
            id: u.id,
            name: u.name,
            fullName: u.fullName,
            favoriteAnimal: u.favoriteAnimal,
            avatar: u.avatar,
          }))}
          onClose={() => {
            setSelectedRoom(null);
            // Schaeden- und Untermiete-Indikatoren auffrischen
            loadDamages();
            loadActiveSublets();
          }}
        />
      )}

      {/* User Profile Modal (belegtes Zimmer) */}
      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          onDelete={deleteUser}
        />
      )}

      {/* Grundrisse Modal — JS-Zoom (Buttons + Drag + Pinch) */}
      {showGrundrisse && (
        <GrundrisseModal onClose={() => setShowGrundrisse(false)} />
      )}
    </div>
  );
}
