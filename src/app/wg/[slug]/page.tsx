"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

interface Room {
  keyNumber: string;
  number: number;
  resident: string | null;
}

interface Issue {
  id: string;
  title: string;
  room: string | null;
  status: "offen" | "in_arbeit" | "erledigt";
  date: string;
}

interface WgDetail {
  name: string;
  floor: string;
  side: "nord" | "ost";
  rooms: Room[];
  issues: Issue[];
}

const wgData: Record<string, WgDetail> = {
  nordwind: {
    name: "Nordwind",
    floor: "EG",
    side: "nord",
    rooms: [
      { keyNumber: "N01", number: 1, resident: "Marco" },
      { keyNumber: "N02", number: 2, resident: "Lena" },
      { keyNumber: "N03", number: 3, resident: "Sven" },
      { keyNumber: "N04", number: 4, resident: null },
      { keyNumber: "N05", number: 5, resident: "Mia" },
    ],
    issues: [
      {
        id: "1",
        title: "Fenster klemmt",
        room: "N03",
        status: "offen",
        date: "2026-04-08",
      },
    ],
  },
  ostblock: {
    name: "Ostblock",
    floor: "EG",
    side: "ost",
    rooms: [
      { keyNumber: "O01", number: 1, resident: "Jana" },
      { keyNumber: "O02", number: 2, resident: "Tim" },
      { keyNumber: "O03", number: 3, resident: "Nora" },
      { keyNumber: "O04", number: 4, resident: "Fabio" },
      { keyNumber: "O05", number: 5, resident: "Lea" },
    ],
    issues: [],
  },
  dreiecksbar: {
    name: "Dreiecksbar",
    floor: "1. OG",
    side: "nord",
    rooms: [
      { keyNumber: "N11", number: 1, resident: "Alain" },
      { keyNumber: "N12", number: 2, resident: "Sophie" },
      { keyNumber: "N13", number: 3, resident: "Dario" },
      { keyNumber: "N14", number: 4, resident: "Yves" },
      { keyNumber: "N15", number: 5, resident: "Lia" },
    ],
    issues: [
      {
        id: "2",
        title: "Wasserhahn tropft",
        room: "N11",
        status: "offen",
        date: "2026-04-09",
      },
      {
        id: "3",
        title: "Licht im Gang flackert",
        room: null,
        status: "in_arbeit",
        date: "2026-04-05",
      },
    ],
  },
  kleenex: {
    name: "Kleenex",
    floor: "1. OG",
    side: "ost",
    rooms: [
      { keyNumber: "O11", number: 1, resident: "Nina" },
      { keyNumber: "O12", number: 2, resident: "Jan" },
      { keyNumber: "O13", number: 3, resident: "Anna" },
      { keyNumber: "O14", number: 4, resident: "Lars" },
      { keyNumber: "O15", number: 5, resident: "Vera" },
    ],
    issues: [],
  },
  "family-wg": {
    name: "Family-WG",
    floor: "2. OG",
    side: "nord",
    rooms: [
      { keyNumber: "N21", number: 1, resident: "Thomas & Sarah" },
      { keyNumber: "N22", number: 2, resident: "Kinder" },
      { keyNumber: "N23", number: 3, resident: "Ruth" },
      { keyNumber: "N24", number: 4, resident: "Beat" },
      { keyNumber: "N25", number: 5, resident: "Maja" },
    ],
    issues: [],
  },
  bonzen: {
    name: "Bonzennest",
    floor: "2. OG",
    side: "ost",
    rooms: [
      { keyNumber: "O21", number: 1, resident: "Felix" },
      { keyNumber: "O22", number: 2, resident: "Claudia" },
      { keyNumber: "O23", number: 3, resident: "Martin" },
      { keyNumber: "O24", number: 4, resident: null },
    ],
    issues: [
      {
        id: "4",
        title: "Heizung macht Geräusche",
        room: "O22",
        status: "offen",
        date: "2026-04-10",
      },
    ],
  },
};

const statusLabels: Record<string, string> = {
  offen: "Offen",
  in_arbeit: "In Arbeit",
  erledigt: "Erledigt",
};

