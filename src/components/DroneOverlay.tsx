"use client";

import { useEffect, useRef, useState } from "react";

// Grobe Sonnenauf-/Sonnenuntergangs-Stunden fuer Bern (47°N), als
// lokale Uhrzeit inkl. DST. Genauigkeit reicht fuer "darf die Drohne
// noch fliegen?" — Livio fliegt eh nicht im Dunkeln.
const SUNRISE_BY_MONTH = [8.0, 7.5, 6.5, 6.5, 5.5, 5.5, 5.5, 6.0, 7.0, 7.5, 7.5, 8.0];
const SUNSET_BY_MONTH  = [17.0, 17.8, 19.0, 20.3, 21.0, 21.5, 21.5, 20.8, 19.8, 18.5, 16.8, 16.5];

export function isDaylight(date: Date = new Date()): boolean {
  const hour = date.getHours() + date.getMinutes() / 60;
  const month = date.getMonth();
  const sunrise = SUNRISE_BY_MONTH[month] ?? 6;
  const sunset = SUNSET_BY_MONTH[month] ?? 20;
  return hour >= sunrise && hour < sunset;
}

export interface DroneFlightInfo {
  id: string;
  startedAt: string;
  startedBy: { id: string; name: string; avatar: string | null };
  isMine: boolean;
  complaints: {
    id: string;
    text: string;
    author: { id: string; name: string };
    createdAt: string;
    likeCount: number;
    likedByMe: boolean;
    isMine: boolean;
  }[];
}

interface Props {
  flight: DroneFlightInfo;
  onStopped: () => void;
  onComplaintAdded: () => void;
}

