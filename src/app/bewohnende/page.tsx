"use client";

import { useState } from "react";
import { wgs, roomTypeIcons, roomTypeLabels } from "@/lib/bewohnende-data";
import type { Room, Wg } from "@/lib/bewohnende-data";
import { RoomDetail } from "@/components/RoomDetail";

export default function BewohnendePage() {
  const [selectedWg, setSelectedWg] = useState<Wg>(wgs[0]!);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

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

  const occupiedCount = zimmer.filter((r) => r.currentResident).length;
  const openDamages = selectedWg.rooms.reduce(
    (acc, r) => acc + r.damages.filter((d) => !d.resolvedAt).length,
    0
  );

  return (
    <div className="p-4 pb-24">
      <h1 className="mb-1 text-center font-cinzel text-3xl text-accent">
        Bewohnende
      </h1>
      <p className="mb-5 text-sm text-gray-400">
        Uebersicht Zimmer, Bewohnende und Arbeiten
      </p>

      {/* WG-Auswahl als gestaffelte Buttons (wie Schnitt) */}
      <div className="mb-6 space-y-1">
        {wgOrder.map((wg) => {
          const isActive = wg.slug === selectedWg.slug;
          const isNord = wg.side === "nord";
          return (
            <button
              key={wg.slug}
              onClick={() => setSelectedWg(wg)}
              className={`flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left font-mono text-sm transition-all ${
                isActive
                  ? isNord
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-secondary bg-secondary/10 text-secondary"
                  : "border-gray-800 bg-gray-900/40 text-gray-400 hover:border-gray-600"
              }`}
              style={{
                marginLeft: isNord ? "0" : "24px",
                marginRight: isNord ? "24px" : "0",
              }}
            >
              <span className="font-bold">{wg.name}</span>
              <span className="text-xs opacity-70">{wg.floor}</span>
            </button>
          );
        })}
      </div>

      {/* WG Header */}
      <div className="mb-4 rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              {selectedWg.name}
            </h2>
            <p className="text-xs text-gray-500">{selectedWg.floor}</p>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <p className="font-mono text-lg font-bold text-accent">
                {occupiedCount}/{zimmer.length}
              </p>
              <p className="text-[10px] text-gray-500">belegt</p>
            </div>
            {openDamages > 0 && (
              <div>
                <p className="font-mono text-lg font-bold text-secondary">
                  {openDamages}
                </p>
                <p className="text-[10px] text-gray-500">Schaeden</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zimmer (Schlafzimmer) */}
      <section className="mb-5">
        <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-accent">
          Schlafzimmer
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {zimmer.map((room) => (
            <RoomTile
              key={room.id}
              room={room}
              onClick={() => setSelectedRoom(room)}
            />
          ))}
        </div>
      </section>

      {/* Gemeinschaftsraeume */}
      <section>
        <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-accent">
          Gemeinschaftsraeume
        </h3>
        <div className="space-y-2">
          {commonRooms.map((room) => (
            <CommonRoomTile
              key={room.id}
              room={room}
              onClick={() => setSelectedRoom(room)}
            />
          ))}
        </div>
      </section>

      {/* Room Detail Modal */}
      {selectedRoom && (
        <RoomDetail
          room={selectedRoom}
          wgName={selectedWg.name}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
}

function RoomTile({ room, onClick }: { room: Room; onClick: () => void }) {
  const hasResident = !!room.currentResident;
  const hasDamage = room.damages.some((d) => !d.resolvedAt);

  return (
    <button
      onClick={onClick}
      className={`relative rounded-lg border p-3 text-left transition-all ${
        hasResident
          ? "border-accent/40 bg-accent/5 hover:border-accent"
          : "border-gray-800 bg-gray-900/40 hover:border-gray-600"
      }`}
    >
      <div className="flex items-start justify-between">
        <span className="text-2xl">{roomTypeIcons[room.type]}</span>
        {hasDamage && (
          <span className="h-2 w-2 rounded-full bg-secondary" />
        )}
      </div>
      <p className="mt-2 font-mono text-xs text-gray-500">{room.keyNumber}</p>
      <p className="font-medium text-white">{room.label}</p>
      {hasResident ? (
        <p className="mt-1 truncate text-xs text-accent">
          {room.currentResident!.name}
        </p>
      ) : (
        <p className="mt-1 text-xs text-gray-600">Frei</p>
      )}
    </button>
  );
}

function CommonRoomTile({
  room,
  onClick,
}: {
  room: Room;
  onClick: () => void;
}) {
  const hasDamage = room.damages.some((d) => !d.resolvedAt);

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg border border-gray-800 bg-gray-900/40 p-3 text-left transition-all hover:border-gray-600"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{roomTypeIcons[room.type]}</span>
        <div>
          <p className="font-medium text-white">{room.label}</p>
          <p className="text-xs text-gray-500">{roomTypeLabels[room.type]}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {hasDamage && (
          <span className="rounded-full bg-secondary/20 px-2 py-0.5 font-mono text-[10px] text-secondary">
            Schaden
          </span>
        )}
        <span className="text-gray-600">›</span>
      </div>
    </button>
  );
}
