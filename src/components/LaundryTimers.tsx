"use client";

import { useEffect, useState } from "react";
import { LAUNDRY_MACHINES, LAUNDRY_PROGRAMS } from "@/lib/laundry";

interface LaundryTimer {
  id: string;
  programName: string;
  durationMinutes: number;
  startedAt: string;
  endsAt: string;
  starterId: string;
  starterName: string;
  isStartedByCurrentUser: boolean;
  watchingDone: boolean;
}

interface LaundryMachineState {
  key: string;
  name: string;
  timer: LaundryTimer | null;
}

const defaultProgram =
  LAUNDRY_PROGRAMS.find((program) => program.name === "Koch & Buntwaesche") ??
  LAUNDRY_PROGRAMS[0];
const storageKey = "via1-laundry-demo";

function emptyMachines(): LaundryMachineState[] {
  return LAUNDRY_MACHINES.map((machine) => ({
    key: machine.key,
    name: machine.name,
    timer: null,
  }));
}

function loadDemoMachines(now = Date.now()): LaundryMachineState[] {
  if (typeof window === "undefined") return emptyMachines();
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return emptyMachines();
    const parsed = JSON.parse(raw) as LaundryMachineState[];
    return emptyMachines().map((machine) => {
      const saved = parsed.find((m) => m.key === machine.key);
      const timer = saved?.timer ?? null;
      if (!timer || new Date(timer.endsAt).getTime() <= now) {
        return machine;
      }
      return { ...machine, timer };
    });
  } catch {
    return emptyMachines();
  }
}

function saveDemoMachines(machines: LaundryMachineState[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(machines));
}