// Drohne fliegt random ueber den Viewport, bleibt am Rand zurueck-
// kommend. Klick auf die Drohne oeffnet ein Modal mit Starter +
// Beschwerde-Form. Die letzten Beschwerden fliegen als Sprechblasen
// mit der Drohne mit (rotieren alle paar Sekunden).
export function DroneOverlay({ flight, onStopped, onComplaintAdded }: Props) {
  const [pos, setPos] = useState<{ x: number; y: number }>(() => ({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 200,
    y: typeof window !== "undefined" ? Math.min(140, window.innerHeight / 3) : 100,
  }));
  const [modalOpen, setModalOpen] = useState(false);
  const [bubbleIdx, setBubbleIdx] = useState(0);

  // Random-Target alle 4-7s — Drohne schwebt mit CSS-Transition dort-
  // hin und nimmt automatisch eine neue Position an, sobald sie da ist.
  useEffect(() => {
    function nextTarget() {
      const margin = 60;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const x = margin + Math.random() * Math.max(0, w - margin * 2);
      const y = 80 + Math.random() * Math.max(0, h - 80 - 160);
      setPos({ x, y });
    }
    nextTarget();
    const id = window.setInterval(nextTarget, 4500 + Math.random() * 2000);
    return () => window.clearInterval(id);
  }, []);

  // Bei Sonnenuntergang automatisch stoppen.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!isDaylight()) onStopped();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [onStopped]);

  // Bubble-Rotation: alle 4s wechselt die angezeigte Beschwerde.
  useEffect(() => {
    if (flight.complaints.length === 0) return;
    const id = window.setInterval(() => {
      setBubbleIdx((i) => i + 1);
    }, 4000);
    return () => window.clearInterval(id);
  }, [flight.complaints.length]);

  const currentComplaint =
    flight.complaints.length > 0
      ? flight.complaints[bubbleIdx % flight.complaints.length]
      : null;

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-[60]"
        style={{ overflow: "hidden" }}
        aria-hidden
      >
        <div
          className="drone-carrier"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px)`,
          }}
        >
          {currentComplaint && (
            <div className="drone-bubble" role="status">
              {currentComplaint.likeCount > 0 && (
                <div className="drone-bubble-likes-row">
                  <span className="drone-bubble-likes">
                    👍 {currentComplaint.likeCount}
                  </span>
                </div>
              )}
              <div className="drone-bubble-text">
                <span className="drone-bubble-author">
                  {currentComplaint.author.name.toUpperCase()}
                </span>{" "}
                sagt: {currentComplaint.text}
              </div>
            </div>
          )}
          <div className="drone-bob">
            <button
              type="button"
              aria-label="Drohne anklicken"
              className="drone-hitbox pointer-events-auto"
              onClick={() => setModalOpen(true)}
            >
              <DroneSvg />
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <ComplaintModal
          flight={flight}
          onClose={() => setModalOpen(false)}
          onComplaintAdded={onComplaintAdded}
        />
      )}
    </>
  );
}

// Vordefinierte Beschwerden — Klick = direkt absenden.
const QUICK_COMPLAINTS = [
  "Bitte höher fliegen",
  "Bitte ganz weg",
];

const TIME_FMT = new Intl.DateTimeFormat("de-CH", {
  hour: "2-digit",
  minute: "2-digit",
});

function formatStartTime(iso: string): string {
  const started = new Date(iso);
  const minutesAgo = Math.max(
    0,
    Math.round((Date.now() - started.getTime()) / 60000)
  );
  const time = TIME_FMT.format(started);
  if (minutesAgo < 1) return `${time} Uhr · gerade gestartet`;
  if (minutesAgo === 1) return `${time} Uhr · seit 1 min`;
  if (minutesAgo < 60) return `${time} Uhr · seit ${minutesAgo} min`;
  const hours = Math.floor(minutesAgo / 60);
  return `${time} Uhr · seit ${hours}h ${minutesAgo % 60}min`;
}

interface HistoryComplaint {
  id: string;
  text: string;
  author: { id: string; name: string };
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  isMine: boolean;
}

interface HistoryFlight {
  id: string;
  startedAt: string;
  endedAt: string | null;
  startedBy: { id: string; name: string };
  complaints: HistoryComplaint[];
}

function ComplaintModal({
  flight,
  onClose,
  onComplaintAdded,
}: {
  flight: DroneFlightInfo;
  onClose: () => void;
  onComplaintAdded: () => void;
}) {
  const [tab, setTab] = useState<"beschwerde" | "historie">("beschwerde");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryFlight[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (tab === "beschwerde") inputRef.current?.focus();
  }, [tab]);

  useEffect(() => {
    if (tab !== "historie" || history !== null) return;
    setHistoryLoading(true);
    fetch("/api/drohne/history")
      .then((r) => r.json())
      .then((d: { flights: HistoryFlight[] }) => setHistory(d.flights))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [tab, history]);

  async function sendComplaint(value: string) {
    const v = value.trim();
    if (!v) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/drohne/complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: v }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Fehler beim Senden");
      }
      setText("");
      // History neu laden falls offen — neue Beschwerde soll dort auftauchen.
      setHistory(null);
      onComplaintAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-hidden rounded-2xl border border-gray-800 bg-gray-950"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
          <h2 className="font-display text-base font-bold uppercase tracking-wider text-white">
            <span className="mr-2">🚁</span>Drohne erwischt
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schliessen"
            className="text-2xl leading-none text-gray-500 hover:text-white"
          >
            ×
          </button>
        </div>

        {/* Starter-Info */}
        <div className="border-b border-gray-800 px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-gray-500">
            Gestartet von
          </div>
          <div className="text-base font-semibold text-white">
            {flight.startedBy.name}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-gray-500">
            {formatStartTime(flight.startedAt)}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {(["beschwerde", "historie"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 px-3 py-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                tab === t
                  ? "border-b-2 border-accent text-white"
                  : "border-b-2 border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {t === "beschwerde" ? "Beschwerde" : "Historie"}
            </button>
          ))}
        </div>

        {/* Tab-Content */}
        <div className="max-h-[55vh] overflow-y-auto p-4">
          {tab === "beschwerde" ? (
            <>
              {/* Quick-Replies: ein Klick = direkt senden. */}
              <div className="mb-4 flex flex-wrap gap-2">
                {QUICK_COMPLAINTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendComplaint(q)}
                    disabled={sending}
                    className="rounded-full border border-gray-700 bg-black/40 px-3 py-1.5 text-xs text-gray-200 hover:border-accent hover:text-white disabled:opacity-40"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-gray-500">
                ...oder eigene Beschwerde
              </label>
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={200}
                placeholder="Geht das nicht etwas ruhiger?"
                className="h-20 w-full resize-none rounded-lg border border-gray-800 bg-black/50 p-2.5 text-sm text-white placeholder:text-gray-600 focus:border-accent focus:outline-none"
              />
              <div className="mt-1 text-right font-mono text-[10px] text-gray-600">
                {text.length}/200
              </div>

              {error && (
                <div className="mt-3 rounded-lg border border-red-900/50 bg-red-950/40 p-2.5 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={() => sendComplaint(text)}
                disabled={sending || !text.trim()}
                className="mt-4 w-full rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-40"
              >
                {sending ? "Senden..." : "Beschwerde senden"}
              </button>
            </>
          ) : (
            <HistoryList
              loading={historyLoading}
              flights={history}
              onLikeToggled={(cid, liked) => {
                setHistory((prev) =>
                  prev === null
                    ? prev
                    : prev.map((f) => ({
                        ...f,
                        complaints: f.complaints.map((c) =>
                          c.id !== cid
                            ? c
                            : {
                                ...c,
                                likedByMe: liked,
                                likeCount: Math.max(
                                  0,
                                  c.likeCount + (liked ? 1 : -1)
                                ),
                              }
                        ),
                      }))
                );
              }}
              onDeleted={(cid) => {
                setHistory((prev) =>
                  prev === null
                    ? prev
                    : prev.map((f) => ({
                        ...f,
                        complaints: f.complaints.filter((c) => c.id !== cid),
                      }))
                );
                onComplaintAdded();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryList({
  loading,
  flights,
  onLikeToggled,
  onDeleted,
}: {
  loading: boolean;
  flights: HistoryFlight[] | null;
  onLikeToggled: (complaintId: string, liked: boolean) => void;
  onDeleted: (complaintId: string) => void;
}) {
  if (loading || flights === null) {
    return (
      <div className="py-8 text-center font-mono text-xs uppercase tracking-wider text-gray-500">
        Lade...
      </div>
    );
  }
  if (flights.length === 0) {
    return (
      <div className="py-8 text-center font-mono text-xs uppercase tracking-wider text-gray-500">
        Noch keine Flights
      </div>
    );
  }
  const fmt = new Intl.DateTimeFormat("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <ul className="space-y-3">
      {flights.map((f) => {
        const started = new Date(f.startedAt);
        const ended = f.endedAt ? new Date(f.endedAt) : null;
        const durationMin = ended
          ? Math.max(1, Math.round((ended.getTime() - started.getTime()) / 60000))
          : null;
        return (
          <li
            key={f.id}
            className="rounded-lg border border-gray-800 bg-black/40 p-3"
          >
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-sm font-semibold text-white">
                {f.startedBy.name}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-gray-500">
                {fmt.format(started)}
              </div>
            </div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-gray-600">
              {ended ? `${durationMin} min` : "Aktiv"}
              {f.complaints.length > 0 &&
                ` · ${f.complaints.length} Beschwerde${
                  f.complaints.length === 1 ? "" : "n"
                }`}
            </div>
            {f.complaints.length > 0 && (
              <ul className="mt-2 space-y-1.5 border-t border-gray-800 pt-2">
                {f.complaints.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-start justify-between gap-2 text-xs"
                  >
                    <div className="flex-1">
                      <span className="font-semibold tracking-wider text-gray-200">
                        {c.author.name.toUpperCase()}
                      </span>{" "}
                      <span className="text-gray-400">sagt: {c.text}</span>
                    </div>
                    <LikeButton
                      complaintId={c.id}
                      count={c.likeCount}
                      liked={c.likedByMe}
                      onToggled={onLikeToggled}
                    />
                    {c.isMine && (
                      <DeleteButton
                        complaintId={c.id}
                        onDeleted={onDeleted}
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function LikeButton({
  complaintId,
  count,
  liked,
  onToggled,
}: {
  complaintId: string;
  count: number;
  liked: boolean;
  onToggled: (complaintId: string, liked: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  async function toggle() {
    if (busy) return;
    setBusy(true);
    onToggled(complaintId, !liked);
    try {
      const res = await fetch(`/api/drohne/complaint/${complaintId}/like`, {
        method: "POST",
      });
      if (!res.ok) onToggled(complaintId, liked);
    } catch {
      onToggled(complaintId, liked);
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      title={liked ? "Anschluss zurueckziehen" : "Beschwerde anschliessen"}
      className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] transition-colors ${
        liked
          ? "border-accent bg-accent/10 text-accent"
          : "border-gray-700 bg-black/40 text-gray-400 hover:border-gray-500 hover:text-gray-200"
      }`}
    >
      <span>👍</span>
      <span>{count}</span>
    </button>
  );
}

