"use client";

import { useCallback, useEffect, useState } from "react";
import { WgPageHeader } from "@/components/WgPageHeader";

type Unit = "carton" | "carton1l" | "single" | "single1l";

const UNITS: {
  id: Unit;
  label: string;
  short: string;
  priceKey: "unitCents" | "carton1lCents" | "singleCents" | "single1lCents";
}[] = [
  { id: "carton", label: "Karton 6 × 1.5 l", short: "Kartons", priceKey: "unitCents" },
  { id: "carton1l", label: "Karton 6 × 1 l", short: "Kartons", priceKey: "carton1lCents" },
  { id: "single", label: "Packung 1.5 l", short: "Packungen", priceKey: "singleCents" },
  { id: "single1l", label: "Packung 1 l", short: "Packungen", priceKey: "single1lCents" },
];

interface Order {
  id: string;
  date: string;
  boughtById: string;
  unit: Unit;
  quantity: number;
  unitCents: number;
  totalCents: number;
  participantIds: string[];
  createdById: string;
}
interface Payment {
  id: string;
  date: string;
  fromId: string;
  toId: string;
  amountCents: number;
  createdById: string;
}
interface Settlement {
  fromId: string;
  toId: string;
  amountCents: number;
}
interface Data {
  members: { id: string; name: string }[];
  names: Record<string, string>;
  settings: {
    participantIds: string[];
    unitCents: number;
    carton1lCents: number;
    singleCents: number;
    single1lCents: number;
  };
  orders: Order[];
  payments: Payment[];
  balances: { userId: string; netCents: number }[];
  settlements: Settlement[];
  stats: {
    counts: Record<Unit, number>;
    totalCents: number;
    participants: number;
    perPersonCents: number;
  };
}

interface Props {
  slug: string;
  wgName: string;
  meId: string;
}

const chf = (c: number) => (c / 100).toFixed(2);
const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    timeZone: "UTC",
  });
function todayIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function parseChf(s: string): number | null {
  const n = Number(s.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}
function unitLabel(unit: Unit, n: number): string {
  const pack = n === 1 ? "Packung" : "Packungen";
  const box = n === 1 ? "Karton" : "Kartons";
  if (unit === "single") return `${pack} 1.5 l`;
  if (unit === "single1l") return `${pack} 1 l`;
  if (unit === "carton1l") return `${box} 6 × 1 l`;
  return `${box} 6 × 1.5 l`;
}
function defaultCents(s: Data["settings"], unit: Unit): number {
  const key = UNITS.find((u) => u.id === unit)?.priceKey ?? "unitCents";
  return s[key];
}

export function HafermilchClient({ slug, wgName, meId }: Props) {
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  // Bestell-Formular
  const [date, setDate] = useState(todayIso());
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState<Unit>("carton");
  const [price, setPrice] = useState("24.90");
  const [buyer, setBuyer] = useState(meId);
  const [priceTouched, setPriceTouched] = useState(false);

  // Einstellungen: Standardpreise pro Einheit (als CHF-Strings)
  const [prices, setPrices] = useState<Record<Unit, string>>({
    carton: "24.90",
    carton1l: "17.40",
    single: "4.15",
    single1l: "2.90",
  });

  const base = `/api/meine-wg/${slug}/hafermilch`;

  const apply = useCallback(
    (d: Data) => {
      setData(d);
      setPrices({
        carton: chf(d.settings.unitCents),
        carton1l: chf(d.settings.carton1lCents),
        single: chf(d.settings.singleCents),
        single1l: chf(d.settings.single1lCents),
      });
      if (!priceTouched) setPrice(chf(defaultCents(d.settings, unit)));
    },
    [priceTouched, unit]
  );

  // Einheit wechseln → Standardpreis der Einheit uebernehmen.
  function switchUnit(u: Unit) {
    setUnit(u);
    setPriceTouched(false);
    if (data) setPrice(chf(defaultCents(data.settings, u)));
  }

  const load = useCallback(async () => {
    const res = await fetch(base, { cache: "no-store" });
    if (res.ok) apply((await res.json()) as Data);
  }, [base, apply]);

  useEffect(() => {
    load();
  }, [load]);

  async function call(
    path: string,
    init: RequestInit,
    okMsg?: string
  ): Promise<boolean> {
    if (busy) return false;
    setBusy(true);
    try {
      const res = await fetch(path, {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      const body = (await res.json().catch(() => null)) as
        | (Data & { error?: undefined })
        | { error?: string }
        | null;
      if (!res.ok) {
        alert((body as { error?: string } | null)?.error ?? "Fehler");
        return false;
      }
      if (body && "members" in body) apply(body);
      if (okMsg) {
        // kurze Bestaetigung ohne Modal
        console.info(okMsg);
      }
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function saveParticipants(ids: string[]) {
    await call(base, { method: "PUT", body: JSON.stringify({ participantIds: ids }) });
  }

  async function saveDefaultPrice(u: Unit) {
    const c = parseChf(prices[u]);
    if (!c) return;
    const key = UNITS.find((x) => x.id === u)!.priceKey;
    await call(base, { method: "PUT", body: JSON.stringify({ [key]: c }) });
  }

  async function addOrder(e: React.FormEvent) {
    e.preventDefault();
    const unitCents = parseChf(price);
    if (!unitCents) {
      alert("Preis pro Karton fehlt");
      return;
    }
    const ok = await call(`${base}/orders`, {
      method: "POST",
      body: JSON.stringify({
        date,
        quantity: qty,
        unit,
        unitCents,
        boughtById: buyer,
      }),
    });
    if (ok) {
      setShowForm(false);
      setQty(1);
      setDate(todayIso());
      setBuyer(meId);
      setPriceTouched(false);
    }
  }

  async function pay(s: Settlement) {
    const to = data?.names[s.toId] ?? "?";
    if (!confirm(`CHF ${chf(s.amountCents)} an ${to} als bezahlt markieren?`)) return;
    await call(`${base}/payments`, {
      method: "POST",
      body: JSON.stringify({ toId: s.toId, amountCents: s.amountCents }),
    });
  }

  async function deleteOrder(id: string) {
    if (!confirm("Bestellung wirklich löschen?")) return;
    await call(`${base}/orders/${id}`, { method: "DELETE" });
  }

  async function deletePayment(id: string) {
    if (!confirm("Zahlung wirklich löschen?")) return;
    await call(`${base}/payments/${id}`, { method: "DELETE" });
  }

  const name = (id: string) => data?.names[id] ?? "?";
  const myNet = data?.balances.find((b) => b.userId === meId)?.netCents ?? 0;
  const needsSetup = !!data && data.settings.participantIds.length === 0;
  const settingsOpen = showSettings || needsSetup;

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-24">
      <WgPageHeader
        backToWgSlug={slug}
        backToWgName={wgName}
        title="Oatly"
        subtitle="Hafermilch-Kasse · Karton à 6 × 1.5 l"
      />

      {!data ? (
        <p className="mt-6 text-center text-xs text-gray-500">Lade …</p>
      ) : (
        <div className="mt-4 space-y-4">
          {/* Einrichtung / Einstellungen */}
          {settingsOpen ? (
            <div className="wg-tile p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-display text-xs font-bold uppercase tracking-widest text-white">
                  {needsSetup ? "Wer trinkt mit?" : "Einstellungen"}
                </p>
                {!needsSetup && (
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="font-mono text-[10px] text-gray-400 hover:text-white"
                  >
                    schliessen
                  </button>
                )}
              </div>
              <p className="mb-2 text-[11px] text-gray-400">
                Jede Bestellung wird gleichmässig auf diese Personen verteilt.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {data.members.map((m) => {
                  const on = data.settings.participantIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        saveParticipants(
                          on
                            ? data.settings.participantIds.filter((x) => x !== m.id)
                            : [...data.settings.participantIds, m.id]
                        )
                      }
                      className={`rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-50 ${
                        on
                          ? "border-white bg-white text-black"
                          : "border-gray-600 text-gray-300 hover:border-white"
                      }`}
                    >
                      {on ? "✓ " : ""}
                      {m.name}
                    </button>
                  );
                })}
              </div>
              <p className="mb-1 mt-3 text-[10px] uppercase tracking-wider text-gray-500">
                Standardpreise (pro Bestellung anpassbar)
              </p>
              <div className="space-y-2">
                {UNITS.map((u) => (
                  <div key={u.id} className="flex items-center gap-2">
                    <label className="w-36 text-[11px] text-gray-400">{u.label}</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={prices[u.id]}
                      onChange={(e) =>
                        setPrices((p) => ({ ...p, [u.id]: e.target.value }))
                      }
                      onBlur={() => saveDefaultPrice(u.id)}
                      className="w-20 rounded border border-gray-700 bg-black/40 px-2 py-1 text-right text-sm text-white focus:border-white focus:outline-none"
                    />
                    <span className="text-[11px] text-gray-500">CHF</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {!needsSetup && (
            <>
              {/* Meine Bilanz */}
              <div className="wg-tile-heavy p-4 text-center">
                <p className="font-mono text-[10px] uppercase tracking-widest text-gray-300">
                  Meine Bilanz
                </p>
                {myNet > 0 ? (
                  <p className="mt-1 font-display text-3xl font-bold text-emerald-300">
                    + CHF {chf(myNet)}
                  </p>
                ) : myNet < 0 ? (
                  <p className="mt-1 font-display text-3xl font-bold text-orange-300">
                    − CHF {chf(-myNet)}
                  </p>
                ) : (
                  <p className="mt-1 font-display text-3xl font-bold text-white">
                    CHF 0.00
                  </p>
                )}
                <p className="mt-1 text-[11px] text-gray-400">
                  {myNet > 0
                    ? "bekommst du zurück"
                    : myNet < 0
                      ? "schuldest du"
                      : "alles ausgeglichen"}
                </p>
              </div>

              {/* Wer zahlt wem */}
              <div className="wg-tile p-3">
                <p className="mb-2 font-display text-xs font-bold uppercase tracking-widest text-white">
                  Wer zahlt wem
                </p>
                {data.settlements.length === 0 ? (
                  <p className="text-xs text-gray-500">Niemand schuldet jemandem etwas. 🎉</p>
                ) : (
                  <ul className="space-y-2">
                    {data.settlements.map((s) => {
                      const mine = s.fromId === meId;
                      const toMe = s.toId === meId;
                      return (
                        <li
                          key={`${s.fromId}-${s.toId}`}
                          className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
                            mine || toMe
                              ? "border-white/30 bg-white/10"
                              : "border-white/10 bg-black/20"
                          }`}
                        >
                          <span className="min-w-0 truncate text-sm text-white">
                            {mine ? "Du" : name(s.fromId)}{" "}
                            <span className="text-gray-400">→</span>{" "}
                            {toMe ? "dir" : name(s.toId)}
                          </span>
                          <span className="shrink-0 font-mono text-sm font-bold text-white">
                            CHF {chf(s.amountCents)}
                          </span>
                          {mine && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => pay(s)}
                              className="shrink-0 rounded-md bg-emerald-400 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-black disabled:opacity-50"
                            >
                              Bezahlt ✓
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Bestellung erfassen */}
              {showForm ? (
                <form onSubmit={addOrder} className="wg-tile space-y-3 p-3">
                  <p className="font-display text-xs font-bold uppercase tracking-widest text-white">
                    Bestellung erfassen
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {UNITS.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => switchUnit(u.id)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                          unit === u.id
                            ? "border-white bg-white text-black"
                            : "border-gray-600 text-gray-300 hover:border-white"
                        }`}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-[10px] text-gray-400">Datum</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="box-border block h-10 w-full min-w-0 appearance-none rounded border border-gray-700 bg-black/40 px-2 text-xs text-white focus:border-white focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] text-gray-400">
                        {UNITS.find((u) => u.id === unit)?.short ?? "Anzahl"}
                      </label>
                      <div className="flex h-10 items-center rounded border border-gray-700 bg-black/40">
                        <button
                          type="button"
                          onClick={() => setQty((q) => Math.max(1, q - 1))}
                          className="h-full w-10 text-lg text-gray-300"
                        >
                          −
                        </button>
                        <span className="flex-1 text-center font-mono text-sm font-bold text-white">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty((q) => Math.min(100, q + 1))}
                          className="h-full w-10 text-lg text-gray-300"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] text-gray-400">
                        Preis pro {unit.startsWith("carton") ? "Karton" : "Packung"} (CHF) — anpassbar
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={price}
                        onChange={(e) => {
                          setPrice(e.target.value);
                          setPriceTouched(true);
                        }}
                        className="h-10 w-full rounded border border-gray-700 bg-black/40 px-2 text-sm text-white focus:border-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] text-gray-400">Gekauft von</label>
                      <select
                        value={buyer}
                        onChange={(e) => setBuyer(e.target.value)}
                        className="h-10 w-full rounded border border-gray-700 bg-black/40 px-2 text-sm text-white focus:border-white focus:outline-none"
                      >
                        {data.members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Total CHF {chf((parseChf(price) ?? 0) * qty)} · geteilt durch{" "}
                    {data.settings.participantIds.length} Personen = CHF{" "}
                    {chf(
                      Math.floor(
                        ((parseChf(price) ?? 0) * qty) /
                          Math.max(1, data.settings.participantIds.length)
                      )
                    )}{" "}
                    pro Person
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-md bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-black disabled:opacity-50"
                    >
                      Eintragen
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="rounded-md px-3 py-2 text-xs text-gray-400 hover:text-white"
                    >
                      Abbrechen
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="flex-1 rounded-md bg-white py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-black hover:brightness-90"
                  >
                    🥛 Bestellung erfassen
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSettings(true)}
                    className="rounded-md border border-gray-600 px-3 py-2.5 font-mono text-xs text-gray-300 hover:border-white"
                    title="Einstellungen"
                  >
                    ⚙
                  </button>
                </div>
              )}

              {/* Zahlen */}
              <p className="text-center font-mono text-[10px] uppercase tracking-wider text-gray-500">
                {UNITS.filter((u) => data.stats.counts[u.id] > 0)
                  .map((u) => `${data.stats.counts[u.id]} × ${u.label}`)
                  .join(" + ") || "noch nichts bestellt"}{" "}
                · CHF {chf(data.stats.totalCents)} · {data.stats.participants} Personen ·
                CHF {chf(data.stats.perPersonCents)} pro Person
              </p>

              {/* Verlauf */}
              <div className="wg-tile p-3">
                <button
                  type="button"
                  onClick={() => setShowHistory((v) => !v)}
                  className="flex w-full items-center justify-between"
                >
                  <p className="font-display text-xs font-bold uppercase tracking-widest text-white">
                    Verlauf
                  </p>
                  <span className="text-gray-400">{showHistory ? "▲" : "▼"}</span>
                </button>
                {showHistory && (
                  <div className="mt-2 space-y-1.5">
                    {[...data.orders.map((o) => ({ kind: "order" as const, date: o.date, o })),
                      ...data.payments.map((p) => ({ kind: "payment" as const, date: p.date, p }))]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((row) =>
                        row.kind === "order" ? (
                          <div
                            key={`o-${row.o.id}`}
                            className="flex items-center justify-between gap-2 rounded-lg bg-black/20 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm text-white">
                                🥛 {row.o.quantity} {unitLabel(row.o.unit, row.o.quantity)} ·{" "}
                                {name(row.o.boughtById)}
                              </p>
                              <p className="font-mono text-[10px] text-gray-500">
                                {fmtDate(row.o.date)} · {row.o.quantity} × {chf(row.o.unitCents)} ={" "}
                                CHF {chf(row.o.totalCents)}
                              </p>
                            </div>
                            {(row.o.createdById === meId || row.o.boughtById === meId) && (
                              <button
                                type="button"
                                onClick={() => deleteOrder(row.o.id)}
                                className="text-xs text-gray-600 hover:text-red-400"
                                aria-label="Löschen"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ) : (
                          <div
                            key={`p-${row.p.id}`}
                            className="flex items-center justify-between gap-2 rounded-lg bg-emerald-500/10 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm text-white">
                                💸 {name(row.p.fromId)} → {name(row.p.toId)}
                              </p>
                              <p className="font-mono text-[10px] text-gray-500">
                                {fmtDate(row.p.date)} · CHF {chf(row.p.amountCents)}
                              </p>
                            </div>
                            {(row.p.fromId === meId || row.p.toId === meId) && (
                              <button
                                type="button"
                                onClick={() => deletePayment(row.p.id)}
                                className="text-xs text-gray-600 hover:text-red-400"
                                aria-label="Löschen"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        )
                      )}
                    {data.orders.length === 0 && data.payments.length === 0 && (
                      <p className="text-xs text-gray-500">Noch keine Bestellungen.</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
