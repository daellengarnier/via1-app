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

const COLORS = [
  "#b8f068", "#ff6b2b", "#a78bfa", "#60a5fa",
  "#f472b6", "#fbbf24", "#f87171",
];

const PIECES = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[0, 1, 0], [1, 1, 1]],
  [[1, 0], [1, 0], [1, 1]],
  [[0, 1], [1, 1], [1, 0]],
  [[1, 0], [1, 1], [0, 1]],
  [[0, 1], [0, 1], [1, 1]],
];

type Grid = number[][];
function createGrid(): Grid {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0) as number[]);
}
function rotate(p: number[][]): number[][] {
  const r: number[][] = [];
  for (let c = 0; c < p[0]!.length; c++) {
    const row: number[] = [];
    for (let ri = p.length - 1; ri >= 0; ri--) row.push(p[ri]![c]!);
    r.push(row);
  }
  return r;
}
function collides(g: Grid, p: number[][], px: number, py: number): boolean {
  for (let r = 0; r < p.length; r++)
    for (let c = 0; c < p[r]!.length; c++) {
      if (!p[r]![c]) continue;
      const nx = px + c, ny = py + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && g[ny]![nx]) return true;
    }
  return false;
}
function merge(g: Grid, p: number[][], px: number, py: number, ci: number): Grid {
  const ng = g.map((r) => [...r]);
  for (let r = 0; r < p.length; r++)
    for (let c = 0; c < p[r]!.length; c++) {
      if (!p[r]![c]) continue;
      const ny = py + r, nx = px + c;
      if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) ng[ny]![nx] = ci + 1;
    }
  return ng;
}
function scoreForLines(n: number, lvl: number): number {
  return ([0, 40, 100, 150, 200][n] ?? 200) * (lvl + 1);
}

// Korobeiniki (Tetris Theme) — Noten als [freq, duration]
const MELODY: [number, number][] = [
  [659, 0.4], [494, 0.2], [523, 0.2], [587, 0.4], [523, 0.2], [494, 0.2],
  [440, 0.4], [440, 0.2], [523, 0.2], [659, 0.4], [587, 0.2], [523, 0.2],
  [494, 0.4], [494, 0.2], [523, 0.2], [587, 0.4], [659, 0.4],
  [523, 0.4], [440, 0.4], [440, 0.4], [0, 0.2],
  [587, 0.4], [698, 0.2], [880, 0.4], [784, 0.2], [698, 0.2],
  [659, 0.4], [523, 0.2], [659, 0.4], [587, 0.2], [523, 0.2],
  [494, 0.4], [494, 0.2], [523, 0.2], [587, 0.4], [659, 0.4],
  [523, 0.4], [440, 0.4], [440, 0.4], [0, 0.4],
];

function useTetrisMusic() {
  const ctxRef = useRef<AudioContext | null>(null);
  const playingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    playingRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
  }, []);

  const start = useCallback(() => {
    if (playingRef.current) return;
    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      playingRef.current = true;
      let noteIdx = 0;

      function playNext() {
        if (!playingRef.current || !ctxRef.current) return;
        const [freq, dur] = MELODY[noteIdx % MELODY.length]!;
        if (freq > 0) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.value = freq;
          gain.gain.value = 0.06;
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + dur * 0.9
          );
          osc.connect(gain).connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + dur);
        }
        noteIdx++;
        timeoutRef.current = setTimeout(playNext, dur * 1000);
      }
      playNext();
    } catch {
      // Audio not supported
    }
  }, []);

  useEffect(() => stop, [stop]);
  return { start, stop, playing: playingRef };
}

