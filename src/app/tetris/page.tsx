"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const COLS = 10;
const ROWS = 20;
const CELL = 28;
const COLORS = [
  "#b8f068", // I — accent green
  "#ff6b2b", // O — secondary orange
  "#a78bfa", // T — violet
  "#60a5fa", // J — blue
  "#f472b6", // S — pink
  "#fbbf24", // Z — amber
  "#f87171", // L — red
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

function clearRows(grid: Grid): { grid: Grid; cleared: number } {
  const remaining = grid.filter((row) => row.some((c) => c === 0));
  const cleared = ROWS - remaining.length;
  const empty = Array.from({ length: cleared }, () =>
    Array(COLS).fill(0) as number[]
  );
  return { grid: [...empty, ...remaining], cleared };
}

function scoreForLines(lines: number, level: number): number {
  const base = [0, 100, 300, 500, 800];
  return (base[lines] ?? 800) * (level + 1);
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
  });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const rafRef = useRef<number>(0);

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

  const drop = useCallback(() => {
    const g = gameRef.current;
    if (g.gameOver || g.paused) return;
    if (!collides(g.grid, g.piece, g.px, g.py + 1)) {
      g.py++;
    } else {
      g.grid = merge(g.grid, g.piece, g.px, g.py, g.colorIdx);
      const { grid, cleared } = clearRows(g.grid);
      g.grid = grid;
      if (cleared > 0) {
        g.lines += cleared;
        g.score += scoreForLines(cleared, g.level);
        g.level = Math.floor(g.lines / 10);
        setScore(g.score);
      }
      spawnPiece();
    }
  }, [spawnPiece]);

  const move = useCallback(
    (dx: number) => {
      const g = gameRef.current;
      if (g.gameOver || g.paused) return;
      if (!collides(g.grid, g.piece, g.px + dx, g.py)) {
        g.px += dx;
      }
    },
    []
  );

  const rotatePiece = useCallback(() => {
    const g = gameRef.current;
    if (g.gameOver || g.paused) return;
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
    if (g.gameOver || g.paused) return;
    while (!collides(g.grid, g.piece, g.px, g.py + 1)) {
      g.py++;
      g.score += 2;
    }
    setScore(g.score);
    drop();
  }, [drop]);

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
    setScore(0);
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

      // Grid
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const val = g.grid[r]![c]!;
          if (val) {
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

      // Current piece
      if (!g.gameOver) {
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

      if (!g.gameOver && !g.paused) {
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
      if (e.key === "ArrowLeft") move(-1);
      else if (e.key === "ArrowRight") move(1);
      else if (e.key === "ArrowUp") rotatePiece();
      else if (e.key === "ArrowDown") drop();
      else if (e.key === " ") hardDrop();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, rotatePiece, drop, hardDrop]);

  // Touch
  const touchRef = useRef<{ x: number; y: number; time: number } | null>(
    null
  );
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    if (t) touchRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  }
  function onTouchEnd(e: React.TouchEvent) {
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
    setScore(0);
    setGameOver(false);
    setSubmitted(false);
    setIsNewRecord(false);
    spawnPiece();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-6">
      {/* Header */}
      <div className="mb-3 flex w-full max-w-[280px] items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-white"
        >
          ← Zurück
        </button>
        <div className="text-right">
          <p className="font-mono text-2xl font-bold text-accent">{score}</p>
          <p className="font-mono text-[9px] uppercase tracking-wider text-gray-500">
            Level {gameRef.current.level}
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
          className="block"
        />

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/85 backdrop-blur-sm">
            <p className="mb-1 font-cinzel text-2xl text-accent">
              Game Over
            </p>
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
                {isNewRecord ? "✓ Neuer Rekord gespeichert!" : "✓ Gespeichert"}
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
      <div className="mt-4 flex gap-3">
        <button
          onClick={() => move(-1)}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-700 bg-gray-900/60 text-lg text-white active:bg-accent/20"
        >
          ◀
        </button>
        <button
          onClick={() => drop()}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-700 bg-gray-900/60 text-lg text-white active:bg-accent/20"
        >
          ▼
        </button>
        <button
          onClick={rotatePiece}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-700 bg-gray-900/60 text-lg text-white active:bg-accent/20"
        >
          ↻
        </button>
        <button
          onClick={() => move(1)}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-700 bg-gray-900/60 text-lg text-white active:bg-accent/20"
        >
          ▶
        </button>
        <button
          onClick={hardDrop}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-accent/50 bg-accent/10 text-lg text-accent active:bg-accent/30"
        >
          ⏬
        </button>
      </div>

      <p className="mt-3 text-center text-[10px] text-gray-600">
        Swipe links/rechts · Swipe runter = Drop · Tap = Drehen
      </p>
    </div>
  );
}
