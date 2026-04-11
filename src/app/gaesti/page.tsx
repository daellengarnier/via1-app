"use client";

import { useState } from "react";

interface Booking {
  id: string;
  guest: string;
  invitedBy: string;
  from: string;
  to: string;
}

const mockBookings: Booking[] = [
  {
    id: "1",
    guest: "Anna Müller",
    invitedBy: "Alain",
    from: "2026-04-21",
    to: "2026-04-23",
  },
  {
    id: "2",
    guest: "Peter Schmidt",
    invitedBy: "Sophie",
    from: "2026-04-28",
    to: "2026-04-30",
  },
  {
    id: "3",
    guest: "Familie Meier",
    invitedBy: "Felix",
    from: "2026-05-10",
    to: "2026-05-15",
  },
];

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
  const [bookings, setBookings] = useState(mockBookings);
  const [showCreate, setShowCreate] = useState(false);
  const [newGuest, setNewGuest] = useState("");
  const [newFrom, setNewFrom] = useState("");
  const [newTo, setNewTo] = useState("");

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const today = now.toISOString().split("T")[0]!;

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

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newGuest || !newFrom || !newTo) return;

    // Prüfen auf Doppelbuchung
    const conflict = bookings.find(
      (b) =>
        (newFrom >= b.from && newFrom <= b.to) ||
        (newTo >= b.from && newTo <= b.to) ||
        (newFrom <= b.from && newTo >= b.to)
    );
    if (conflict) {
      alert(`Konflikt: ${conflict.guest} hat in diesem Zeitraum gebucht.`);
      return;
    }

    setBookings((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        guest: newGuest,
        invitedBy: "Alain",
        from: newFrom,
        to: newTo,
      },
    ]);
    setShowCreate(false);
    setNewGuest("");
    setNewFrom("");
    setNewTo("");
  }

  return (
    <div className="p-4 pb-20">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-accent">Gästi</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-full bg-accent px-4 py-1.5 font-mono text-xs font-bold text-dark"
        >
          + Buchen
        </button>
      </div>
      <p className="mb-4 text-sm text-gray-500">Gästewohnwagen-Buchungen</p>

      {/* Buchungs-Formular */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-4 rounded-lg border border-accent/30 bg-accent/5 p-4"
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
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
              required
            />
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Von</label>
              <input
                type="date"
                value={newFrom}
                onChange={(e) => setNewFrom(e.target.value)}
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Bis</label>
              <input
                type="date"
                value={newTo}
                onChange={(e) => setNewTo(e.target.value)}
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-accent px-4 py-2 font-mono text-xs font-bold text-dark"
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
      <div className="mb-4 rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-4">
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
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const booking = getBookingForDate(dateStr);
            const isToday = dateStr === today;

            return (
              <div
                key={day}
                className={`relative flex h-9 items-center justify-center rounded text-xs ${
                  booking
                    ? "bg-secondary/30 text-secondary"
                    : isToday
                      ? "border border-accent text-accent"
                      : "text-gray-400"
                }`}
                title={booking ? `${booking.guest} (${booking.invitedBy})` : "Frei"}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Buchungsliste */}
      <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-accent">
        Kommende Buchungen
      </h2>
      <div className="space-y-2">
        {bookings
          .filter((b) => b.to >= today)
          .sort((a, b) => a.from.localeCompare(b.from))
          .map((b) => (
            <div
              key={b.id}
              className="rounded-lg border border-gray-800 bg-gray-900/40 p-3"
            >
              <div className="flex items-center justify-between">
                <div>
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
            </div>
          ))}

        {bookings.filter((b) => b.to >= today).length === 0 && (
          <p className="text-center text-sm text-gray-600">
            Keine kommenden Buchungen
          </p>
        )}
      </div>
    </div>
  );
}
