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
  roomKey: string | null;
  roomNumber: number | null;
  wgName: string | null;
}

export default function BewohnendePage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? "";
  const [apiUsers, setApiUsers] = useState<ApiUser[]>([]);
  const [selectedWg, setSelectedWg] = useState<Wg>(wgs[0]!);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

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
      <p className="mb-5 text-center text-sm text-accent/70">
        Zimmer, Schlüssel, Historie
      </p>

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

      {/* Schlafzimmer — kompakt als Liste */}
      <section className="mb-5">
        <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-accent">
          Schlafzimmer
        </h3>
        <div className="space-y-1.5">
          {zimmer.map((room) => {
            const user = usersByRoom.get(room.keyNumber);
            const isMine = user?.id === currentUserId;
            return (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all ${
                  isMine
                    ? "border-accent bg-accent/10 shadow-[0_0_12px_rgba(184,240,104,0.2)]"
                    : user
                      ? "border-accent/30 bg-accent/5 hover:border-accent/60"
                      : "border-gray-800 bg-gray-900/40 hover:border-gray-600"
                }`}
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
                  </div>
                  <p
                    className={`truncate text-xs ${
                      user ? "font-medium text-white" : "text-gray-600"
                    }`}
                  >
                    {user?.name ?? "Frei"}
                    {isMine && (
                      <span className="ml-1 text-[9px] text-accent">(du)</span>
                    )}
                  </p>
                </div>
                <span className="shrink-0 text-gray-600">›</span>
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
          {commonRooms.map((room) => (
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
                </div>
                <p className="truncate text-xs text-gray-600">
                  {roomTypeLabels[room.type]}
                </p>
              </div>
              <span className="shrink-0 text-gray-600">›</span>
            </button>
          ))}
        </div>
      </section>

      {/* Room Detail Modal */}
      {selectedRoom && (
        <RoomDetail
          room={(() => {
            const user = usersByRoom.get(selectedRoom.keyNumber);
            if (!user) {
              return { ...selectedRoom, currentResident: undefined };
            }
            return {
              ...selectedRoom,
              currentResident: {
                id: user.id,
                name: user.name,
                movedIn: "",
              },
            };
          })()}
          wgName={selectedWg.name}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
}
