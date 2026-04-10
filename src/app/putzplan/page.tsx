const wgs = [
  "Nordwind",
  "Ostblock",
  "Dreiecksbar",
  "Kleenex",
  "Family-WG",
  "Bonzen",
];

const months = [
  "Januar",
  "Februar",
  "Maerz",
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

function getAssignment(monthIndex: number): string {
  return wgs[monthIndex % wgs.length]!;
}

export default function PutzplanPage() {
  const currentMonth = 3; // April (0-indexed)

  return (
    <div className="p-4 pb-20">
      <h1 className="mb-6 font-mono text-2xl font-bold text-accent">
        Putzplan
      </h1>

      {/* Aktuell */}
      <div className="mb-6 rounded-lg border-2 border-accent bg-accent/10 p-4">
        <p className="font-mono text-xs uppercase tracking-wider text-accent">
          Diesen Monat dran
        </p>
        <p className="mt-1 text-2xl font-bold text-white">
          {getAssignment(currentMonth)}
        </p>
        <p className="mt-1 text-sm text-gray-400">
          Treppenhaus + Waschkueche
        </p>
      </div>

      {/* Rotation */}
      <h2 className="mb-3 font-mono text-sm font-bold uppercase tracking-wider text-accent">
        Jahresuebersicht
      </h2>
      <div className="space-y-2">
        {months.map((month, i) => {
          const isCurrent = i === currentMonth;
          return (
            <div
              key={month}
              className={`flex items-center justify-between rounded-lg border p-3 ${
                isCurrent
                  ? "border-accent bg-accent/5"
                  : "border-gray-800 bg-gray-900/40"
              }`}
            >
              <span
                className={`text-sm ${isCurrent ? "font-bold text-white" : "text-gray-400"}`}
              >
                {month}
              </span>
              <span
                className={`font-mono text-sm ${isCurrent ? "font-bold text-accent" : "text-gray-500"}`}
              >
                {getAssignment(i)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