function DeleteButton({
  complaintId,
  onDeleted,
}: {
  complaintId: string;
  onDeleted: (complaintId: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  async function del() {
    if (busy) return;
    if (!confirm("Eigene Beschwerde wirklich loeschen?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/drohne/complaint/${complaintId}`, {
        method: "DELETE",
      });
      if (res.ok) onDeleted(complaintId);
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      type="button"
      onClick={del}
      disabled={busy}
      aria-label="Beschwerde loeschen"
      title="Eigene Beschwerde loeschen"
      className="flex shrink-0 items-center rounded-full border border-gray-700 bg-black/40 px-2 py-0.5 text-[11px] text-gray-400 hover:border-red-500 hover:text-red-400 disabled:opacity-40"
    >
      🗑
    </button>
  );
}

function DroneSvg() {
  return (
    <svg
      viewBox="0 0 64 64"
      width="48"
      height="48"
      className="drone-svg block"
    >
      <rect x="26" y="26" width="12" height="12" rx="3" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="2" fill="#f87171" className="drone-led" />
      <line x1="32" y1="32" x2="10" y2="10" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="32" x2="54" y2="10" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="32" x2="10" y2="54" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="32" x2="54" y2="54" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="10" cy="10" r="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
      <circle cx="54" cy="10" r="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
      <circle cx="10" cy="54" r="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
      <circle cx="54" cy="54" r="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
      <g className="drone-rotor" style={{ transformOrigin: "10px 10px" }}>
        <ellipse cx="10" cy="10" rx="9" ry="1.5" fill="rgba(148,163,184,0.35)" />
      </g>
      <g className="drone-rotor" style={{ transformOrigin: "54px 10px" }}>
        <ellipse cx="54" cy="10" rx="9" ry="1.5" fill="rgba(148,163,184,0.35)" />
      </g>
      <g className="drone-rotor" style={{ transformOrigin: "10px 54px" }}>
        <ellipse cx="10" cy="54" rx="9" ry="1.5" fill="rgba(148,163,184,0.35)" />
      </g>
      <g className="drone-rotor" style={{ transformOrigin: "54px 54px" }}>
        <ellipse cx="54" cy="54" rx="9" ry="1.5" fill="rgba(148,163,184,0.35)" />
      </g>
    </svg>
  );
}

