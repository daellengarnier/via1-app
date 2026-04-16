"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface LeaderboardEntry {
  name: string;
  score: number;
  isMe: boolean;
}

const COLS = 10;
const ROWS = 20;
const CELL = 28;
const COLORS = [
  "#b8f068",
  "#ff6b2b",
  "#a78bfa",
  "#60a5fa",
  "#f472b6",
  "#fbbf24",
  "#f87171",
];

const PIECES = [
  [[1, 1, 1, 1]],
  [
    [1, 1],
    [1, 1],
  ],
  [
    [0, 1, 0],
    [1, 1, 1],
  ],
  [
    [1, 0],
    [1, 0],
    [1, 1],
  ],
  [
    [0, 1],
    [1, 1],
    [1, 0],
  ],
  [
    [1, 0],
    [1, 1],
    [0, 1],
  ],
  [
    [0, 1],
    [0, 1],
    [1, 1],
  ],
];

type Grid = number[][];

function createGrid(): Grid {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0) as number[]);
}

function rotate(piece: number[][]): number[][] {
  const rows = piece.length;
  const cols = piece[0]!.length;
  const rotated: number[][] = [];
  for (let c = 0; c < cols; c++) {
    const row: number[] = [];
    for (let r = rows - 1; r >= 0; r--) {
      row.push(piece[r]![c]!);
    }
    rotated.push(row);
  }
  return rotated;
}

function collides(
  grid: Grid,
  piece: number[][],
  px: number,
  py: number
): boolean {
  for (let r = 0; r < piece.length; r++) {
    for (let c = 0; c < piece[r]!.length; c++) {
      if (!piece[r]![c]) continue;
      const nx = px + c;
      const ny = py + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && grid[ny]![nx]) return true;
    }
  }
  return false;
}

function merge(
  grid: Grid,
  piece: number[][],
  px: number,
  py: number,
  colorIdx: number
): Grid {
  const g = grid.map((row) => [...row]);
  for (let r = 0; r < piece.length; r++) {
    for (let c = 0; c < piece[r]!.length; c++) {
      if (!piece[r]![c]) continue;
      const ny = py + r;
      const nx = px + c;
      if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
        g[ny]![nx] = colorIdx + 1;
      }
    }
  }
  return g;
}

function scoreForLines(lines: number, level: number): number {
  const base = [0, 40, 100, 150, 200];
  return (base[lines] ?? 200) * (level + 1);
}