const statusColors: Record<string, string> = {
  offen: "text-secondary",
  in_arbeit: "text-yellow-400",
  erledigt: "text-accent",
};

export default function WgPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const wg = wgData[slug];
  const [showNewIssue, setShowNewIssue] = useState(false);
  const [issues, setIssues] = useState(wg?.issues ?? []);
  const [newTitle, setNewTitle] = useState("");
  const [newRoom, setNewRoom] = useState("");

  if (!wg) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-gray-400">WG nicht gefunden.</p>
      </div>
    );
  }

  const isNord = wg.side === "nord";
  const accentColor = isNord ? "text-accent" : "text-secondary";
  const borderColor = isNord ? "border-accent" : "border-secondary";
  const bgAccent = isNord ? "bg-accent" : "bg-secondary";

  function handleSubmitIssue(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIssues((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        title: newTitle,
        room: newRoom || null,
        status: "offen" as const,
        date: new Date().toISOString().split("T")[0]!,
      },
    ]);
    setNewTitle("");
    setNewRoom("");
    setShowNewIssue(false);
  }

  return (
    <div className="p-4 pb-20">
      {/* Header */}
      <button
        onClick={() => router.push("/")}
        className="mb-4 ml-14 text-sm text-gray-500 hover:text-white"
      >
        ← Stockwerkplan
      </button>

      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${accentColor}`}>
          {wg.name}
        </h1>
        <p className="text-sm text-gray-400">
          {wg.floor} {wg.side === "nord" ? "Nord" : "Ost"}
        </p>
      </div>

      {/* Zimmer */}
      <h2 className={`mb-3 font-mono text-sm font-bold uppercase tracking-wider ${accentColor}`}>
        Zimmer
      </h2>
      <div className="mb-6 space-y-2">
        {wg.rooms.map((room) => {
          const roomIssues = issues.filter((i) => i.room === room.keyNumber);
          return (
            <div
              key={room.keyNumber}
              className={`flex items-center justify-between rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-3`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`font-mono text-sm font-bold ${accentColor}`}
                >
                  {room.keyNumber}
                </span>
                <span className="text-sm text-white">
                  {room.resident ?? (
                    <span className="text-gray-600">leer</span>
                  )}
                </span>
              </div>
              {roomIssues.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white">
                  {roomIssues.length}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Meldungen / Issues */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className={`font-mono text-sm font-bold uppercase tracking-wider ${accentColor}`}>
          Meldungen
        </h2>
        <button
          onClick={() => setShowNewIssue(!showNewIssue)}
          className={`rounded-full px-3 py-1 font-mono text-xs font-bold text-dark ${bgAccent}`}
        >
          + Neue Meldung
        </button>
      </div>

      {/* Neues Issue Form */}
      {showNewIssue && (
        <form
          onSubmit={handleSubmitIssue}
          className={`mb-4 rounded-lg border ${borderColor} bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-4`}
        >
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">
              Beschreibung
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Was ist das Problem?"
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
              required
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">
              Zimmer (optional)
            </label>
            <select
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
            >
              <option value="">Allgemein (ganze WG)</option>
              {wg.rooms.map((r) => (
                <option key={r.keyNumber} value={r.keyNumber}>
                  {r.keyNumber} — Zi. {r.number}
                  {r.resident ? ` (${r.resident})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className={`rounded px-4 py-2 font-mono text-xs font-bold text-dark ${bgAccent}`}
            >
              Melden
            </button>
            <button
              type="button"
              onClick={() => setShowNewIssue(false)}
              className="rounded px-4 py-2 text-xs text-gray-400 hover:text-white"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Issue-Liste */}
      {issues.length === 0 ? (
        <p className="rounded-lg border border-gray-800 bg-gray-900/40 p-4 text-center text-sm text-gray-600">
          Keine offenen Meldungen
        </p>
      ) : (
        <div className="space-y-2">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    {issue.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    {issue.room && (
                      <span className={`font-mono ${accentColor}`}>
                        {issue.room}
                      </span>
                    )}
                    <span>{issue.date}</span>
                  </div>
                </div>
                <span
                  className={`font-mono text-xs ${statusColors[issue.status]}`}
                >
                  {statusLabels[issue.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
