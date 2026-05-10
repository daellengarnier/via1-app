"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WgPageHeader } from "@/components/WgPageHeader";
import {
  DEFAULT_BONUS_TASKS,
  OVERDUE_DAYS_THRESHOLD,
  PFLICHT_TASKS,
  daysBetween,
  pickJoke,
} from "@/lib/wg-aemtli";

interface Person {
  id: string;
  name: string;
  avatar: string | null;
}

interface MemberWithKey extends Person {
  room: { keyNumber: string | null } | null;
}

interface Round {
  id: string;
  byUser: Person;
  doneAt: string;
}

interface SwapReq {
  id: string;
  from: Person;
  to: Person;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

interface ApiData {
  members: MemberWithKey[];
  rotationOrder: string[];
  currentIndex: number;
  currentUser: Person | null;
  lastDoneBy: Person | null;
  lastDoneAt: string | null;
  checkedPflicht: string[];
  customBonus: string[];
  history: Round[];
  bonusLog: Record<string, { byUser: Person; date: string }>;
  swapRequests: SwapReq[];
}

interface Props {
  slug: string;
  wgName: string;
  meId: string;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AemtliClient({ slug, wgName, meId }: Props) {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [doneDate, setDoneDate] = useState(todayIso());
  const [swapTarget, setSwapTarget] = useState("");
  const [tasksOpen, setTasksOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [newOptional, setNewOptional] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/meine-wg/${slug}/aemtli`);
      if (!res.ok) return;
      setData((await res.json()) as ApiData);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const allOptional = useMemo(() => {
    if (!data) return [] as string[];
    return [...DEFAULT_BONUS_TASKS, ...data.customBonus];
  }, [data]);

  if (loading || !data) {
    return (
      <div className="mx-auto min-h-screen max-w-md px-4 pb-24">
        <WgPageHeader
          backToWgSlug={slug}
          backToWgName={wgName}
          title="🧹 Ämtli"
        />
        <p className="mt-4 text-sm text-gray-400">Lade...</p>
      </div>
    );
  }

  const overdueDays = data.lastDoneAt ? daysBetween(data.lastDoneAt) : 999;
  const isOverdue = overdueDays >= OVERDUE_DAYS_THRESHOLD;
  const joke = isOverdue ? pickJoke(overdueDays) : null;

  const checked = new Set(data.checkedPflicht);
  const allMandatoryDone = PFLICHT_TASKS.every((t) => checked.has(t));

  const pendingForMe = data.swapRequests.filter(
    (s) => s.to.id === meId && s.status === "pending"
  );

  async function toggleCheck(task: string) {
    const isChecked = checked.has(task);
    setBusy(true);
    try {
      await fetch(`/api/meine-wg/${slug}/aemtli/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, checked: !isChecked }),
      });
      load();
    } finally {
      setBusy(false);
    }
  }

  async function toggleBonus(task: string) {
    const wasDone = !!data?.bonusLog[task];
    setBusy(true);
    try {
      await fetch(`/api/meine-wg/${slug}/aemtli/bonus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, done: !wasDone }),
      });
      load();
    } finally {
      setBusy(false);
    }
  }

  async function markDone(date?: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/meine-wg/${slug}/aemtli/done`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: date ?? null }),
      });
      if (res.ok) {
        setShowDatePicker(false);
        setDoneDate(todayIso());
        load();
      } else {
        const b = (await res.json().catch(() => ({}))) as { error?: string };
        alert(b.error ?? "Fehler");
      }
    } finally {
      setBusy(false);
    }
  }

  async function addCustomBonus() {
    const name = newOptional.trim();
    if (!name) return;
    setBusy(true);
    try {
      await fetch(`/api/meine-wg/${slug}/aemtli/custom-bonus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setNewOptional("");
      load();
    } finally {
      setBusy(false);
    }
  }

  async function removeCustomBonus(name: string) {
    setBusy(true);
    try {
      await fetch(`/api/meine-wg/${slug}/aemtli/custom-bonus`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      load();
    } finally {
      setBusy(false);
    }
  }

  async function requestSwap() {
    if (!swapTarget) return;
    setBusy(true);
    try {
      await fetch(`/api/meine-wg/${slug}/aemtli/swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: swapTarget }),
      });
      setSwapTarget("");
      load();
    } finally {
      setBusy(false);
    }
  }

  async function respondSwap(swapId: string, accept: boolean) {
    setBusy(true);
    try {
      await fetch(`/api/meine-wg/${slug}/aemtli/swap/${swapId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept }),
      });
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-24">
      <WgPageHeader
        backToWgSlug={slug}
        backToWgName={wgName}
        title="🧹 Ämtli"
      />

      {/* Aktuell dran */}
      <div className="wg-tile mt-3 p-5 text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
          Aktuell dran
        </p>
        {data.currentUser ? (
          <>
            <div className="mx-auto mt-3 flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-white/10 text-2xl font-bold text-white">
              {data.currentUser.name.charAt(0).toUpperCase()}
            </div>
            <p className="mt-3 font-display font-bold uppercase tracking-wider text-2xl text-white">
              {data.currentUser.name}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm italic text-gray-500">
            Keine Rotation eingerichtet
          </p>
        )}
        <p className="mt-2 text-xs text-gray-400">
          Zuletzt:{" "}
          <span className="text-white">
            {data.lastDoneBy?.name ?? "—"}
          </span>
          {data.lastDoneAt && (
            <span className="text-gray-500">, {fmtDate(data.lastDoneAt)}</span>
          )}
        </p>
        {joke && (
          <p className="mt-3 italic text-orange-300">{joke}</p>
        )}

        {data.currentUser && (
          <div className="mt-4">
            {!showDatePicker ? (
              <div className="flex gap-2">
                <button
                  onClick={() => markDone()}
                  disabled={busy || !allMandatoryDone}
                  className={`flex-1 rounded-lg px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider ${
                    allMandatoryDone
                      ? "bg-white text-black hover:brightness-90"
                      : "border border-white/20 bg-white/5 text-gray-400"
                  } disabled:opacity-50`}
                >
                  {allMandatoryDone
                    ? "Heute erledigt! ✨"
                    : "Erst alle Pflicht-Tasks abhaken"}
                </button>
                <button
                  onClick={() => setShowDatePicker(true)}
                  disabled={busy || !allMandatoryDone}
                  className="rounded-lg border border-white/30 bg-white/5 px-4 py-3 text-base hover:bg-white/15 disabled:opacity-50"
                  title="Anderes Datum waehlen"
                >
                  📅
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-white/15 bg-white/5 p-3">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-gray-400">
                  Wann erledigt?
                </p>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={doneDate}
                    max={todayIso()}
                    onChange={(e) => setDoneDate(e.target.value)}
                    className="flex-1 rounded border border-white/20 bg-black/40 px-2 py-1 text-sm text-white"
                  />
                  <button
                    onClick={() => markDone(doneDate)}
                    disabled={busy}
                    className="rounded bg-white px-3 py-1 font-mono text-[10px] font-bold uppercase text-black disabled:opacity-50"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="rounded border border-white/20 px-3 py-1 text-gray-400"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Swap-Anfragen fuer mich */}
      {pendingForMe.length > 0 && (
        <div className="mt-3 space-y-2">
          {pendingForMe.map((r) => (
            <div
              key={r.id}
              className="wg-tile p-3"
              style={{ borderColor: "rgba(255,140,0,0.5)" }}
            >
              <p className="text-sm text-white">
                <span className="font-bold">{r.from.name}</span> möchte mit dir
                tauschen!
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => respondSwap(r.id, true)}
                  disabled={busy}
                  className="flex-1 rounded-lg bg-white px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-black hover:brightness-90 disabled:opacity-50"
                >
                  Annehmen
                </button>
                <button
                  onClick={() => respondSwap(r.id, false)}
                  disabled={busy}
                  className="rounded-lg border border-white/30 bg-white/5 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-white hover:bg-white/15"
                >
                  Ablehnen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Swap anfragen */}
      <div className="mt-3 wg-tile p-3">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-white">
          🔄 Schicht tauschen mit...
        </p>
        <div className="flex gap-2">
          <select
            value={swapTarget}
            onChange={(e) => setSwapTarget(e.target.value)}
            className="flex-1 rounded border border-white/20 bg-black/40 px-2 py-2 text-sm text-white"
          >
            <option value="">Wählen…</option>
            {data.rotationOrder
              .filter((id) => id !== meId)
              .map((id) => {
                const m = data.members.find((x) => x.id === id);
                if (!m) return null;
                return (
                  <option key={id} value={id}>
                    {m.name}
                  </option>
                );
              })}
          </select>
          <button
            onClick={requestSwap}
            disabled={busy || !swapTarget}
            className="rounded bg-white px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-black hover:brightness-90 disabled:opacity-50"
          >
            Anfragen
          </button>
        </div>
      </div>

      {/* Pflicht-Tasks */}
      <div className="mt-3 wg-tile p-3">
        <button
          onClick={() => setTasksOpen((v) => !v)}
          className="flex w-full items-center justify-between"
        >
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-white">
            📋 Pflichtaufgaben
          </span>
          <span className="text-xs text-gray-500">{tasksOpen ? "▲" : "▼"}</span>
        </button>
        {tasksOpen && (
          <div className="mt-2 space-y-1">
            {PFLICHT_TASKS.map((t, i) => {
              const isChecked = checked.has(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleCheck(t)}
                  disabled={busy}
                  className={`flex w-full items-center gap-3 py-2 text-left text-sm ${
                    i > 0 ? "border-t border-white/10" : ""
                  } disabled:opacity-50`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                      isChecked
                        ? "border-white bg-white/20"
                        : "border-white/30"
                    }`}
                  >
                    {isChecked && <span className="text-white">✓</span>}
                  </span>
                  <span
                    className={`flex-1 ${
                      isChecked
                        ? "text-gray-500 line-through"
                        : "text-white"
                    }`}
                  >
                    {t}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bonus-Tasks */}
      <div className="mt-3 wg-tile p-3">
        <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-white">
          ⭐ Bonus-Aufgaben
        </p>
        <p className="mt-0.5 text-[11px] text-gray-400">
          Optional — wenn du extra motiviert bist!
        </p>
        <div className="mt-2 space-y-1">
          {allOptional.map((t, i) => {
            const log = data.bonusLog[t];
            const isCustom = data.customBonus.includes(t);
            const isChecked = !!log;
            return (
              <div
                key={t}
                className={`flex items-start gap-3 py-2 ${
                  i > 0 ? "border-t border-white/10" : ""
                }`}
              >
                <button
                  onClick={() => toggleBonus(t)}
                  disabled={busy}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
                    isChecked
                      ? "border-white bg-white/20"
                      : "border-white/30"
                  } disabled:opacity-50`}
                >
                  {isChecked && <span className="text-white">✓</span>}
                </button>
                <div className="flex-1">
                  <p
                    className={`text-sm ${
                      isChecked ? "text-gray-500 line-through" : "text-white"
                    }`}
                  >
                    {t}
                  </p>
                  {log && (
                    <p className="text-[11px] text-gray-500">
                      Zuletzt: {log.byUser.name}, {fmtDate(log.date)}
                    </p>
                  )}
                </div>
                {isCustom && (
                  <button
                    onClick={() => removeCustomBonus(t)}
                    className="text-xs text-gray-500 hover:text-red-300"
                    title="Entfernen"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={newOptional}
            onChange={(e) => setNewOptional(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomBonus()}
            placeholder="Neue Aufgabe hinzufügen..."
            maxLength={80}
            className="flex-1 rounded border border-white/20 bg-black/40 px-2 py-2 text-sm text-white placeholder-gray-500"
          />
          <button
            onClick={addCustomBonus}
            disabled={busy || !newOptional.trim()}
            className="rounded border border-white/30 bg-white/5 px-3 py-2 font-mono text-[12px] font-bold text-white hover:bg-white/15 disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>

      {/* Rotation-Pills */}
      {data.rotationOrder.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {data.rotationOrder.map((id, idx) => {
            const m = data.members.find((x) => x.id === id);
            if (!m) return null;
            const isCurrent = idx === data.currentIndex % data.rotationOrder.length;
            return (
              <span
                key={id}
                className={`rounded-full border px-3 py-1 font-mono text-xs ${
                  isCurrent
                    ? "border-white bg-white/20 text-white"
                    : "border-white/15 bg-white/5 text-gray-400"
                }`}
              >
                {m.name}
              </span>
            );
          })}
        </div>
      )}

      {/* Verlauf */}
      <div className="mt-3 wg-tile p-3">
        <button
          onClick={() => setHistoryOpen((v) => !v)}
          className="flex w-full items-center justify-between"
        >
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-white">
            📜 Verlauf
          </span>
          <span className="text-xs text-gray-500">
            {historyOpen ? "▲" : "▼"}
          </span>
        </button>
        {historyOpen && (
          <div className="mt-2 space-y-1">
            {data.history.length === 0 ? (
              <p className="py-3 text-center text-xs italic text-gray-500">
                noch keine Erledigungen
              </p>
            ) : (
              data.history.map((h, i) => (
                <div
                  key={h.id}
                  className={`flex items-center gap-2 py-2 ${
                    i > 0 ? "border-t border-white/10" : ""
                  }`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-white/10 text-xs font-bold text-white">
                    {h.byUser.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="flex-1 text-sm text-white">
                    {h.byUser.name}
                  </span>
                  <span className="font-mono text-xs text-gray-400">
                    {fmtDate(h.doneAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
