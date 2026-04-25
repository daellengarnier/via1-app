"use client";

import { useCallback, useEffect, useState } from "react";
import type { Room, Work, Resident, Handover } from "@/lib/bewohnende-data";
import {
  roomTypeLabels,
  workTypeLabels,
  roomTypeIcons,
} from "@/lib/bewohnende-data";

// Live Schaden aus der API (nicht die Mock-Version aus bewohnende-data)
interface LiveDamage {
  id: string;
  description: string;
  severity: "klein" | "mittel" | "gross";
  reportedAt: string;
  resolvedAt: string | null;
  reportedBy: string | null;
  reportedById: string | null;
}

interface LiveSublet {
  id: string;
  subtenantName: string;
  subtenantFullName: string;
  subtenantPhone: string;
  subtenantEmail: string;
  fromDate: string;
  toDate: string;
  notes: string;
  createdBy: string;
  createdById: string;
}

type Tab = "info" | "historie" | "arbeiten" | "schaeden" | "untermiete";

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
  const [showAddResident, setShowAddResident] = useState(false);
  const [showHandover, setShowHandover] = useState(false);

  const isPrivate = room.type === "zimmer";

  function updateRoom(patch: Partial<Room>) {
    setRoom({ ...room, ...patch });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm pt-[env(safe-area-inset-top,0px)]">
      <div className="my-4 w-full max-w-lg overflow-hidden rounded-2xl border border-gray-800 bg-dark pb-[env(safe-area-inset-bottom,0px)]">
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
          <div className="mt-4 flex flex-wrap gap-1">
            {(
              [
                { key: "info" as const, label: "Info" },
                { key: "historie" as const, label: "Historie" },
                { key: "arbeiten" as const, label: "Arbeiten" },
                { key: "schaeden" as const, label: "Schäden" },
                ...(isPrivate
                  ? [
                      {
                        key: "untermiete" as const,
                        label: "Untermiete",
                      },
                    ]
                  : []),
              ]
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 rounded-lg px-2 py-1.5 font-mono text-[11px] font-bold transition-colors ${
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
          {tab === "schaeden" && <LiveSchädenTab roomKey={room.keyNumber} />}
          {tab === "untermiete" && isPrivate && (
            <SubletSection roomKey={room.keyNumber} />
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
  const [openDamageCount, setOpenDamageCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/rooms/${encodeURIComponent(room.keyNumber)}/damages`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: { resolvedAt: string | null }[]) => {
        setOpenDamageCount(data.filter((d) => !d.resolvedAt).length);
      })
      .catch(() => setOpenDamageCount(0));
  }, [room.keyNumber]);

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
        <div
          className={`rounded-lg border p-3 text-center ${
            openDamageCount && openDamageCount > 0
              ? "border-red-500/40 bg-red-500/10"
              : "border-gray-800 bg-gray-900/40"
          }`}
        >
          <p
            className={`font-mono text-xl font-bold ${
              openDamageCount && openDamageCount > 0
                ? "text-red-300"
                : "text-gray-400"
            }`}
          >
            {openDamageCount === null ? "–" : openDamageCount}
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

// ============== Sublet Section ==============

function SubletSection({ roomKey }: { roomKey: string }) {
  const [sublets, setSublets] = useState<LiveSublet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newFrom, setNewFrom] = useState("");
  const [newTo, setNewTo] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/rooms/${encodeURIComponent(roomKey)}/sublets`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: LiveSublet[]) => {
        setSublets(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [roomKey]);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setNewName("");
    setNewFullName("");
    setNewPhone("");
    setNewEmail("");
    setNewFrom("");
    setNewTo("");
    setNewNotes("");
    setEditingId(null);
    setShowAdd(false);
  }

  function openEdit(s: LiveSublet) {
    setEditingId(s.id);
    setNewName(s.subtenantName);
    setNewFullName(s.subtenantFullName);
    setNewPhone(s.subtenantPhone);
    setNewEmail(s.subtenantEmail);
    setNewFrom(s.fromDate);
    setNewTo(s.toDate);
    setNewNotes(s.notes);
    setShowAdd(true);
  }

  async function saveSublet(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newFrom || !newTo) return;
    setSaving(true);
    try {
      const payload = {
        subtenantName: newName,
        subtenantFullName: newFullName,
        subtenantPhone: newPhone,
        subtenantEmail: newEmail,
        fromDate: newFrom,
        toDate: newTo,
        notes: newNotes,
      };
      if (editingId) {
        const res = await fetch(`/api/sublets/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          alert(err.error ?? "Konnte Untermiete nicht speichern.");
          return;
        }
        const updated = (await res.json()) as LiveSublet;
        setSublets((prev) =>
          prev
            .map((s) => (s.id === editingId ? updated : s))
            .sort((a, b) => a.fromDate.localeCompare(b.fromDate))
        );
      } else {
        const res = await fetch(
          `/api/rooms/${encodeURIComponent(roomKey)}/sublets`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          alert(err.error ?? "Konnte Untermiete nicht speichern.");
          return;
        }
        const created = (await res.json()) as LiveSublet;
        setSublets((prev) =>
          [...prev, created].sort((a, b) => a.fromDate.localeCompare(b.fromDate))
        );
      }
      resetForm();
    } catch (err) {
      console.error("sublet save", err);
      alert("Konnte Untermiete nicht speichern.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSublet(id: string) {
    if (!confirm("Diese Untermiete löschen?")) return;
    try {
      const res = await fetch(`/api/sublets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSublets((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("sublet delete", err);
    }
  }

  const today = new Date().toISOString().split("T")[0]!;
  const active = sublets.filter((s) => s.fromDate <= today && s.toDate >= today);
  const upcoming = sublets.filter((s) => s.fromDate > today);
  const past = sublets.filter((s) => s.toDate < today);

  function SubletCard({ s }: { s: LiveSublet }) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-amber-200">{s.subtenantName}</p>
            {s.subtenantFullName && s.subtenantFullName !== s.subtenantName && (
              <p className="text-[11px] text-amber-200/70">
                {s.subtenantFullName}
              </p>
            )}
            <p className="mt-0.5 font-mono text-[10px] text-gray-500">
              {new Date(s.fromDate).toLocaleDateString("de-CH", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              {" – "}
              {new Date(s.toDate).toLocaleDateString("de-CH", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
            {(s.subtenantPhone || s.subtenantEmail) && (
              <div className="mt-1.5 space-y-0.5">
                {s.subtenantPhone && (
                  <p className="text-xs text-gray-300">
                    📞{" "}
                    <a
                      href={`tel:${s.subtenantPhone}`}
                      className="underline decoration-dotted hover:text-amber-200"
                    >
                      {s.subtenantPhone}
                    </a>
                  </p>
                )}
                {s.subtenantEmail && (
                  <p className="text-xs text-gray-300">
                    ✉{" "}
                    <a
                      href={`mailto:${s.subtenantEmail}`}
                      className="break-all underline decoration-dotted hover:text-amber-200"
                    >
                      {s.subtenantEmail}
                    </a>
                  </p>
                )}
              </div>
            )}
            {s.notes && (
              <p className="mt-1.5 text-xs text-gray-400">{s.notes}</p>
            )}
            <p className="mt-1 text-[10px] text-gray-600">
              erfasst von {s.createdBy}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <button
              onClick={() => openEdit(s)}
              className="rounded px-1.5 py-0.5 text-[11px] text-amber-300/80 hover:bg-amber-500/10 hover:text-amber-200"
              aria-label="Bearbeiten"
            >
              ✎
            </button>
            <button
              onClick={() => deleteSublet(s.id)}
              className="rounded px-1.5 py-0.5 text-[13px] text-gray-600 hover:text-red-400"
              aria-label="Loeschen"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-accent">
          Untermiete
        </h3>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="font-display text-[10px] font-bold uppercase tracking-wider text-accent/80 hover:text-accent"
          >
            + Neu
          </button>
        )}
      </div>

      <p className="mb-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-[11px] leading-relaxed text-amber-200/90">
        💡 Für alle Fragen zum Thema Untermiete bitte bei{" "}
        <span className="font-semibold">Vanessa</span> melden.
      </p>

      {showAdd && (
        <form
          onSubmit={saveSublet}
          className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3"
        >
          <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-amber-300">
            {editingId ? "UNTERMIETE BEARBEITEN" : "NEUE UNTERMIETE"}
          </p>
          <div className="mb-2">
            <label className="mb-1 block text-[10px] text-gray-400">
              Anzeigename
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="z.B. Maria"
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
              required
            />
          </div>
          <div className="mb-2">
            <label className="mb-1 block text-[10px] text-gray-400">
              Vollständiger Name
            </label>
            <input
              type="text"
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="Vor- und Nachname"
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[10px] text-gray-400">
                Telefon
              </label>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+41 …"
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-gray-400">
                E-Mail
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <label className="mb-1 block text-[10px] text-gray-400">Von</label>
              <input
                type="date"
                value={newFrom}
                onChange={(e) => setNewFrom(e.target.value)}
                className="box-border block h-9 w-full min-w-0 appearance-none rounded border border-gray-700 bg-gray-900 px-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                required
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1 block text-[10px] text-gray-400">Bis</label>
              <input
                type="date"
                value={newTo}
                onChange={(e) => setNewTo(e.target.value)}
                className="box-border block h-9 w-full min-w-0 appearance-none rounded border border-gray-700 bg-gray-900 px-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                required
              />
            </div>
          </div>
          <div className="mb-2">
            <label className="mb-1 block text-[10px] text-gray-400">
              Notizen (optional)
            </label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Kontakt, Grund, etc."
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded bg-amber-500 py-2 font-mono text-xs font-bold text-dark disabled:opacity-50"
            >
              {saving ? "…" : "Speichern"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded px-3 py-2 text-xs text-gray-400 hover:text-white"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-[11px] text-gray-600">Lädt…</p>
      ) : sublets.length === 0 ? (
        <p className="text-[11px] text-gray-600">Keine Untermiete erfasst.</p>
      ) : (
        <div className="space-y-2">
          {active.length > 0 && (
            <>
              <p className="text-[10px] uppercase tracking-wider text-amber-300">
                Aktuell
              </p>
              {active.map((s) => (
                <SubletCard key={s.id} s={s} />
              ))}
            </>
          )}
          {upcoming.length > 0 && (
            <>
              <p className="mt-2 text-[10px] uppercase tracking-wider text-gray-500">
                Geplant
              </p>
              {upcoming.map((s) => (
                <SubletCard key={s.id} s={s} />
              ))}
            </>
          )}
          {past.length > 0 && (
            <>
              <p className="mt-2 text-[10px] uppercase tracking-wider text-gray-600">
                Vergangen
              </p>
              {past.map((s) => (
                <SubletCard key={s.id} s={s} />
              ))}
            </>
          )}
        </div>
      )}
    </section>
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

// ============== Schäden Tab (live aus DB) ==============

function LiveSchädenTab({ roomKey }: { roomKey: string }) {
  const [damages, setDamages] = useState<LiveDamage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [newSeverity, setNewSeverity] = useState<"klein" | "mittel" | "gross">(
    "klein"
  );
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/rooms/${encodeURIComponent(roomKey)}/damages`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: LiveDamage[]) => {
        setDamages(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [roomKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function createDamage(e: React.FormEvent) {
    e.preventDefault();
    if (!newDesc.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/rooms/${encodeURIComponent(roomKey)}/damages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: newDesc,
            severity: newSeverity,
          }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = (await res.json()) as LiveDamage;
      setDamages((prev) => [created, ...prev]);
      setNewDesc("");
      setNewSeverity("klein");
      setShowAdd(false);
    } catch (err) {
      console.error("damage create", err);
      alert("Konnte Schaden nicht speichern.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleResolved(damage: LiveDamage) {
    const nextResolved = !damage.resolvedAt;
    try {
      const res = await fetch(`/api/damages/${damage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: nextResolved }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = (await res.json()) as LiveDamage;
      setDamages((prev) =>
        prev.map((d) => (d.id === damage.id ? updated : d))
      );
    } catch (err) {
      console.error("damage toggle", err);
    }
  }

  async function deleteDamage(id: string) {
    if (!confirm("Diesen Schaden wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/damages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDamages((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("damage delete", err);
    }
  }

  const severityLabels: Record<"klein" | "mittel" | "gross", string> = {
    klein: "Klein",
    mittel: "Mittel",
    gross: "Gross",
  };

  return (
    <div className="space-y-3">
      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full rounded-lg bg-secondary py-2.5 font-mono text-sm font-bold text-white hover:brightness-110"
        >
          + Schaden melden
        </button>
      ) : (
        <form
          onSubmit={createDamage}
          className="rounded-lg border border-secondary/40 bg-secondary/5 p-3"
        >
          <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-secondary">
            NEUER SCHADEN
          </p>
          <div className="mb-2">
            <label className="mb-1 block text-[10px] text-gray-400">
              Schweregrad
            </label>
            <div className="flex gap-1.5">
              {(["klein", "mittel", "gross"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNewSeverity(s)}
                  className={`flex-1 rounded-full px-2 py-1 font-mono text-[10px] font-bold transition-colors ${
                    newSeverity === s
                      ? "bg-secondary text-white"
                      : "border border-gray-700 text-gray-400"
                  }`}
                >
                  {severityLabels[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-2">
            <label className="mb-1 block text-[10px] text-gray-400">
              Beschreibung
            </label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Was ist kaputt / wo / wie schlimm?"
              rows={3}
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-secondary focus:outline-none"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded bg-secondary py-2 font-mono text-xs font-bold text-white disabled:opacity-50"
            >
              {saving ? "…" : "Speichern"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                setNewDesc("");
              }}
              className="rounded px-3 py-2 text-xs text-gray-400 hover:text-white"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="py-4 text-center text-sm text-gray-600">Lädt…</p>
      ) : damages.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-600">
          Keine Schäden gemeldet.
        </p>
      ) : (
        <div className="space-y-2">
          {damages.map((d) => (
            <div
              key={d.id}
              className={`rounded-lg border p-3 ${
                d.resolvedAt
                  ? "border-gray-800 bg-gray-900/40 opacity-60"
                  : "border-secondary/30 bg-secondary/5"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs uppercase tracking-wider text-secondary">
                    {severityLabels[d.severity]}
                    {d.resolvedAt && " · erledigt"}
                  </p>
                  <p className="mt-1 text-sm text-white">{d.description}</p>
                  <p className="mt-1 text-[10px] text-gray-500">
                    {d.reportedBy ? `${d.reportedBy} · ` : ""}
                    {new Date(d.reportedAt).toLocaleDateString("de-CH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    onClick={() => toggleResolved(d)}
                    className={`rounded px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
                      d.resolvedAt
                        ? "border border-gray-700 text-gray-400"
                        : "bg-accent/20 text-accent ring-1 ring-accent/40"
                    }`}
                  >
                    {d.resolvedAt ? "↺ Öffnen" : "✓ Erledigt"}
                  </button>
                  <button
                    onClick={() => deleteDamage(d.id)}
                    className="rounded px-2 py-0.5 text-[10px] text-gray-600 hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
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
              className="box-border block h-10 w-full min-w-0 appearance-none rounded border border-gray-700 bg-gray-900 px-3 text-sm text-white focus:border-accent focus:outline-none"
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

// AddDamageModal wurde durch LiveSchädenTab ersetzt (direkt in-tab Form)

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
            Schäden fotografiert ({damageCount})
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
