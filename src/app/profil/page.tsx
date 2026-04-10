"use client";

const wgs = [
  { name: "Nordwind", floor: "EG Nord" },
  { name: "Ostblock", floor: "EG Ost" },
  { name: "Dreiecksbar", floor: "1. OG Nord" },
  { name: "Kleenex", floor: "1. OG Ost" },
  { name: "Family-WG", floor: "2. OG Nord" },
  { name: "Bonzen", floor: "2. OG Ost" },
];

export default function ProfilPage() {
  return (
    <div className="p-4 pb-20">
      <h1 className="mb-6 font-mono text-2xl font-bold text-accent">
        Profil
      </h1>

      {/* User Info */}
      <div className="mb-6 rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 font-mono text-xl font-bold text-accent">
            Y
          </div>
          <div>
            <p className="text-lg font-medium text-white">Yves</p>
            <p className="text-sm text-gray-400">yves@via1.ch</p>
            <p className="font-mono text-xs text-accent">Admin</p>
          </div>
        </div>
      </div>

      {/* WGs Uebersicht */}
      <h2 className="mb-3 font-mono text-sm font-bold uppercase tracking-wider text-accent">
        Wohngemeinschaften
      </h2>
      <div className="space-y-2">
        {wgs.map((wg) => (
          <div
            key={wg.name}
            className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/40 p-3"
          >
            <span className="font-medium text-white">{wg.name}</span>
            <span className="text-sm text-gray-500">{wg.floor}</span>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button className="mt-8 w-full rounded-lg border border-gray-700 py-2 font-mono text-sm text-gray-400 transition-colors hover:border-red-500 hover:text-red-400">
        Abmelden
      </button>
    </div>
  );
}