export default function TetrisPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef({
    grid: createGrid(),
    piece: PIECES[0]!,
    colorIdx: 0,
    px: 3,
    py: -2,
    score: 0,
    lines: 0,
    level: 0,
    gameOver: false,
    paused: false,
    dropTimer: 0,
    lastTime: 0,
    // Reihen-Flash: welche Reihen gerade aufloesen
    flashRows: [] as number[],
    flashTimer: 0,
  });
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const rafRef = useRef<number>(0);

  const loadLeaderboard = useCallback(() => {
    fetch("/api/game/highscore")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { leaderboard?: LeaderboardEntry[] } | null) => {
        if (data?.leaderboard) setLeaderboard(data.leaderboard);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const spawnPiece = useCallback(() => {
    const g = gameRef.current;
    const idx = Math.floor(Math.random() * PIECES.length);
    g.piece = PIECES[idx]!;
    g.colorIdx = idx;
    g.px = Math.floor((COLS - g.piece[0]!.length) / 2);
    g.py = -g.piece.length;
    if (collides(g.grid, g.piece, g.px, g.py + 1) && g.py >= -1) {
      g.gameOver = true;
      setGameOver(true);
    }
  }, []);

  const lockPiece = useCallback(() => {
    const g = gameRef.current;
    g.grid = merge(g.grid, g.piece, g.px, g.py, g.colorIdx);

    // Volle Reihen finden
    const fullRows: number[] = [];
    for (let r = 0; r < ROWS; r++) {
      if (g.grid[r]!.every((c) => c !== 0)) fullRows.push(r);
    }

    if (fullRows.length > 0) {
      // Flash starten (Reihen blinken bevor sie verschwinden)
      g.flashRows = fullRows;
      g.flashTimer = 400; // ms
      g.score += scoreForLines(fullRows.length, g.level);
      g.lines += fullRows.length;
      g.level = Math.floor(g.lines / 10);
      setScore(g.score);
      setLevel(g.level);
    } else {
      spawnPiece();
    }
  }, [spawnPiece]);

  const drop = useCallback(() => {
    const g = gameRef.current;
    if (g.gameOver || g.paused || g.flashRows.length > 0) return;
    if (!collides(g.grid, g.piece, g.px, g.py + 1)) {
      g.py++;
    } else {
      lockPiece();
    }
  }, [lockPiece]);

  const move = useCallback((dx: number) => {
    const g = gameRef.current;
    if (g.gameOver || g.paused || g.flashRows.length > 0) return;
    if (!collides(g.grid, g.piece, g.px + dx, g.py)) {
      g.px += dx;
    }
  }, []);

  const rotatePiece = useCallback(() => {
    const g = gameRef.current;
    if (g.gameOver || g.paused || g.flashRows.length > 0) return;
    const rotated = rotate(g.piece);
    if (!collides(g.grid, rotated, g.px, g.py)) {
      g.piece = rotated;
    } else if (!collides(g.grid, rotated, g.px - 1, g.py)) {
      g.piece = rotated;
      g.px--;
    } else if (!collides(g.grid, rotated, g.px + 1, g.py)) {
      g.piece = rotated;
      g.px++;
    }
  }, []);

  const hardDrop = useCallback(() => {
    const g = gameRef.current;
    if (g.gameOver || g.paused || g.flashRows.length > 0) return;
    while (!collides(g.grid, g.piece, g.px, g.py + 1)) {
      g.py++;
      g.score += 1;
    }
    setScore(g.score);
    lockPiece();
  }, [lockPiece]);

  // Game loop
  useEffect(() => {
    const g = gameRef.current;
    g.grid = createGrid();
    g.score = 0;
    g.lines = 0;
    g.level = 0;
    g.gameOver = false;
    g.paused = false;
    g.lastTime = 0;
    g.dropTimer = 0;
    g.flashRows = [];
    g.flashTimer = 0;
    setScore(0);
    setLevel(0);
    setGameOver(false);
    setSubmitted(false);
    setIsNewRecord(false);
    spawnPiece();

    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = COLS * CELL;
      const h = ROWS * CELL;
      ctx.clearRect(0, 0, w, h);

      const isFlashing = g.flashRows.length > 0;
      const flashOn =
        isFlashing && Math.floor(g.flashTimer / 80) % 2 === 0;

      for (let r = 0; r < ROWS; r++) {
        const isFlashRow = g.flashRows.includes(r);
        for (let c = 0; c < COLS; c++) {
          const val = g.grid[r]![c]!;
          if (isFlashRow && isFlashing) {
            // Blinkender Flash-Effekt
            ctx.fillStyle = flashOn
              ? "rgba(255,255,255,0.9)"
              : "rgba(184,240,104,0.6)";
            ctx.shadowColor = flashOn ? "#fff" : "#b8f068";
            ctx.shadowBlur = flashOn ? 16 : 8;
            ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
            ctx.shadowBlur = 0;
          } else if (val) {
            const color = COLORS[val - 1] ?? "#fff";
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
            ctx.shadowBlur = 0;
          } else {
            ctx.fillStyle = "rgba(255,255,255,0.03)";
            ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
          }
        }
      }

      // Current piece (nur wenn nicht im Flash)
      if (!g.gameOver && !isFlashing) {
        const color = COLORS[g.colorIdx] ?? "#fff";
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        for (let r = 0; r < g.piece.length; r++) {
          for (let c = 0; c < g.piece[r]!.length; c++) {
            if (!g.piece[r]![c]) continue;
            const x = (g.px + c) * CELL;
            const y = (g.py + r) * CELL;
            if (y >= 0) {
              ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
            }
          }
        }
        ctx.shadowBlur = 0;
      }
    }

    function loop(time: number) {
      if (!g.lastTime) g.lastTime = time;
      const dt = time - g.lastTime;
      g.lastTime = time;

      // Flash-Phase (Reihen blinken bevor sie verschwinden)
      if (g.flashRows.length > 0) {
        g.flashTimer -= dt;
        if (g.flashTimer <= 0) {
          // Reihen tatsaechlich entfernen
          const remaining = g.grid.filter(
            (_, i) => !g.flashRows.includes(i)
          );
          const empty = Array.from({ length: g.flashRows.length }, () =>
            Array(COLS).fill(0) as number[]
          );
          g.grid = [...empty, ...remaining];
          g.flashRows = [];
          g.flashTimer = 0;
          spawnPiece();
        }
      } else if (!g.gameOver && !g.paused) {
        g.dropTimer += dt;
        const speed = Math.max(100, 800 - g.level * 70);
        if (g.dropTimer >= speed) {
          g.dropTimer = 0;
          drop();
        }
      }

      draw();
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [drop, spawnPiece]);

  // Keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      e.preventDefault();
      if (e.key === "ArrowLeft") move(-1);
      else if (e.key === "ArrowRight") move(1);
      else if (e.key === "ArrowUp") rotatePiece();
      else if (e.key === "ArrowDown") drop();
      else if (e.key === " ") hardDrop();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, rotatePiece, drop, hardDrop]);

  // Touch — improved for no-scroll
  const touchRef = useRef<{ x: number; y: number; time: number } | null>(
    null
  );
  function onTouchStart(e: React.TouchEvent) {
    e.preventDefault();
    const t = e.touches[0];
    if (t) touchRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  }
  function onTouchEnd(e: React.TouchEvent) {
    e.preventDefault();
    if (!touchRef.current) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    const dt = Date.now() - touchRef.current.time;
    touchRef.current = null;

    if (Math.abs(dx) < 15 && Math.abs(dy) < 15 && dt < 300) {
      rotatePiece();
    } else if (Math.abs(dy) > Math.abs(dx) && dy > 30) {
      hardDrop();
    } else if (Math.abs(dx) > 20) {
      move(dx > 0 ? 1 : -1);
    }
  }

  async function submitScore() {
    if (submitted || score === 0) return;
    setSubmitted(true);
    try {
      const res = await fetch("/api/game/highscore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      });
      if (res.ok) {
        const data = (await res.json()) as { isNewRecord: boolean };
        setIsNewRecord(data.isNewRecord);
        loadLeaderboard();
      }
    } catch {
      // ignore
    }
  }

  function restart() {
    const g = gameRef.current;
    g.grid = createGrid();
    g.score = 0;
    g.lines = 0;
    g.level = 0;
    g.gameOver = false;
    g.paused = false;
    g.lastTime = 0;
    g.dropTimer = 0;
    g.flashRows = [];
    g.flashTimer = 0;
    setScore(0);
    setLevel(0);
    setGameOver(false);
    setSubmitted(false);
    setIsNewRecord(false);
    spawnPiece();
  }

  // Prevent page scroll entirely
  useEffect(() => {
    const prevent = (e: TouchEvent) => e.preventDefault();
    document.body.style.overflow = "hidden";
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("touchmove", prevent);
    };
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black">
      {/* Header */}
      <div className="mb-2 flex w-full max-w-[280px] items-center justify-between px-1">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-white"
        >
          ← Zurück
        </button>
        <div className="text-right">
          <p className="font-mono text-2xl font-bold text-accent">{score}</p>
          <p className="font-mono text-[9px] uppercase tracking-wider text-gray-500">
            Level {level}
          </p>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="relative rounded-xl border border-gray-800 bg-black/80 p-1 shadow-[0_0_30px_rgba(184,240,104,0.15)]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <canvas
          ref={canvasRef}
          width={COLS * CELL}
          height={ROWS * CELL}
          className="block touch-none"
        />

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/85 backdrop-blur-sm">
            <p className="mb-1 font-cinzel text-2xl text-accent">Game Over</p>
            <p className="mb-1 font-mono text-3xl font-bold text-white">
              {score}
            </p>
            {isNewRecord && (
              <p className="mb-3 font-display text-[11px] font-bold uppercase tracking-widest text-amber-300">
                🏆 Neuer Highscore!
              </p>
            )}
            {!submitted && score > 0 && (
              <button
                onClick={submitScore}
                className="mb-2 rounded-full bg-accent px-6 py-2 font-display text-[11px] font-bold uppercase tracking-wider text-dark"
              >
                Score speichern
              </button>
            )}
            {submitted && (
              <p className="mb-2 text-xs text-accent">
                {isNewRecord ? "✓ Neuer Rekord!" : "✓ Gespeichert"}
              </p>
            )}
            <button
              onClick={restart}
              className="rounded-full border border-accent/50 px-6 py-2 font-display text-[11px] font-bold uppercase tracking-wider text-accent"
            >
              Nochmal
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => move(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-700 bg-gray-900/60 text-lg text-white active:bg-accent/20"
        >
          ◀
        </button>
        <button
          onClick={() => drop()}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-700 bg-gray-900/60 text-lg text-white active:bg-accent/20"
        >
          ▼
        </button>
        <button
          onClick={rotatePiece}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-700 bg-gray-900/60 text-lg text-white active:bg-accent/20"
        >
          ↻
        </button>
        <button
          onClick={() => move(1)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-700 bg-gray-900/60 text-lg text-white active:bg-accent/20"
        >
          ▶
        </button>
        <button
          onClick={hardDrop}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-accent/50 bg-accent/10 text-lg text-accent active:bg-accent/30"
        >
          ⏬
        </button>
      </div>

      {/* Rangliste Toggle */}
      <button
        onClick={() => setShowLeaderboard(!showLeaderboard)}
        className="mt-3 font-display text-[10px] font-bold uppercase tracking-wider text-amber-300/80 hover:text-amber-200"
      >
        {showLeaderboard ? "Rangliste ausblenden" : "🏆 Rangliste anzeigen"}
      </button>

      {/* Rangliste (toggle) */}
      {showLeaderboard && leaderboard.length > 0 && (
        <div className="mt-2 w-full max-w-[280px]">
          <div className="max-h-[30vh] overflow-y-auto rounded-xl border border-gray-800 bg-black/60 p-2">
            {leaderboard.map((entry, i) => (
              <div
                key={`${entry.name}-${i}`}
                className={`flex items-center gap-2 rounded-lg px-2 py-1 ${
                  entry.isMe
                    ? "bg-accent/10 ring-1 ring-accent/30"
                    : i % 2 === 0
                      ? "bg-white/[0.02]"
                      : ""
                }`}
              >
                <span
                  className={`w-5 shrink-0 text-right font-mono text-[11px] font-bold ${
                    i === 0
                      ? "text-amber-300"
                      : i === 1
                        ? "text-gray-300"
                        : i === 2
                          ? "text-amber-600"
                          : "text-gray-600"
                  }`}
                >
                  {i + 1}.
                </span>
                <span
                  className={`min-w-0 flex-1 truncate text-xs ${
                    entry.isMe
                      ? "font-semibold text-accent"
                      : "text-gray-300"
                  }`}
                >
                  {entry.name}
                  {entry.isMe && (
                    <span className="ml-1 text-[9px] text-accent/70">
                      (du)
                    </span>
                  )}
                </span>
                <span
                  className={`shrink-0 font-mono text-xs font-bold ${
                    i === 0 ? "text-amber-300" : "text-gray-400"
                  }`}
                >
                  {entry.score.toLocaleString("de-CH")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
