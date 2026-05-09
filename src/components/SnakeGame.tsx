"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const CELL = 14;
const COLS = 24;
const ROWS = 36;
const W = COLS * CELL;
const H = ROWS * CELL;
const TICK_START = 155;
const TICK_MIN = 85;

type Pos = readonly [number, number];

const DIR = {
  UP: [0, -1] as Pos,
  DOWN: [0, 1] as Pos,
  LEFT: [-1, 0] as Pos,
  RIGHT: [1, 0] as Pos,
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  hue: number;
  sz: number;
}

interface Game {
  snake: Pos[];
  dir: Pos;
  nextDir: Pos;
  food: Pos;
  score: number;
  running: boolean;
  particles: Particle[];
  shake: number;
  frame: number;
}

interface Palette {
  bg: string;
  snakeH: string;
  food: string;
  trail: (t: number, score: number) => string;
}

const PALETTES: Palette[] = [
  {
    bg: "#0F0A1F",
    snakeH: "#00F0FF",
    food: "#FF3CAC",
    trail: (t) => `hsl(${180 - t * 60},100%,60%)`,
  },
  {
    bg: "#140523",
    snakeH: "#FF3CAC",
    food: "#00FF88",
    trail: (t) => `hsl(${300 - t * 120},100%,55%)`,
  },
  {
    bg: "#05140A",
    snakeH: "#00FF88",
    food: "#FFD700",
    trail: (t) => `hsl(${120 + t * 60},100%,50%)`,
  },
  {
    bg: "#1E0505",
    snakeH: "#FFD700",
    food: "#FF3CAC",
    trail: (t) => `hsl(${30 - t * 30},100%,55%)`,
  },
  {
    bg: "#0A0014",
    snakeH: "#FFFFFF",
    food: "#FF00FF",
    trail: (t, s) => `hsl(${(s * 8 + t * 120) % 360},100%,60%)`,
  },
];

function paletteFor(level: number): Palette {
  return PALETTES[Math.max(0, Math.min(PALETTES.length - 1, level))]!;
}

function randomFood(snake: Pos[]): Pos {
  let pos: Pos;
  do {
    pos = [
      Math.floor(Math.random() * COLS),
      Math.floor(Math.random() * ROWS),
    ];
  } while (snake.some((s) => s[0] === pos[0] && s[1] === pos[1]));
  return pos;
}

function initGame(): Game {
  const mid: Pos = [Math.floor(COLS / 2), Math.floor(ROWS / 2)];
  const snake: Pos[] = [
    mid,
    [mid[0] - 1, mid[1]],
    [mid[0] - 2, mid[1]],
  ];
  return {
    snake,
    dir: DIR.RIGHT,
    nextDir: DIR.RIGHT,
    food: randomFood(snake),
    score: 0,
    running: true,
    particles: [],
    shake: 0,
    frame: 0,
  };
}

interface SnakeGameProps {
  onGameOver: (score: number) => void;
  highScore: number;
}