function formatRemaining(ms: number) {
  if (ms <= 0) return "fertig";
  const totalMinutes = Math.ceil(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}`;
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}

function progress(timer: LaundryTimer | null, now: number) {
  if (!timer) return 0;
  const started = new Date(timer.startedAt).getTime();
  const ends = new Date(timer.endsAt).getTime();
  const span = Math.max(1, ends - started);
  return Math.max(0, Math.min(1, (now - started) / span));
}

const digitSegments: Record<string, string[]> = {
  "0": ["a", "b", "c", "d", "e", "f"],
  "1": ["b", "c"],
  "2": ["a", "b", "g", "e", "d"],
  "3": ["a", "b", "c", "d", "g"],
  "4": ["f", "g", "b", "c"],
  "5": ["a", "f", "g", "c", "d"],
  "6": ["a", "f", "e", "d", "c", "g"],
  "7": ["a", "b", "c"],
  "8": ["a", "b", "c", "d", "e", "f", "g"],
  "9": ["a", "b", "c", "d", "f", "g"],
};

function SevenSegmentDigit({ char }: { char: string }) {
  if (char === ":") {
    return (
      <span className="relative inline-block h-[13px] w-[3px]">
        <span className="absolute left-1 top-[3px] h-0.5 w-0.5 rounded-full bg-white" />
        <span className="absolute left-1 top-[9px] h-0.5 w-0.5 rounded-full bg-white" />
      </span>
    );
  }
  if (char === "-") {
    return (
      <span className="relative inline-block h-[13px] w-[7px]">
        <span className="absolute left-[1px] top-[6px] h-[1.5px] w-[5px] bg-white/35" />
      </span>
    );
  }

  const on = new Set(digitSegments[char] ?? []);
  const segmentClass = (segment: string) =>
    on.has(segment) ? "bg-white shadow-[0_0_4px_rgba(255,255,255,0.45)]" : "bg-white/10";

  return (
    <span className="relative inline-block h-[13px] w-[8px]">
      <span className={`absolute left-[1.5px] top-0 h-[1.5px] w-[5px] rounded-[1px] ${segmentClass("a")}`} />
      <span className={`absolute right-0 top-[1.5px] h-[4.7px] w-[1.5px] rounded-[1px] ${segmentClass("b")}`} />
      <span className={`absolute bottom-[1.5px] right-0 h-[4.7px] w-[1.5px] rounded-[1px] ${segmentClass("c")}`} />
      <span className={`absolute bottom-0 left-[1.5px] h-[1.5px] w-[5px] rounded-[1px] ${segmentClass("d")}`} />
      <span className={`absolute bottom-[1.5px] left-0 h-[4.7px] w-[1.5px] rounded-[1px] ${segmentClass("e")}`} />
      <span className={`absolute left-0 top-[1.5px] h-[4.7px] w-[1.5px] rounded-[1px] ${segmentClass("f")}`} />
      <span className={`absolute left-[1.5px] top-[5.75px] h-[1.5px] w-[5px] rounded-[1px] ${segmentClass("g")}`} />
    </span>
  );
}

function SevenSegmentDisplay({ value }: { value: string }) {
  return (
    <div className="absolute left-[29px] top-[8px] flex h-[15px] w-[36px] items-center justify-center gap-[1px] overflow-hidden px-0.5">
      {value.split("").map((char, index) => (
        <SevenSegmentDigit key={`${char}-${index}`} char={char} />
      ))}
    </div>
  );
}

function WashingMachineIcon({
  active,
  remaining,
  progressValue,
  spinFast,
  animationKey,
}: {
  active: boolean;
  remaining: string;
  progressValue: number;
  spinFast: boolean;
  animationKey: string;
}) {
  const dash = 100 - Math.round(progressValue * 100);
  const stroke = active ? "rgba(103,232,249,0.95)" : "rgba(92,176,153,0.9)";
  const washFill = active ? "rgba(84,170,190,0.78)" : "rgba(84,165,183,0.42)";
  const spinDuration = "0.62s";
  const washItems = [
    { r: 4.1, fill: washFill, dur: "7.4s", x: 22, y: 65, drop: 0.28, land: 0.47, path: "M24 66 C18 63 16 58 18 54 Q30 58 42 66 C36 69 29 69 24 66" },
    { r: 3.3, fill: "rgba(103,232,249,0.7)", dur: "7.8s", x: 28, y: 67, drop: 0.34, land: 0.54, path: "M27 67 C19 63 17 54 21 48 Q33 55 47 66 C40 70 32 70 27 67" },
    { r: 3.8, fill: "rgba(84,170,190,0.68)", dur: "7.1s", x: 34, y: 66, drop: 0.41, land: 0.62, path: "M31 67 C21 63 19 50 25 43 Q38 53 52 66 C45 70 36 70 31 67" },
    { r: 2.9, fill: "rgba(190,242,255,0.52)", dur: "8s", x: 40, y: 67, drop: 0.25, land: 0.44, path: "M38 67 C28 67 18 61 18 56 Q30 59 44 64 C45 68 41 69 38 67" },
    { r: 4.3, fill: "rgba(84,170,190,0.62)", dur: "7.5s", x: 47, y: 64, drop: 0.5, land: 0.7, path: "M44 65 C31 67 18 58 20 48 C22 40 28 36 34 36 Q46 51 56 65 C53 68 48 68 44 65" },
    { r: 3.1, fill: "rgba(103,232,249,0.58)", dur: "8.2s", x: 51, y: 60, drop: 0.3, land: 0.5, path: "M49 63 C38 69 23 65 19 57 Q33 58 50 64 C54 66 53 65 49 63" },
    { r: 3.4, fill: "rgba(130,214,224,0.62)", dur: "7.7s", x: 24, y: 61, drop: 0.45, land: 0.65, path: "M23 63 C17 59 18 49 23 43 C27 38 31 36 34 37 Q45 52 51 65 C43 70 30 68 23 63" },
    { r: 2.8, fill: "rgba(218,250,255,0.45)", dur: "8.4s", x: 31, y: 62, drop: 0.36, land: 0.56, path: "M30 65 C22 64 18 56 20 50 Q33 55 49 64 C45 69 36 69 30 65" },
    { r: 3.7, fill: "rgba(75,151,170,0.7)", dur: "7.3s", x: 38, y: 63, drop: 0.55, land: 0.74, path: "M36 66 C25 67 17 59 18 51 C19 43 26 37 34 36 Q48 52 55 65 C48 69 40 69 36 66" },
    { r: 2.5, fill: "rgba(255,255,255,0.38)", dur: "8.6s", x: 45, y: 60, drop: 0.32, land: 0.52, path: "M43 64 C33 69 21 64 18 55 Q32 58 52 63 C52 66 46 67 43 64" },
  ];
  return (
    <div
      className={`relative h-[86px] w-[73px] transition-opacity ${
        active ? "opacity-100" : "opacity-80"
      }`}
    >
      <svg
        key={animationKey}
        viewBox="0 0 72 88"
        className="h-full w-full drop-shadow-[0_0_12px_rgba(34,211,238,0.18)]"
      >
        <defs>
          <clipPath id="laundry-drum-clip">
            <circle cx="36" cy="56" r="19.5" />
          </clipPath>
        </defs>
        <rect
          x="5"
          y="4"
          width="62"
          height="80"
          rx="5"
          fill="rgba(235,246,242,0.05)"
          stroke={stroke}
          strokeWidth="1.1"
        />
        <path d="M5 27h62" stroke={stroke} strokeWidth="1.1" />
        <path d="M27 4v23" stroke={stroke} strokeWidth="1.1" />
        <rect
          x="10"
          y="11"
          width="13.5"
          height="9"
          rx="1"
          fill="rgba(0,0,0,0.2)"
          stroke={stroke}
          strokeWidth="0.95"
        />
        <rect
          x="13"
          y="14"
          width="7.5"
          height="2"
          rx="0.8"
          fill={stroke}
          opacity="0.9"
        />
        <rect
          x="28"
          y="8"
          width="37"
          height="16"
          rx="1.5"
          fill={active ? "rgba(16,37,43,0.92)" : "rgba(0,0,0,0.38)"}
        />
        <rect
          x="12"
          y="34"
          width="48"
          height="38"
          rx="2"
          fill="rgba(255,255,255,0.025)"
          opacity="0.55"
        />
        <circle
          cx="36"
          cy="56"
          r="21.5"
          fill="rgba(0,0,0,0.22)"
          stroke={stroke}
          strokeWidth="1.15"
        />
        <circle
          cx="36"
          cy="56"
          r="18.6"
          fill="rgba(0,0,0,0.24)"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="0.75"
        />
        <g clipPath="url(#laundry-drum-clip)">
          {spinFast ? (
            <g>
              <g>
                {active && (
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 36 56"
                    to="360 36 56"
                    dur={spinDuration}
                    repeatCount="indefinite"
                  />
                )}
                {washItems.map((item, index) => {
                  const angle = (index / washItems.length) * Math.PI * 2;
                  const x = 36 + Math.cos(angle) * 15.8;
                  const y = 56 + Math.sin(angle) * 15.8;
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r={item.r}
                      fill={item.fill}
                      opacity="0.94"
                    />
                  );
                })}
              </g>
              <circle
                cx="36"
                cy="56"
                r="11.5"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="0.75"
              />
            </g>
          ) : (
            <g>
              <path
                d={
                  active
                    ? "M17 74 C24 75 34 75 43 74 C49 73 53 71 55 69 L55 76 L17 76 Z"
                    : "M17 61 C23 66 33 67 42 66 C49 64 53 60 55 55 L55 76 L17 76 Z"
                }
                fill="rgba(84,205,235,0.52)"
                opacity="1"
              >
                {active && (
                  <>
                    <animate
                      attributeName="d"
                      dur="2s"
                      values="
                        M17 76 C24 77 34 77 43 76 C49 76 53 75 55 74 L55 76 L17 76 Z;
                        M17 75 C24 76 34 76 43 75 C49 74 53 73 55 70 L55 76 L17 76 Z;
                        M17 69 C24 71 34 71 43 70 C49 69 53 66 55 63 L55 76 L17 76 Z;
                        M17 61 C23 66 33 67 42 66 C49 64 53 60 55 55 L55 76 L17 76 Z"
                      fill="freeze"
                    />
                  </>
                )}
              </path>
              {washItems.map((item, index) => (
                <circle
                  key={index}
                  cx={active ? 0 : item.x}
                  cy={active ? 0 : item.y}
                  r={item.r}
                  fill={item.fill}
                  opacity="0.96"
                >
                  {active && (
                    <animateMotion
                      path={item.path}
                      dur={item.dur}
                      begin={`${2.35 + index * 0.18}s`}
                      calcMode="spline"
                      keyTimes={`0;${item.drop};${item.land};1`}
                      keyPoints={`0;${item.drop};${item.land};1`}
                      keySplines="0.65 0 0.88 1;0.02 0 0.12 1;0.28 0 0.64 1"
                      repeatCount="indefinite"
                    />
                  )}
                </circle>
              ))}
            </g>
          )}
        </g>
        <path
          d="M25 40 C31 36 42 36 48 41"
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeLinecap="round"
          strokeWidth="1"
        />
        <circle
          cx="36"
          cy="56"
          r="21.5"
          fill="none"
          stroke={active ? "rgba(103,232,249,0.95)" : "rgba(255,255,255,0.16)"}
          strokeDasharray="135"
          strokeDashoffset={Math.round((dash / 100) * 135)}
          strokeLinecap="round"
          strokeWidth="0.95"
        />
      </svg>
      {/* Schallwellen — halbrunde Bögen links & rechts */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 72 88"
      >
        {(active
          ? [
              { delay: "0s", dur: "1.6s" },
              { delay: "0.4s", dur: "1.6s" },
              { delay: "0.8s", dur: "1.6s" },
              { delay: "1.2s", dur: "1.6s" },
            ]
          : [
              { delay: "0s", dur: "4s" },
              { delay: "2s", dur: "4s" },
            ]
        ).map((w, i) => (
          <g key={i}>
            {/* Linker Bogen */}
            <path fill="none" stroke={active ? "rgba(184,240,104,0.8)" : "rgba(184,240,104,0.12)"} strokeWidth={active ? "1.3" : "0.7"} strokeLinecap="round">
              <animate attributeName="d" values="M10 44 Q6 50 10 56;M-4 32 Q-14 50 -4 68" dur={w.dur} begin={w.delay} repeatCount="indefinite" />
              <animate attributeName="opacity" values={active ? "0.8;0" : "0.12;0"} dur={w.dur} begin={w.delay} repeatCount="indefinite" />
            </path>
            {/* Rechter Bogen */}
            <path fill="none" stroke={active ? "rgba(184,240,104,0.8)" : "rgba(184,240,104,0.12)"} strokeWidth={active ? "1.3" : "0.7"} strokeLinecap="round">
              <animate attributeName="d" values="M62 44 Q66 50 62 56;M76 32 Q86 50 76 68" dur={w.dur} begin={w.delay} repeatCount="indefinite" />
              <animate attributeName="opacity" values={active ? "0.8;0" : "0.12;0"} dur={w.dur} begin={w.delay} repeatCount="indefinite" />
            </path>
          </g>
        ))}
      </svg>
      <SevenSegmentDisplay value={active ? remaining : "--"} />
    </div>
  );
}

export function LaundryTimers() {
  const [machines, setMachines] = useState<LaundryMachineState[]>(
    emptyMachines
  );
  const [selected, setSelected] = useState<LaundryMachineState | null>(null);
  const [now, setNow] = useState(Date.now());
  const [programName, setProgramName] = useState<string>(defaultProgram.name);
  const [minutes, setMinutes] = useState<number>(defaultProgram.minutes);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/laundry");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { machines: LaundryMachineState[] };
      setMachines(data.machines);
      setSelected((prev) =>
        prev ? data.machines.find((m) => m.key === prev.key) ?? prev : prev
      );
    } catch {
      const data = loadDemoMachines();
      setMachines(data);
      setSelected((prev) =>
        prev ? data.find((m) => m.key === prev.key) ?? prev : prev
      );
    }
  }

  useEffect(() => {
    load();
    const poll = window.setInterval(load, 30_000);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearInterval(poll);
      window.clearInterval(tick);
    };
  }, []);

  function openMachine(machine: LaundryMachineState) {
    if (selected?.key === machine.key) {
      setSelected(null);
      return;
    }
    setSelected(machine);
    const program =
      LAUNDRY_PROGRAMS.find((p) => p.name === machine.timer?.programName) ??
      defaultProgram;
    setProgramName(machine.timer?.programName ?? program.name);
    setMinutes(machine.timer?.durationMinutes ?? program.minutes);
  }

  async function startTimer() {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch("/api/laundry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machineKey: selected.key,
          programName,
          durationMinutes: minutes,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { machines: LaundryMachineState[] };
      setMachines(data.machines);
      setSelected(null);
    } catch {
      const startedAt = new Date();
      const endsAt = new Date(startedAt.getTime() + minutes * 60_000);
      const data = machines.map((machine) =>
        machine.key === selected.key
          ? {
              ...machine,
              timer: {
                id: `demo-${selected.key}-${startedAt.getTime()}`,
                programName,
                durationMinutes: minutes,
                startedAt: startedAt.toISOString(),
                endsAt: endsAt.toISOString(),
                starterId: "demo",
                starterName: "Demo",
                isStartedByCurrentUser: true,
                watchingDone: false,
              },
            }
          : machine
      );
      setMachines(data);
      saveDemoMachines(data);
      setSelected(null);
    } finally {
      setBusy(false);
    }
  }

  async function toggleWatchDone() {
    if (!selected?.timer) return;
    const watchingDone = !selected.timer.watchingDone;
    setBusy(true);
    try {
      const res = await fetch("/api/laundry", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ machineKey: selected.key, watchingDone }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { machines: LaundryMachineState[] };
      setMachines(data.machines);
      setSelected(data.machines.find((m) => m.key === selected.key) ?? null);
    } catch {
      const data = machines.map((machine) =>
        machine.key === selected.key && machine.timer
          ? {
              ...machine,
              timer: { ...machine.timer, watchingDone },
            }
          : machine
      );
      setMachines(data);
      saveDemoMachines(data);
      setSelected(data.find((m) => m.key === selected.key) ?? selected);
    } finally {
      setBusy(false);
    }
  }

  async function stopTimer() {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch("/api/laundry", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ machineKey: selected.key }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { machines: LaundryMachineState[] };
      setMachines(data.machines);
      setSelected(null);
    } catch {
      const data = machines.map((machine) =>
        machine.key === selected.key ? { ...machine, timer: null } : machine
      );
      setMachines(data);
      saveDemoMachines(data);
      setSelected(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="pointer-events-none absolute left-0 right-0 top-14 z-10 flex scale-[0.8] items-start justify-between px-1 sm:px-12">
        {machines.map((machine) => {
          const active = Boolean(machine.timer);
          const remaining = machine.timer
            ? formatRemaining(new Date(machine.timer.endsAt).getTime() - now)
            : "frei";
          return (
            <button
              key={machine.key}
              type="button"
              onClick={() => openMachine(machine)}
              className="pointer-events-auto rounded-[22px] p-1 transition-transform active:scale-95"
              aria-label={machine.name}
            >
              <WashingMachineIcon
                active={active}
                remaining={remaining}
                progressValue={progress(machine.timer, now)}
                spinFast={
                  active &&
                  new Date(machine.timer!.endsAt).getTime() - now <= 5 * 60_000
                }
                animationKey={machine.timer?.id ?? `${machine.key}-idle`}
              />
            </button>
          );
        })}
      </div>

      {selected && (
        <div
          className={`absolute top-36 z-50 w-[calc(100vw-1.5rem)] max-w-[19rem] rounded-xl border border-cyan-300/25 bg-slate-950/95 p-3 shadow-[0_0_32px_rgba(34,211,238,0.18)] backdrop-blur ${
            selected.key === "left" ? "left-3" : "right-3"
          }`}
        >
          {selected.timer ? (
            <div className="space-y-2">
              <div className="rounded-lg bg-white/[0.04] px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/70">
                  Gestartet von
                </div>
                <div className="truncate text-sm font-semibold text-white">
                  {selected.timer.starterName}
                </div>
              </div>
              {selected.timer.isStartedByCurrentUser ? (
                <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-50">
                  Du wirst benachrichtigt, wenn sie fertig ist.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={toggleWatchDone}
                  disabled={busy}
                  className={`flex h-9 w-full items-center justify-between rounded-lg border px-3 text-xs font-semibold transition-colors disabled:opacity-60 ${
                    selected.timer.watchingDone
                      ? "border-cyan-300/35 bg-cyan-300/12 text-cyan-50"
                      : "border-white/10 bg-white/5 text-gray-400"
                  }`}
                >
                  <span>Benachrichtigen wenn frei</span>
                  <span
                    className={`h-3.5 w-3.5 rounded-full border ${
                      selected.timer.watchingDone
                        ? "border-cyan-200 bg-cyan-300"
                        : "border-white/25"
                    }`}
                  />
                </button>
              )}
              <button
                type="button"
                onClick={stopTimer}
                disabled={busy}
                className="h-9 w-full rounded-lg border border-red-400/25 bg-red-500/15 px-3 text-xs font-bold text-red-100 disabled:opacity-60"
              >
                Stop
              </button>
            </div>
          ) : (
            <>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {LAUNDRY_PROGRAMS.map((program) => {
                  const isSelected = programName === program.name;
                  return (
                    <button
                      key={program.name}
                      type="button"
                      onClick={() => {
                        setProgramName(program.name);
                        setMinutes(program.minutes);
                      }}
                      className={`rounded-full border px-2 py-1 text-[10px] font-semibold leading-none transition-colors ${
                        isSelected
                          ? "border-cyan-200 bg-cyan-300 text-slate-950"
                          : "border-white/10 bg-white/5 text-gray-300"
                      }`}
                    >
                      {program.name} {program.minutes}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setProgramName("Manuell")}
                  className={`rounded-full border px-2 py-1 text-[10px] font-semibold leading-none transition-colors ${
                    programName === "Manuell"
                      ? "border-cyan-200 bg-cyan-300 text-slate-950"
                      : "border-white/10 bg-white/5 text-gray-300"
                  }`}
                >
                  Manuell
                </button>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  type="number"
                  min={1}
                  max={360}
                  value={minutes}
                  onChange={(e) => {
                    setProgramName("Manuell");
                    setMinutes(Number(e.target.value));
                  }}
                  className="h-9 min-w-0 rounded-lg border border-gray-800 bg-black/40 px-3 font-mono text-sm text-white outline-none focus:border-cyan-300/50"
                  aria-label="Minuten"
                />
              <button
                type="button"
                onClick={startTimer}
                disabled={busy}
                className="h-9 rounded-lg bg-cyan-300 px-3 text-xs font-bold text-slate-950 disabled:opacity-60"
              >
                Start
              </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