export default function TetrisPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cellSize, setCellSize] = useState(28);
  const gameRef = useRef({
    grid: createGrid(),
    piece: PIECES[0]!,
    colorIdx: 0,
    px: 3, py: -2,
    score: 0, lines: 0, level: 0,
    gameOver: false, paused: false,
    dropTimer: 0, lastTime: 0,
    flashRows: [] as number[],
    flashTimer: 0,
  });
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLB, setShowLB] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const music = useTetrisMusic();
  const rafRef = useRef<number>(0);

  // Responsive cell size
  useEffect(() => {
    function calc() {
      const h = window.innerHeight;
      const avail = h - 160;
      setCellSize(Math.max(16, Math.min(32, Math.floor(avail / ROWS))));
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const loadLB = useCallback(() => {
    fetch("/api/game/highscore")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { leaderboard?: LeaderboardEntry[] } | null) => {
        if (d?.leaderboard) setLeaderboard(d.leaderboard);
      })
      .catch(() => {});
  }, []);
  useEffect(() => { loadLB(); }, [loadLB]);

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
      // Auto-save score
      if (g.score > 0) {
        fetch("/api/game/highscore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: g.score }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((d: { isNewRecord?: boolean } | null) => {
            if (d?.isNewRecord) setIsNewRecord(true);
            loadLB();
          })
          .catch(() => {});
      }
    }
  }, [loadLB]);

  const lockPiece = useCallback(() => {
    const g = gameRef.current;
    g.grid = merge(g.grid, g.piece, g.px, g.py, g.colorIdx);
    const full: number[] = [];
    for (let r = 0; r < ROWS; r++)
      if (g.grid[r]!.every((c) => c !== 0)) full.push(r);
    if (full.length > 0) {
      g.flashRows = full;
      g.flashTimer = 400;
      g.score += scoreForLines(full.length, g.level);
      g.lines += full.length;
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
    if (!collides(g.grid, g.piece, g.px, g.py + 1)) g.py++;
    else lockPiece();
  }, [lockPiece]);

  const move = useCallback((dx: number) => {
    const g = gameRef.current;
    if (g.gameOver || g.paused || g.flashRows.length > 0) return;
    if (!collides(g.grid, g.piece, g.px + dx, g.py)) g.px += dx;
  }, []);

  const rotatePiece = useCallback(() => {
    const g = gameRef.current;
    if (g.gameOver || g.paused || g.flashRows.length > 0) return;
    const rot = rotate(g.piece);
    if (!collides(g.grid, rot, g.px, g.py)) g.piece = rot;
    else if (!collides(g.grid, rot, g.px - 1, g.py)) { g.piece = rot; g.px--; }
    else if (!collides(g.grid, rot, g.px + 1, g.py)) { g.piece = rot; g.px++; }
  }, []);

  const hardDrop = useCallback(() => {
    const g = gameRef.current;
    if (g.gameOver || g.paused || g.flashRows.length > 0) return;
    while (!collides(g.grid, g.piece, g.px, g.py + 1)) { g.py++; g.score += 1; }
    setScore(g.score);
    lockPiece();
  }, [lockPiece]);

  function toggleMusic() {
    if (musicOn) { music.stop(); setMusicOn(false); }
    else { music.start(); setMusicOn(true); }
  }

  // Game loop
  useEffect(() => {
    const g = gameRef.current;
    g.grid = createGrid(); g.score = 0; g.lines = 0; g.level = 0;
    g.gameOver = false; g.paused = false; g.lastTime = 0; g.dropTimer = 0;
    g.flashRows = []; g.flashTimer = 0;
    setScore(0); setLevel(0); setGameOver(false); setIsNewRecord(false);
    spawnPiece();

    function loop(time: number) {
      const cs = cellSize;
      if (!g.lastTime) g.lastTime = time;
      const dt = time - g.lastTime; g.lastTime = time;

      if (g.flashRows.length > 0) {
        g.flashTimer -= dt;
        if (g.flashTimer <= 0) {
          const rem = g.grid.filter((_, i) => !g.flashRows.includes(i));
          const emp = Array.from({ length: g.flashRows.length }, () => Array(COLS).fill(0) as number[]);
          g.grid = [...emp, ...rem]; g.flashRows = []; g.flashTimer = 0;
          spawnPiece();
        }
      } else if (!g.gameOver && !g.paused) {
        g.dropTimer += dt;
        const speed = Math.max(80, 800 - g.level * 80);
        if (g.dropTimer >= speed) { g.dropTimer = 0; drop(); }
      }

      // Draw
      const canvas = canvasRef.current;
      if (!canvas) { rafRef.current = requestAnimationFrame(loop); return; }
      const ctx = canvas.getContext("2d");
      if (!ctx) { rafRef.current = requestAnimationFrame(loop); return; }
      canvas.width = COLS * cs; canvas.height = ROWS * cs;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isFlashing = g.flashRows.length > 0;
      const flashOn = isFlashing && Math.floor(g.flashTimer / 80) % 2 === 0;

      for (let r = 0; r < ROWS; r++) {
        const isFR = g.flashRows.includes(r);
        for (let c = 0; c < COLS; c++) {
          const v = g.grid[r]![c]!;
          if (isFR && isFlashing) {
            ctx.fillStyle = flashOn ? "rgba(255,255,255,0.9)" : "rgba(184,240,104,0.6)";
            ctx.shadowColor = flashOn ? "#fff" : "#b8f068"; ctx.shadowBlur = flashOn ? 16 : 8;
            ctx.fillRect(c * cs + 1, r * cs + 1, cs - 2, cs - 2); ctx.shadowBlur = 0;
          } else if (v) {
            const col = COLORS[v - 1] ?? "#fff";
            ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 6;
            ctx.fillRect(c * cs + 1, r * cs + 1, cs - 2, cs - 2); ctx.shadowBlur = 0;
          } else {
            ctx.fillStyle = "rgba(255,255,255,0.03)";
            ctx.fillRect(c * cs + 1, r * cs + 1, cs - 2, cs - 2);
          }
        }
      }
      if (!g.gameOver && !isFlashing) {
        const col = COLORS[g.colorIdx] ?? "#fff";
        ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 10;
        for (let r = 0; r < g.piece.length; r++)
          for (let c = 0; c < g.piece[r]!.length; c++) {
            if (!g.piece[r]![c]) continue;
            const x = (g.px + c) * cs, y = (g.py + r) * cs;
            if (y >= 0) ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
          }
        ctx.shadowBlur = 0;
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [drop, spawnPiece, cellSize]);

  // Keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault();
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
  const touchRef = useRef<{ x: number; y: number; t: number } | null>(null);
  function onTS(e: React.TouchEvent) {
    e.preventDefault();
    const t = e.touches[0];
    if (t) touchRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  }
  function onTE(e: React.TouchEvent) {
    e.preventDefault();
    if (!touchRef.current) return;
    const t = e.changedTouches[0]; if (!t) return;
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    const dt = Date.now() - touchRef.current.t;
    touchRef.current = null;
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15 && dt < 300) rotatePiece();
    else if (Math.abs(dy) > Math.abs(dx) && dy > 30) hardDrop();
    else if (Math.abs(dx) > 20) move(dx > 0 ? 1 : -1);
  }

  function restart() {
    const g = gameRef.current;
    g.grid = createGrid(); g.score = 0; g.lines = 0; g.level = 0;
    g.gameOver = false; g.paused = false; g.lastTime = 0; g.dropTimer = 0;
    g.flashRows = []; g.flashTimer = 0;
    setScore(0); setLevel(0); setGameOver(false); setIsNewRecord(false);
    spawnPiece();
  }

  useEffect(() => {
    const prevent = (e: TouchEvent) => e.preventDefault();
    document.body.style.overflow = "hidden";
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => { document.body.style.overflow = ""; document.removeEventListener("touchmove", prevent); };
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center bg-black" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      {/* Header */}
      <div className="flex w-full max-w-[320px] items-center justify-between px-2 py-2">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-white">
          ←
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMusic}
            className={`rounded px-2 py-0.5 text-[10px] transition-colors ${musicOn ? "bg-accent/20 text-accent" : "text-gray-600 hover:text-gray-400"}`}
          >
            {musicOn ? "♫ ON" : "♫ OFF"}
          </button>
          <button
            onClick={() => setShowLB(true)}
            className="rounded px-2 py-0.5 text-[10px] text-amber-300/80 hover:text-amber-200"
          >
            🏆
          </button>
        </div>
        <div className="text-right">
          <p className="font-mono text-xl font-bold text-accent">{score}</p>
          <p className="font-mono text-[9px] text-gray-500">Lv.{level}</p>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="relative flex-shrink-0 rounded-lg border border-gray-800 bg-black/80"
        onTouchStart={onTS}
        onTouchEnd={onTE}
        style={{ padding: 2 }}
      >
        <canvas ref={canvasRef} className="block touch-none" style={{ width: COLS * cellSize, height: ROWS * cellSize }} />

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-black/85 backdrop-blur-sm">
            <p className="mb-1 font-cinzel text-xl text-accent">Game Over</p>
            <p className="mb-1 font-mono text-3xl font-bold text-white">{score}</p>
            {isNewRecord && (
              <p className="mb-2 font-display text-[11px] font-bold uppercase tracking-widest text-amber-300">
                🏆 Neuer Highscore!
              </p>
            )}
            <p className="mb-3 text-[10px] text-accent/80">Score automatisch gespeichert</p>
            <button onClick={restart} className="rounded-full bg-accent px-6 py-2 font-display text-[11px] font-bold uppercase tracking-wider text-dark">
              Nochmal
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-2 flex gap-2">
        <button onClick={() => move(-1)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-900/60 text-base text-white active:bg-accent/20">◀</button>
        <button onClick={() => drop()} className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-900/60 text-base text-white active:bg-accent/20">▼</button>
        <button onClick={rotatePiece} className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-900/60 text-base text-white active:bg-accent/20">↻</button>
        <button onClick={() => move(1)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-900/60 text-base text-white active:bg-accent/20">▶</button>
        <button onClick={hardDrop} className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent/50 bg-accent/10 text-base text-accent active:bg-accent/30">⏬</button>
      </div>

      <p className="mt-1 text-[9px] text-gray-700">Swipe · Tap = Drehen · ⏬ = Drop</p>

      {/* Leaderboard Modal */}
      {showLB && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowLB(false)}>
          <div className="mx-4 w-full max-w-xs rounded-2xl border border-gray-800 bg-dark p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-[10px] font-bold uppercase tracking-widest text-amber-300">🏆 RANGLISTE</p>
              <button onClick={() => setShowLB(false)} className="text-gray-500 hover:text-white">×</button>
            </div>
            {leaderboard.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-600">Noch keine Scores</p>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto">
                {leaderboard.map((e, i) => (
                  <div key={`${e.name}-${i}`} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${e.isMe ? "bg-accent/10 ring-1 ring-accent/30" : i % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
                    <span className={`w-5 shrink-0 text-right font-mono text-[11px] font-bold ${i === 0 ? "text-amber-300" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-gray-600"}`}>
                      {i + 1}.
                    </span>
                    <span className={`min-w-0 flex-1 truncate text-xs ${e.isMe ? "font-semibold text-accent" : "text-gray-300"}`}>
                      {e.name}{e.isMe && <span className="ml-1 text-[9px] text-accent/70">(du)</span>}
                    </span>
                    <span className={`shrink-0 font-mono text-xs font-bold ${i === 0 ? "text-amber-300" : "text-gray-400"}`}>
                      {e.score.toLocaleString("de-CH")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
