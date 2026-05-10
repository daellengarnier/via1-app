"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface LeaderboardEntry {
  name: string;
  score: number;
  date?: string;
  isMe: boolean;
}

const COLS = 10;
const ROWS = 20;
const COLORS = [
  "#b8f068", "#ff6b2b", "#a78bfa", "#60a5fa",
  "#f472b6", "#fbbf24", "#f87171", "#34d399",
  "#e879f9", "#22d3ee", "#fb923c", "#818cf8",
  "#f43f5e", "#a3e635", "#2dd4bf", "#c084fc",
  "#facc15", "#38bdf8", "#fb7185", "#4ade80",
  "#e11d48", "#7c3aed", "#06b6d4", "#ea580c",
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

// Musik: spielt /game-music.mp3 (oder .ogg/.wav) aus dem public-Ordner
// Falls die Datei nicht existiert, passiert einfach nichts.
function useGameMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const start = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
      return;
    }
    const audio = new Audio("/game-music.m4a");
    audio.loop = true;
    audio.volume = 0.3;
    audioRef.current = audio;
    audio.play().catch(() => {});
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  return { start, stop };
}

// ============== Game Component (re-mountable via key) ==============

function TetrisGame({
  onGameOver,
  cellSize,
}: {
  onGameOver: (score: number) => void;
  cellSize: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cs = cellSize;
  const gameRef = useRef({
    grid: createGrid(),
    piece: PIECES[0]!,
    colorIdx: 0,
    px: 3, py: -2,
    score: 0, lines: 0, level: 0,
    gameOver: false,
    dropTimer: 0, lastTime: 0,
    flashRows: [] as number[],
    flashTimer: 0,
  });
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const rafRef = useRef<number>(0);

  const spawnPiece = useCallback(() => {
    const g = gameRef.current;
    const idx = Math.floor(Math.random() * PIECES.length);
    g.piece = PIECES[idx]!;
    g.colorIdx = Math.floor(Math.random() * COLORS.length);
    g.px = Math.floor((COLS - g.piece[0]!.length) / 2);
    g.py = -g.piece.length;
    if (collides(g.grid, g.piece, g.px, 0)) {
      g.gameOver = true;
      onGameOver(g.score);
    }
  }, [onGameOver]);

  const lockPiece = useCallback(() => {
    const g = gameRef.current;
    g.grid = merge(g.grid, g.piece, g.px, g.py, g.colorIdx);
    const full: number[] = [];
    for (let r = 0; r < ROWS; r++)
      if (g.grid[r]!.every((c) => c !== 0)) full.push(r);
    if (full.length > 0) {
      g.flashRows = full; g.flashTimer = 400;
      g.score += scoreForLines(full.length, g.level);
      g.lines += full.length;
      g.level = Math.floor(g.lines / 10);
      setScore(g.score); setLevel(g.level);
    } else { spawnPiece(); }
  }, [spawnPiece]);

  const drop = useCallback(() => {
    const g = gameRef.current;
    if (g.gameOver || g.flashRows.length > 0) return;
    if (!collides(g.grid, g.piece, g.px, g.py + 1)) g.py++;
    else lockPiece();
  }, [lockPiece]);

  const move = useCallback((dx: number) => {
    const g = gameRef.current;
    if (g.gameOver || g.flashRows.length > 0) return;
    if (!collides(g.grid, g.piece, g.px + dx, g.py)) g.px += dx;
  }, []);

  const rotatePiece = useCallback(() => {
    const g = gameRef.current;
    if (g.gameOver || g.flashRows.length > 0) return;
    const rot = rotate(g.piece);
    if (!collides(g.grid, rot, g.px, g.py)) g.piece = rot;
    else if (!collides(g.grid, rot, g.px - 1, g.py)) { g.piece = rot; g.px--; }
    else if (!collides(g.grid, rot, g.px + 1, g.py)) { g.piece = rot; g.px++; }
  }, []);

  const hardDrop = useCallback(() => {
    const g = gameRef.current;
    if (g.gameOver || g.flashRows.length > 0) return;
    while (!collides(g.grid, g.piece, g.px, g.py + 1)) { g.py++; g.score += 1; }
    setScore(g.score);
    lockPiece();
  }, [lockPiece]);

  useEffect(() => {
    spawnPiece();
    const g = gameRef.current;

    function loop(time: number) {
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
      } else if (!g.gameOver) {
        g.dropTimer += dt;
        // Exponentielle Progression: wird mit jedem Level schneller,
        // aber nie ganz unmoeglich (Floor bei 40ms).
        // Level 0: 800ms, 5: 455ms, 10: 260ms, 15: 149ms, 20: 85ms, 25+: 40ms
        const speed = Math.max(40, Math.round(800 * Math.pow(0.88, g.level)));
        if (g.dropTimer >= speed) { g.dropTimer = 0; drop(); }
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
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
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [drop, spawnPiece, cs]);

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

  const touchRef = useRef<{ x: number; y: number; t: number } | null>(null);

  return (
    <>
      <div className="mb-1 flex w-full items-center justify-end px-1">
        <div className="text-right">
          <p className="font-mono text-xl font-bold text-accent">{score}</p>
          <p className="font-mono text-[9px] text-gray-500">Lv.{level}</p>
        </div>
      </div>
      <div
        className="relative flex-shrink-0 rounded-lg border border-gray-800 bg-black/80"
        style={{ padding: 2 }}
        onTouchStart={(e) => {
          e.preventDefault();
          const t = e.touches[0];
          if (t) touchRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
        }}
        onTouchEnd={(e) => {
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
        }}
      >
        <canvas ref={canvasRef} className="block touch-none" style={{ width: COLS * cs, height: ROWS * cs }} />
      </div>
      <div className="mt-2 flex gap-2">
        <button onClick={() => move(-1)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-900/60 text-base text-white active:bg-accent/20">◀</button>
        <button onClick={() => drop()} className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-900/60 text-base text-white active:bg-accent/20">▼</button>
        <button onClick={rotatePiece} className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-900/60 text-base text-white active:bg-accent/20">↻</button>
        <button onClick={() => move(1)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-900/60 text-base text-white active:bg-accent/20">▶</button>
        <button onClick={hardDrop} className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent/50 bg-accent/10 text-base text-accent active:bg-accent/30">⏬</button>
      </div>
    </>
  );
}

// ============== Main Page ==============

export default function TetrisPage() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [cellSize, setCellSize] = useState(28);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLB, setShowLB] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const music = useGameMusic();

  useEffect(() => {
    function calc() {
      const h = window.innerHeight;
      setCellSize(Math.max(14, Math.min(30, Math.floor((h - 210) / ROWS))));
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const loadLB = useCallback(() => {
    fetch("/api/game/highscore?game=tetris")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { leaderboard?: LeaderboardEntry[] } | null) => {
        if (d?.leaderboard) setLeaderboard(d.leaderboard);
      })
      .catch(() => {});
  }, []);
  useEffect(() => { loadLB(); }, [loadLB]);

  const handleGameOver = useCallback((score: number) => {
    setFinalScore(score);
    if (score > 0) {
      fetch("/api/game/highscore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, game: "tetris" }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { isNewRecord?: boolean } | null) => {
          if (d?.isNewRecord) setIsNewRecord(true);
          loadLB();
        })
        .catch(() => {});
    }
  }, [loadLB]);

  function startGame() {
    setStarted(true);
    setFinalScore(null);
    setIsNewRecord(false);
    setGameKey((k) => k + 1);
  }

  function toggleMusic() {
    if (musicOn) { music.stop(); setMusicOn(false); }
    else { music.start(); setMusicOn(true); }
  }

  useEffect(() => {
    const prevent = (e: TouchEvent) => {
      let el = e.target as HTMLElement | null;
      while (el) {
        const ov = getComputedStyle(el).overflowY;
        if (ov === "auto" || ov === "scroll") return;
        el = el.parentElement;
      }
      e.preventDefault();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => { document.body.style.overflow = ""; document.removeEventListener("touchmove", prevent); };
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center bg-black" style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {/* Header */}
      <div className="flex w-full max-w-[320px] items-center justify-between px-2 py-2">
        <button onClick={() => router.back()} className="w-8 text-sm text-gray-500 hover:text-white">←</button>
        <button onClick={() => setShowLB(true)} className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-amber-300 hover:bg-amber-500/20">
          🏆 Rangliste
        </button>
        <button
          onClick={toggleMusic}
          aria-label={musicOn ? "Musik aus" : "Musik an"}
          className={`relative flex h-8 w-8 items-center justify-center rounded transition-colors ${musicOn ? "bg-accent/20 text-accent" : "animate-pulse text-amber-300"}`}
        >
          <span className="text-[14px] leading-none">♫</span>
          {!musicOn && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-1 right-1 top-1/2 h-[1.5px] -translate-y-1/2 rotate-[-20deg] bg-amber-300"
            />
          )}
        </button>
      </div>

      {/* Start Screen */}
      {!started && (
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="mb-2 font-display font-bold uppercase tracking-wider text-3xl text-accent">Block Puzzle</p>
          <p className="mb-6 text-xs text-gray-500">Swipe · Tap = Drehen · ⏬ = Drop</p>
          <button
            onClick={startGame}
            className="rounded-full bg-accent px-8 py-3 font-display text-sm font-bold uppercase tracking-wider text-dark shadow-[0_0_20px_rgba(184,240,104,0.3)] transition hover:brightness-110"
          >
            ▶ Start
          </button>
        </div>
      )}

      {/* Game */}
      {started && !finalScore && (
        <TetrisGame
          key={gameKey}
          onGameOver={handleGameOver}
          cellSize={cellSize}
        />
      )}

      {/* Game Over Screen */}
      {started && finalScore !== null && (
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="mb-1 font-display font-bold uppercase tracking-wider text-2xl text-accent">Game Over</p>
          <p className="mb-1 font-mono text-4xl font-bold text-white">{finalScore}</p>
          {isNewRecord && (
            <p className="mb-2 font-display text-[11px] font-bold uppercase tracking-widest text-amber-300">
              🏆 Neuer Highscore!
            </p>
          )}
          <p className="mb-4 text-[10px] text-accent/60">Score gespeichert</p>
          <button
            onClick={startGame}
            className="rounded-full bg-accent px-8 py-3 font-display text-sm font-bold uppercase tracking-wider text-dark shadow-[0_0_20px_rgba(184,240,104,0.3)] transition hover:brightness-110"
          >
            ▶ Nochmal
          </button>
        </div>
      )}

      <p className="mt-1 text-[9px] text-gray-700">
        {musicOn ? "♫ Musik läuft" : "Tap ♪ für Musik"}
      </p>

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
                    <div className="min-w-0 flex-1">
                      <span className={`block truncate text-xs ${e.isMe ? "font-semibold text-accent" : "text-gray-300"}`}>
                        {e.name}{e.isMe && <span className="ml-1 text-[9px] text-accent/70">(du)</span>}
                      </span>
                      {e.date && (
                        <span className="block font-mono text-[9px] text-gray-600">
                          {new Date(e.date).toLocaleDateString("de-CH", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
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
