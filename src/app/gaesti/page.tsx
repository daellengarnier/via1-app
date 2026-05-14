"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatedBackground } from "@/components/AnimatedBackground";

interface Comment {
  id: string;
  author: string;
  authorId: string;
  text: string;
  date: string;
}

interface Booking {
  id: string;
  guest: string;
  invitedBy: string;
  invitedById: string;
  from: string;
  to: string;
  comments: Comment[];
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

function isDateInRange(date: string, from: string, to: string): boolean {
  return date >= from && date <= to;
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("de-CH", { day: "numeric", month: "short" });
}

const monthNames = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

export default function GaestiPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newGuest, setNewGuest] = useState("");
  const [newFrom, setNewFrom] = useState("");
  const [newTo, setNewTo] = useState("");
  const [showBookings, setShowBookings] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null
  );
  const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const today = now.toISOString().split("T")[0]!;

  const loadBookings = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Booking[];
      setBookings(data);
      setLoadError(null);
    } catch (err) {
      console.error("Bookings laden", err);
      setLoadError("Buchungen konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  function getBookingForDate(dateStr: string): Booking | undefined {
    return bookings.find((b) => isDateInRange(dateStr, b.from, b.to));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newGuest || !newFrom || !newTo) return;
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest: newGuest,
          from: newFrom,
          to: newTo,
        }),
      });
      if (res.status === 409) {
        const data = (await res.json()) as { error: string };
        alert(data.error);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = (await res.json()) as Booking;
      setBookings((prev) => [...prev, created]);
      setShowCreate(false);
      setNewGuest("");
      setNewFrom("");
      setNewTo("");
    } catch (err) {
      console.error("Buchung erstellen", err);
      alert("Konnte Buchung nicht erstellen.");
    }
  }

  async function addComment(bookingId: string) {
    const text = newComment.trim();
    if (!text) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = (await res.json()) as Comment;
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, comments: [...b.comments, created] }
            : b
        )
      );
      setNewComment("");
    } catch (err) {
      console.error("Kommentar", err);
      alert("Kommentar konnte nicht gespeichert werden.");
    }
  }

  async function deleteBooking(bookingId: string) {
    if (!confirm("Diese Buchung wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      setSelectedBookingId(null);
    } catch (err) {
      console.error("Buchung loeschen", err);
      alert("Konnte nicht loeschen.");
    }
  }

  return (
    <div className="relative p-4 pb-20">
      <AnimatedBackground
        icon="/icon-gaesti.webp"
        glowClass="glow-blue"
        showIcon={false}
      />
      <div className="mb-2 flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-gaesti.webp"
          alt=""
          className="tab-btn-icon glow-blue"
          loading="eager"
          fetchPriority="high"
        />
      </div>
      <h1 className="mb-1 text-center font-display font-bold uppercase tracking-wider text-3xl text-blue-300">
        Gästewohnwagen
      </h1>
      <p className="mb-4 text-center text-sm text-blue-300/70">
        Buchungen & Belegung
      </p>
      <div className="mb-4 flex justify-center">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-full bg-blue-500 px-5 py-2 font-display text-[11px] font-bold uppercase tracking-wider text-dark"
        >
          + Neue Buchung
        </button>
      </div>

      {/* Buchungs-Formular */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4"
        >
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">
              Name des Gastes
            </label>
            <input
              type="text"
              value={newGuest}
              onChange={(e) => setNewGuest(e.target.value)}
              placeholder="z.B. Max Muster"
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none"
              required
            />
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <label className="mb-1 block text-xs text-gray-400">Von</label>
              <input
                type="date"
                value={newFrom}
                onChange={(e) => setNewFrom(e.target.value)}
                className="box-border block h-10 w-full min-w-0 appearance-none rounded border border-gray-700 bg-gray-900 px-2 text-xs text-white focus:border-blue-400 focus:outline-none"
                required
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1 block text-xs text-gray-400">Bis</label>
              <input
                type="date"
                value={newTo}
                onChange={(e) => setNewTo(e.target.value)}
                className="box-border block h-10 w-full min-w-0 appearance-none rounded border border-gray-700 bg-gray-900 px-2 text-xs text-white focus:border-blue-400 focus:outline-none"
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-blue-400 px-4 py-2 font-mono text-xs font-bold text-dark"
            >
              Buchen
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded px-4 py-2 text-xs text-gray-400 hover:text-white"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Kalender */}
      <div className="mb-4 rounded-lg border border-gray-800 bg-white/10 p-4">
        {/* Monat Navigation */}
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="text-gray-500 hover:text-white"
          >
            ←
          </button>
          <span className="font-mono text-sm font-bold text-white">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="text-gray-500 hover:text-white"
          >
            →
          </button>
        </div>

        {/* Wochentage */}
        <div className="mb-1 grid grid-cols-7 gap-1">
          {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
            <div
              key={d}
              className="text-center font-mono text-xs text-gray-600"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Tage */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const booking = getBookingForDate(dateStr);
            const isToday = dateStr === today;
            const isSelected =
              dateStr === selectedDate ||
              (booking !== undefined && booking.id === selectedBookingId);

            // Mehrtages-Balken: Rundungen an Buchungs-Start/Ende und
            // an den Wochen-Raendern (Mo/So)
            let isBookingStart = false;
            let isBookingEnd = false;
            if (booking) {
              isBookingStart = dateStr === booking.from;
              isBookingEnd = dateStr === booking.to;
              const dow = new Date(dateStr).getDay(); // 0=So, 1=Mo
              if (dow === 1) isBookingStart = true; // Montag: neuer Start
              if (dow === 0) isBookingEnd = true; // Sonntag: Ende
            }
            const roundLeft = isBookingStart;
            const roundRight = isBookingEnd;

            const bookingBg = isSelected
              ? "bg-secondary/50"
              : "bg-secondary/20 hover:bg-secondary/30";

            return (
              <button
                key={day}
                onClick={() => {
                  if (booking) {
                    // Ganze Buchung anwaehlen
                    if (selectedBookingId === booking.id) {
                      setSelectedBookingId(null);
                      setSelectedDate(null);
                    } else {
                      setSelectedBookingId(booking.id);
                      setSelectedDate(null);
                    }
                  } else {
                    setSelectedBookingId(null);
                    setSelectedDate(isSelected ? null : dateStr);
                  }
                }}
                className={`relative flex h-10 items-center justify-center text-xs transition-colors ${
                  booking
                    ? `${bookingBg} font-semibold text-secondary ${roundLeft ? "rounded-l-full ml-1" : ""} ${roundRight ? "rounded-r-full mr-1" : ""}`
                    : isToday
                      ? "my-0.5 mx-0.5 rounded border border-blue-400 text-blue-300 hover:bg-blue-500/10"
                      : isSelected
                        ? "my-0.5 mx-0.5 rounded bg-blue-500/60 text-white ring-2 ring-blue-400"
                        : "my-0.5 mx-0.5 rounded text-gray-400 hover:bg-white/5"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Info für ausgewählten Tag oder ausgewählte Buchung */}
      {(selectedDate || selectedBookingId) && (() => {
        const booking = selectedBookingId
          ? bookings.find((b) => b.id === selectedBookingId)
          : selectedDate
            ? getBookingForDate(selectedDate)
            : undefined;
        const headerText = selectedBookingId && booking
          ? `${formatDateShort(booking.from)} – ${formatDateShort(booking.to)}`
          : selectedDate
            ? new Date(selectedDate).toLocaleDateString("de-CH", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "";
        return (
          <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display text-[10px] font-bold uppercase tracking-widest text-blue-300">
                {headerText}
              </p>
              <button
                onClick={() => {
                  setSelectedDate(null);
                  setSelectedBookingId(null);
                }}
                className="text-xs text-gray-500 hover:text-white"
              >
                ×
              </button>
            </div>
            {booking ? (
              <div>
                <p className="text-base font-semibold text-white">
                  {booking.guest}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  Eingeladen von{" "}
                  <span className="text-blue-300">{booking.invitedBy}</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {formatDateShort(booking.from)} – {formatDateShort(booking.to)}
                </p>
                <button
                  onClick={() => deleteBooking(booking.id)}
                  className="mt-3 rounded border border-red-500/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10"
                >
                  Buchung löschen
                </button>
              </div>
            ) : (
              <div>
                <p className="text-base font-semibold text-blue-300">Frei</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  An diesem Tag ist der Gästewohnwagen verfügbar.
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Schlüssel-Info */}
      <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
        <p className="text-sm text-yellow-200">
          🔑 Schlüssel mindestens <strong>2 Tage im Voraus</strong> bei Mara &amp; Nando anfragen.
        </p>
        <button
          onClick={() => window.open("sms:?body=Hallo%20Mara%20und%20Nando%2C%20ich%20möchte%20den%20Schlüssel%20für%20den%20Gästewohnwagen%20abholen.", "_blank")}
          className="mt-2 w-full rounded bg-yellow-500/20 py-2 text-xs font-bold text-yellow-200 transition-colors hover:bg-yellow-500/30"
        >
          Nachricht an Mara &amp; Nando senden
        </button>
      </div>

      {/* Buchungsliste (ausklappbar) */}
      <button
        onClick={() => setShowBookings(!showBookings)}
        className="mb-3 flex w-full items-center justify-between"
      >
        <h2 className="font-display text-[10px] font-bold uppercase tracking-widest text-blue-300">
          KOMMENDE BUCHUNGEN
        </h2>
        <span className="text-gray-500">{showBookings ? "▲" : "▼"}</span>
      </button>
      {showBookings && <div className="space-y-2">
        {bookings
          .filter((b) => b.to >= today)
          .sort((a, b) => a.from.localeCompare(b.from))
          .map((b) => {
            const commentsOpen = openCommentsId === b.id;
            return (
              <div
                key={b.id}
                style={{ ["--tile-glow-rgb" as string]: "255, 107, 43" }}
                className="wg-glow-border rounded-lg border border-gray-800 bg-white/10 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{b.guest}</p>
                    <p className="text-xs text-gray-500">
                      Eingeladen von {b.invitedBy}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs text-secondary">
                      {formatDateShort(b.from)}
                    </p>
                    <p className="font-mono text-xs text-gray-500">
                      bis {formatDateShort(b.to)}
                    </p>
                  </div>
                </div>

                {/* Kommentar-Toggle */}
                <button
                  onClick={() =>
                    setOpenCommentsId(commentsOpen ? null : b.id)
                  }
                  className="mt-2 flex items-center gap-1 font-mono text-[10px] text-gray-500 hover:text-blue-300"
                >
                  💬 {b.comments.length}{" "}
                  {commentsOpen ? "ausblenden" : "Kommentare"}
                </button>

                {commentsOpen && (
                  <div className="mt-2 border-t border-gray-800 pt-2">
                    <div className="space-y-1.5">
                      {b.comments.map((c) => (
                        <div
                          key={c.id}
                          className="rounded border-l-2 border-blue-500/40 bg-white/3 py-1 pl-2 pr-2"
                        >
                          <p className="text-xs text-gray-300">{c.text}</p>
                          <p className="mt-0.5 text-[9px] text-gray-600">
                            — {c.author} ·{" "}
                            {new Date(c.date).toLocaleDateString("de-CH", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>
                      ))}
                      {b.comments.length === 0 && (
                        <p className="text-xs text-gray-600">
                          Noch keine Kommentare
                        </p>
                      )}
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        addComment(b.id);
                      }}
                      className="mt-2 flex gap-2"
                    >
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Frage oder Kommentar..."
                        className="flex-1 rounded border border-gray-800 bg-white/5 px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:border-blue-400 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="rounded bg-blue-400 px-3 py-1.5 text-[10px] font-bold text-dark"
                      >
                        OK
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}

        {loading && bookings.length === 0 && (
          <p className="text-center text-sm text-gray-600">Lade …</p>
        )}
        {!loading && loadError && (
          <p className="text-center text-sm text-red-400">{loadError}</p>
        )}
        {!loading &&
          !loadError &&
          bookings.filter((b) => b.to >= today).length === 0 && (
            <p className="text-center text-sm text-gray-600">
              Keine kommenden Buchungen
            </p>
          )}
      </div>}
    </div>
  );
}
