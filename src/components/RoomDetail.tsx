"use client";

import { useState } from "react";
import type { Room, Work, Damage, Resident, Handover } from "@/lib/bewohnende-data";
import {
  roomTypeLabels,
  workTypeLabels,
  roomTypeIcons,
} from "@/lib/bewohnende-data";

type Tab = "info" | "historie" | "arbeiten" | "schaeden";

export function RoomDetail({
  room: initialRoom,
  wgName,
  onClose,
}: {
  room: Room;
  wgName: string;
  onClose: () => void;
}) {
  const [room, setRoom] = useState<Room>(initialRoom);
  const [tab, setTab] = useState<Tab>("info");
  const [showAddWork, setShowAddWork] = useState(false);
  const [showAddDamage, setShowAddDamage] = useState(false);
  const [showAddResident, setShowAddResident] = useState(false);
  const [showHandover, setShowHandover] = useState(false);

  const isPrivate = room.type === "zimmer";

  function updateRoom(patch: Partial<Room>) {
    setRoom({ ...room, ...patch });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-gray-800 bg-dark sm:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-800 bg-dark/95 px-5 py-4 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-gray-500">
                {wgName} · {roomTypeLabels[room.type]}
              </p>
              <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-accent">
                <span>{roomTypeIcons[room.type]}</span>
                <span>{room.label}</span>
              </h2>
              <p className="mt-0.5 font-mono text-xs text-gray-600">
                {room.keyNumber}
              </p>
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

          {/* Tabs */}
          <div className="mt-4 flex gap-1">
            {(
              [
                { key: "info" as const, label: "Info" },
                { key: "historie" as const, label: "Historie" },
                { key: "arbeiten" as const, label: "Arbeiten" },
                { key: "schaeden" as const, label: "Schäden" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 rounded-lg px-2 py-1.5 font-mono text-xs font-bold transition-colors ${
                  tab === t.key
                    ? "bg-accent text-dark"
                    : "border border-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {tab === "info" && (
            <InfoTab
              room={room}
              isPrivate={isPrivate}
              onUpdateKeys={(n) => updateRoom({ keyCount: n })}
              onAddResident={() => setShowAddResident(true)}
              onHandover={() => setShowHandover(true)}
            />
          )}
          {tab === "historie" && <HistorieTab room={room} />}
          {tab === "arbeiten" && (
            <ArbeitenTab
              room={room}
              onAdd={() => setShowAddWork(true)}
            />
          )}
          {tab === "schaeden" && (
            <SchädenTab
              room={room}
              onAdd={() => setShowAddDamage(true)}
            />
          )}
        </div>

        {/* Modals */}
        {showAddWork && (
          <AddWorkModal
            onClose={() => setShowAddWork(false)}
            onSave={(w) => {
              updateRoom({ works: [w, ...room.works] });
              setShowAddWork(false);
            }}
          />
        )}
        {showAddDamage && (
          <AddDamageModal
            onClose={() => setShowAddDamage(false)}
            onSave={(d) => {
              updateRoom({ damages: [d, ...room.damages] });
              setShowAddDamage(false);
            }}
          />
        )}
        {showAddResident && (
          <AddResidentModal
            onClose={() => setShowAddResident(false)}
            onSave={(r) => {
              updateRoom({ currentResident: r });
              setShowAddResident(false);
            }}
          />
        )}
        {showHandover && (
          <HandoverModal
            currentResident={room.currentResident}
            onClose={() => setShowHandover(false)}
            onSave={(h, newResident) => {
              const prevResidents = room.currentResident
                ? [
                    { ...room.currentResident, movedOut: h.date },
                    ...room.residentHistory,
                  ]
                : room.residentHistory;
              updateRoom({
                handovers: [h, ...room.handovers],
                residentHistory: prevResidents,
                currentResident: newResident,
              });
              setShowHandover(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ============== Info Tab ==============

function InfoTab({
  room,
  isPrivate,
  onUpdateKeys,
  onAddResident,
  onHandover,
}: {
  room: Room;
  isPrivate: boolean;
  onUpdateKeys: (n: number) => void;
  onAddResident: () => void;
  onHandover: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Aktuelle/r Bewohner:in - nur bei privaten Zimmern */}
      {isPrivate && (
        <section>
          <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-accent">
            Aktuelle Bewohner:in
          </h3>
          {room.currentResident ? (
            <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">
                    {room.currentResident.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Eingezogen: {formatDate(room.currentResident.movedIn)}
                  </p>
                </div>
                <button
                  onClick={onHandover}
                  className="rounded-lg border border-secondary/40 bg-secondary/10 px-3 py-1.5 font-mono text-xs text-secondary hover:bg-secondary/20"
                >
                  Zimmerabnahme
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onAddResident}
              className="w-full rounded-lg border border-dashed border-gray-700 py-3 font-mono text-sm text-gray-400 hover:border-accent hover:text-accent"
            >
              + Bewohner:in hinzufuegen
            </button>
          )}
        </section>
      )}

      {/* Schlüssel */}
      <section>
        <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-accent">
          Schlüssel
        </h3>
        <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/40 p-3">
          <span className="text-sm text-gray-400">
            Anzahl Schlüssel vorhanden
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateKeys(Math.max(0, room.keyCount - 1))}
              className="h-8 w-8 rounded border border-gray-700 font-mono text-sm text-gray-400 hover:border-accent hover:text-accent"
            >
              −
            </button>
            <span className="w-8 text-center font-mono text-lg font-bold text-accent">
              {room.keyCount}
            </span>
            <button
              onClick={() => onUpdateKeys(room.keyCount + 1)}
              className="h-8 w-8 rounded border border-gray-700 font-mono text-sm text-gray-400 hover:border-accent hover:text-accent"
            >
              +
            </button>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3 text-center">
          <p className="font-mono text-xl font-bold text-accent">
            {room.works.length}
          </p>
          <p className="text-xs text-gray-500">Arbeiten</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3 text-center">
          <p className="font-mono text-xl font-bold text-secondary">
            {room.damages.filter((d) => !d.resolvedAt).length}
          </p>
          <p className="text-xs text-gray-500">Offene Schäden</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3 text-center">
          <p className="font-mono text-xl font-bold text-white">
            {room.residentHistory.length + (room.currentResident ? 1 : 0)}
          </p>
          <p className="text-xs text-gray-500">Bewohner:innen</p>
        </div>
      </section>
    </div>
  );
}

// ============== Historie Tab ==============

function HistorieTab({ room }: { room: Room }) {
  const allHistory: Array<
    | { kind: "current"; resident: Resident }
    | { kind: "past"; resident: Resident }
    | { kind: "handover"; handover: Handover }
  > = [];

  if (room.currentResident) {
    allHistory.push({ kind: "current", resident: room.currentResident });
  }
  room.handovers.forEach((h) =>
    allHistory.push({ kind: "handover", handover: h })
  );
  room.residentHistory.forEach((r) =>
    allHistory.push({ kind: "past", resident: r })
  );

  if (allHistory.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-600">
        Noch keine Historie erfasst.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {allHistory.map((entry, i) => {
        if (entry.kind === "current") {
          return (
            <div
              key={`current-${i}`}
              className="rounded-lg border border-accent/40 bg-accent/5 p-3"
            >
              <p className="font-mono text-xs uppercase tracking-wider text-accent">
                Aktuell
              </p>
              <p className="mt-1 font-medium text-white">
                {entry.resident.name}
              </p>
              <p className="text-xs text-gray-500">
                Seit {formatDate(entry.resident.movedIn)}
              </p>
            </div>
          );
        }
        if (entry.kind === "handover") {
          return (
            <div
              key={`h-${entry.handover.id}`}
              className="rounded-lg border border-secondary/30 bg-secondary/5 p-3"
            >
              <p className="font-mono text-xs uppercase tracking-wider text-secondary">
                Zimmerabnahme · {formatDate(entry.handover.date)}
              </p>
              {entry.handover.notes && (
                <p className="mt-1 text-sm text-gray-300">
                  {entry.handover.notes}
                </p>
              )}
              {entry.handover.damageCount > 0 && (
                <p className="mt-1 text-xs text-secondary">
                  {entry.handover.damageCount} Schäden protokolliert
                </p>
              )}
            </div>
          );
        }
        return (
          <div
            key={`past-${i}`}
            className="rounded-lg border border-gray-800 bg-gray-900/40 p-3 opacity-70"
          >
            <p className="font-medium text-gray-300">{entry.resident.name}</p>
            <p className="text-xs text-gray-500">
              {formatDate(entry.resident.movedIn)} –{" "}
              {entry.resident.movedOut
                ? formatDate(entry.resident.movedOut)
                : "?"}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ============== Arbeiten Tab ==============

function ArbeitenTab({
  room,
  onAdd,
}: {
  room: Room;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-3">
      <button
        onClick={onAdd}
        className="w-full rounded-lg bg-accent py-2.5 font-mono text-sm font-bold text-dark hover:brightness-110"
      >
        + Arbeit erfassen
      </button>

      {room.works.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-600">
          Noch keine Arbeiten erfasst.
        </p>
      ) : (
        <div className="space-y-2">
          {room.works.map((w) => (
            <div
              key={w.id}
              className="rounded-lg border border-gray-800 bg-gray-900/40 p-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-mono text-xs uppercase tracking-wider text-accent">
                    {workTypeLabels[w.type]}
                  </p>
                  <p className="mt-1 text-sm text-white">{w.description}</p>
                  {w.performedBy && (
                    <p className="mt-1 text-xs text-gray-500">
                      von {w.performedBy}
                    </p>
                  )}
                </div>
                <span className="font-mono text-xs text-gray-500">
                  {formatDate(w.date)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============== Schäden Tab ==============

function SchädenTab({
  room,
  onAdd,
}: {
  room: Room;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-3">
      <button
        onClick={onAdd}
        className="w-full rounded-lg bg-secondary py-2.5 font-mono text-sm font-bold text-white hover:brightness-110"
      >
        + Schaden melden
      </button>

      {room.damages.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-600">
          Keine Schäden gemeldet.
        </p>
      ) : (
        <div className="space-y-2">
          {room.damages.map((d) => (
            <div
              key={d.id}
              className={`rounded-lg border p-3 ${
                d.resolvedAt
                  ? "border-gray-800 bg-gray-900/40 opacity-60"
                  : "border-secondary/30 bg-secondary/5"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-mono text-xs uppercase tracking-wider text-secondary">
                    {d.severity} {d.resolvedAt ? "· erledigt" : ""}
                  </p>
                  <p className="mt-1 text-sm text-white">{d.description}</p>
                  {d.photoCount > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      {d.photoCount} Foto(s)
                    </p>
                  )}
                </div>
                <span className="font-mono text-xs text-gray-500">
                  {formatDate(d.reportedAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============== Modals ==============

function AddWorkModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (w: Work) => void;
}) {
  const [type, setType] = useState<Work["type"]>("streichen");
  const [description, setDescription] = useState("");
  const [performedBy, setPerformedBy] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  return (
    <ModalShell title="Arbeit erfassen" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            id: String(Date.now()),
            type,
            description,
            performedBy: performedBy || undefined,
            date,
          });
        }}
        className="space-y-3"
      >
        <div>
          <label className="mb-1 block text-xs text-gray-400">Typ</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Work["type"])}
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
          >
            {Object.entries(workTypeLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">Beschreibung</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
            placeholder="Was wurde gemacht?"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-gray-400">Datum</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">
              Ausgefuehrt von
            </label>
            <input
              type="text"
              value={performedBy}
              onChange={(e) => setPerformedBy(e.target.value)}
              placeholder="optional"
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-accent py-2.5 font-mono text-sm font-bold text-dark hover:brightness-110"
        >
          Speichern
        </button>
      </form>
    </ModalShell>
  );
}

function AddDamageModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (d: Damage) => void;
}) {
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Damage["severity"]>("klein");
  const [photoCount, setPhotoCount] = useState(0);

  return (
    <ModalShell title="Schaden melden" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            id: String(Date.now()),
            description,
            severity,
            reportedAt: new Date().toISOString().slice(0, 10),
            photoCount,
          });
        }}
        className="space-y-3"
      >
        <div>
          <label className="mb-1 block text-xs text-gray-400">Beschreibung</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
            placeholder="Was ist kaputt?"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">Schweregrad</label>
          <div className="flex gap-2">
            {(["klein", "mittel", "gross"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeverity(s)}
                className={`flex-1 rounded-lg py-2 font-mono text-xs font-bold capitalize transition-colors ${
                  severity === s
                    ? "bg-secondary text-white"
                    : "border border-gray-700 text-gray-400"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">
            Fotos (Mock: {photoCount})
          </label>
          <button
            type="button"
            onClick={() => setPhotoCount(photoCount + 1)}
            className="w-full rounded border border-dashed border-gray-700 py-3 text-sm text-gray-400 hover:border-accent hover:text-accent"
          >
            + Foto hinzufuegen
          </button>
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-secondary py-2.5 font-mono text-sm font-bold text-white hover:brightness-110"
        >
          Schaden melden
        </button>
      </form>
    </ModalShell>
  );
}

function AddResidentModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (r: Resident) => void;
}) {
  const [name, setName] = useState("");
  const [movedIn, setMovedIn] = useState(
    new Date().toISOString().slice(0, 10)
  );

  return (
    <ModalShell title="Bewohner:in hinzufuegen" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            id: String(Date.now()),
            name,
            movedIn,
          });
        }}
        className="space-y-3"
      >
        <div>
          <label className="mb-1 block text-xs text-gray-400">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">Einzug</label>
          <input
            type="date"
            value={movedIn}
            onChange={(e) => setMovedIn(e.target.value)}
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-accent py-2.5 font-mono text-sm font-bold text-dark hover:brightness-110"
        >
          Hinzufuegen
        </button>
      </form>
    </ModalShell>
  );
}

function HandoverModal({
  currentResident,
  onClose,
  onSave,
}: {
  currentResident?: Resident;
  onClose: () => void;
  onSave: (h: Handover, newResident?: Resident) => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [damageCount, setDamageCount] = useState(0);
  const [newResidentName, setNewResidentName] = useState("");

  return (
    <ModalShell title="Zimmerabnahme" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(
            {
              id: String(Date.now()),
              date,
              from: currentResident?.name,
              to: newResidentName || undefined,
              notes,
              damageCount,
            },
            newResidentName
              ? {
                  id: String(Date.now() + 1),
                  name: newResidentName,
                  movedIn: date,
                }
              : undefined
          );
        }}
        className="space-y-3"
      >
        {currentResident && (
          <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
            <p className="text-xs text-gray-500">Auszug von</p>
            <p className="font-medium text-white">{currentResident.name}</p>
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs text-gray-400">
            Datum Abnahme
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">
            Neue/r Bewohner:in (optional)
          </label>
          <input
            type="text"
            value={newResidentName}
            onChange={(e) => setNewResidentName(e.target.value)}
            placeholder="Name des Nachmieters"
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">
            Protokoll-Notizen
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Zustand des Zimmers, Besonderheiten..."
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">
            Schäden fotografiert (Mock: {damageCount})
          </label>
          <button
            type="button"
            onClick={() => setDamageCount(damageCount + 1)}
            className="w-full rounded border border-dashed border-gray-700 py-3 text-sm text-gray-400 hover:border-secondary hover:text-secondary"
          >
            + Foto hinzufuegen
          </button>
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-secondary py-2.5 font-mono text-sm font-bold text-white hover:brightness-110"
        >
          Abnahme abschliessen
        </button>
      </form>
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-gray-800 bg-dark p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-accent">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white"
            aria-label="Schliessen"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M6 18L18 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("de-CH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
