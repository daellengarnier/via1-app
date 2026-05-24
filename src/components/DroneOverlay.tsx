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
              <div className="drone-bubble-author">{currentComplaint.author.name}</div>
              <div className="drone-bubble-text">{currentComplaint.text}</div>
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
          onComplaintAdded={() => {
            onComplaintAdded();
            setModalOpen(false);
          }}
          onStopRequested={() => {
            setModalOpen(false);
            onStopped();
          }}
        />
      )}
    </>
  );
}

function ComplaintModal({
  flight,
  onClose,
  onComplaintAdded,
  onStopRequested,
}: {
  flight: DroneFlightInfo;
  onClose: () => void;
  onComplaintAdded: () => void;
  onStopRequested: () => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submit() {
    const v = text.trim();
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
      onComplaintAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setSending(false);
    }
  }

  async function stopFlight() {
    setSending(true);
    try {
      const res = await fetch("/api/drohne/stop", { method: "POST" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Stop fehlgeschlagen");
      }
      onStopRequested();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <span>🚁</span>
          <span>Drohne erwischt!</span>
        </div>

        <div className="mb-4 rounded-lg bg-slate-800/60 p-3 text-sm">
          <div className="text-slate-400">Gestartet von</div>
          <div className="text-base font-semibold">{flight.startedBy.name}</div>
        </div>

        <label className="mb-1 block text-sm text-slate-300">
          Beschwerde / Kommentar
        </label>
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={200}
          placeholder="Geht das nicht etwas ruhiger?"
          className="mb-2 h-24 w-full resize-none rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
        />
        <div className="mb-3 text-right text-xs text-slate-500">{text.length}/200</div>

        {error && (
          <div className="mb-3 rounded-lg bg-red-900/40 p-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={sending || !text.trim()}
            className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50"
          >
            {sending ? "..." : "Beschwerde senden"}
          </button>
        </div>

        {flight.isMine && (
          <button
            type="button"
            onClick={stopFlight}
            disabled={sending}
            className="mt-3 w-full rounded-lg border border-red-700 px-3 py-2 text-sm text-red-300 hover:bg-red-900/30 disabled:opacity-50"
          >
            Drohne landen
          </button>
        )}
      </div>
    </div>
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