export function SnakeGame({ onGameOver, highScore }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<Game | null>(null);
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const onGameOverRef = useRef(onGameOver);
  const highScoreRef = useRef(highScore);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);
  useEffect(() => {
    highScoreRef.current = highScore;
  }, [highScore]);

  const startGame = useCallback(() => {
    gameRef.current = initGame();
    setScore(0);
    setGameOver(false);
    setStarted(true);
  }, []);

  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let lastTick = 0;
    let rafId = 0;

    const tick = () => {
      const g = gameRef.current;
      if (!g || !g.running) return;
      g.dir = g.nextDir;
      const head = g.snake[0];
      if (!head) return;
      // Transparente Waende: durch den Rand gehen heisst auf der
      // gegenueberliegenden Seite wieder rauskommen.
      const nh: Pos = [
        ((head[0] + g.dir[0]) % COLS + COLS) % COLS,
        ((head[1] + g.dir[1]) % ROWS + ROWS) % ROWS,
      ];

      if (g.snake.some((s) => s[0] === nh[0] && s[1] === nh[1])) {
        g.running = false;
        g.shake = 2;
        setGameOver(true);
        onGameOverRef.current(g.score);
        return;
      }

      g.snake = [nh, ...g.snake];
      if (nh[0] === g.food[0] && nh[1] === g.food[1]) {
        g.score++;
        setScore(g.score);
        g.food = randomFood(g.snake);
        g.shake = Math.min(1.5, g.score * 0.08);
        const px = nh[0] * CELL + CELL / 2;
        const py = nh[1] * CELL + CELL / 2;
        for (let i = 0; i < 5 + Math.min(12, g.score); i++) {
          g.particles.push({
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3 - 1,
            life: 1,
            hue: Math.random() * 360,
            sz: 1.5 + Math.random() * 2,
          });
        }
      } else {
        g.snake.pop();
      }
    };

    const draw = () => {
      const g = gameRef.current;
      if (!g) return;
      g.frame++;
      const f = g.frame;
      const level = Math.min(PALETTES.length - 1, Math.floor(g.score / 15));
      const P = paletteFor(level);

      ctx.save();
      if (g.shake > 0.05) {
        ctx.translate(
          (Math.random() - 0.5) * g.shake * 3,
          (Math.random() - 0.5) * g.shake * 3
        );
        g.shake *= 0.88;
      }

      ctx.fillStyle = P.bg;
      ctx.fillRect(0, 0, W, H);

      g.particles = g.particles.filter((p) => p.life > 0);
      for (const p of g.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.life -= 0.03;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = `hsl(${p.hue},100%,65%)`;
        ctx.fillRect(p.x - p.sz / 2, p.y - p.sz / 2, p.sz * p.life, p.sz * p.life);
      }
      ctx.globalAlpha = 1;

      // Food (Pilz)
      const fx = g.food[0] * CELL + CELL / 2;
      const fy = g.food[1] * CELL + CELL / 2;
      const fs = CELL * 0.4;
      const pulse = 1 + Math.sin(f * 0.08) * 0.12;
      ctx.save();
      ctx.translate(fx, fy);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = "#B478FF";
      ctx.fillRect(-1.5, 0, 3, fs);
      ctx.fillStyle = P.food;
      ctx.beginPath();
      ctx.arc(0, 0, fs, Math.PI, 0);
      ctx.fill();
      ctx.restore();

      // Snake
      const len = g.snake.length;
      for (let i = len - 1; i >= 0; i--) {
        const seg = g.snake[i];
        if (!seg) continue;
        const x = seg[0] * CELL + 1;
        const y = seg[1] * CELL + 1;
        const s = CELL - 2;
        if (i === 0) {
          ctx.fillStyle = P.snakeH;
          ctx.fillRect(x, y, s, s);
          const hz = g.dir === DIR.LEFT || g.dir === DIR.RIGHT;
          ctx.fillStyle = P.bg;
          if (hz) {
            const ex = g.dir === DIR.RIGHT ? x + s - 4 : x + 2;
            ctx.fillRect(ex, y + 3, 2, 2);
            ctx.fillRect(ex, y + s - 5, 2, 2);
          } else {
            const ey = g.dir === DIR.DOWN ? y + s - 4 : y + 2;
            ctx.fillRect(x + 3, ey, 2, 2);
            ctx.fillRect(x + s - 5, ey, 2, 2);
          }
        } else {
          ctx.fillStyle = P.trail(i / len, g.score);
          ctx.fillRect(x, y, s, s);
        }
      }

      ctx.fillStyle = "#F0EEFF";
      ctx.font = "600 13px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(String(g.score), 8, 18);
      ctx.textAlign = "right";
      ctx.fillText(`Best: ${Math.max(highScoreRef.current, g.score)}`, W - 8, 18);

      ctx.restore();
    };

    const loop = (now: number) => {
      const g = gameRef.current;
      if (!g) return;
      const speed = Math.max(TICK_MIN, TICK_START - g.score * 1.5);
      if (now - lastTick >= speed) {
        tick();
        lastTick = now;
      }
      draw();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [started]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const g = gameRef.current;
      if (!g || !g.running) return;
      if ((e.key === "ArrowUp" || e.key === "w") && g.dir !== DIR.DOWN) {
        g.nextDir = DIR.UP;
        e.preventDefault();
      } else if (
        (e.key === "ArrowDown" || e.key === "s") &&
        g.dir !== DIR.UP
      ) {
        g.nextDir = DIR.DOWN;
        e.preventDefault();
      } else if (
        (e.key === "ArrowLeft" || e.key === "a") &&
        g.dir !== DIR.RIGHT
      ) {
        g.nextDir = DIR.LEFT;
        e.preventDefault();
      } else if (
        (e.key === "ArrowRight" || e.key === "d") &&
        g.dir !== DIR.LEFT
      ) {
        g.nextDir = DIR.RIGHT;
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function handleTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    touchRef.current = { x: t.clientX, y: t.clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchRef.current) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    const g = gameRef.current;
    if (!g || !g.running) {
      touchRef.current = null;
      return;
    }
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 20 && g.dir !== DIR.LEFT) g.nextDir = DIR.RIGHT;
      if (dx < -20 && g.dir !== DIR.RIGHT) g.nextDir = DIR.LEFT;
    } else {
      if (dy > 20 && g.dir !== DIR.UP) g.nextDir = DIR.DOWN;
      if (dy < -20 && g.dir !== DIR.DOWN) g.nextDir = DIR.UP;
    }
    touchRef.current = null;
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative mx-auto overflow-hidden rounded-xl border border-cyan-500/30 touch-none"
      style={{
        background: "#0F0A1F",
        aspectRatio: `${W} / ${H}`,
        maxHeight: "100%",
        maxWidth: "100%",
        height: "auto",
        width: "auto",
      }}
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="block h-full w-full"
      />
      {!started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[rgba(15,10,31,0.92)]">
          <div className="text-4xl">🍄</div>
          <div className="px-6 text-center text-xs text-gray-300">
            Je mehr Pilze du isst, desto trippiger wird&apos;s. Waende sind
            durchlaessig — fliege durch den Rand.
          </div>
          <button
            onClick={startGame}
            className="rounded-xl bg-pink-500 px-6 py-2.5 text-sm font-semibold text-white hover:brightness-110"
          >
            Spielen!
          </button>
        </div>
      )}
      {gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[rgba(15,10,31,0.92)]">
          <div className="text-lg font-bold text-pink-400">Game Over!</div>
          <div className="text-4xl font-bold text-cyan-300">{score}</div>
          <button
            onClick={startGame}
            className="rounded-xl bg-pink-500 px-6 py-2.5 text-sm font-semibold text-white hover:brightness-110"
          >
            Nochmal!
          </button>
        </div>
      )}
    </div>
  );
}
