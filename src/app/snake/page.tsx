"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SnakeGame } from "@/components/SnakeGame";

interface LeaderboardEntry {
  name: string;
  score: number;
  date?: string;
  isMe: boolean;
}

export default function SnakePage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myScore, setMyScore] = useState(0);
  const [showLB, setShowLB] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Scroll blockieren waehrend Snake offen ist (Pfeiltasten/Wischen
  // sollen nicht die Seite verschieben)
  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    const prevOverscroll = document.body.style.overscrollBehavior;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
      document.body.style.overscrollBehavior = prevOverscroll;
    };
  }, []);

  const loadLB = useCallback(() => {
    fetch("/api/game/highscore?game=snake")
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          d: {
            leaderboard?: LeaderboardEntry[];
            myScore?: number;
          } | null
        ) => {
          if (d?.leaderboard) setLeaderboard(d.leaderboard);
          if (typeof d?.myScore === "number") setMyScore(d.myScore);
        }
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadLB();
  }, [loadLB]);

  const handleGameOver = useCallback(
    (score: number) => {
      setFinalScore(score);
      if (score <= 0) return;
      fetch("/api/game/highscore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, game: "snake" }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { isNewRecord?: boolean } | null) => {
          if (d?.isNewRecord) setIsNewRecord(true);
          loadLB();
        })
        .catch(() => {});
    },
    [loadLB]
  );

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      {/* Header — fix oben */}
      <div className="mx-auto flex w-full max-w-[420px] shrink-0 items-center justify-between px-4 py-3">
        <button
          onClick={() => router.back()}
          className="w-8 text-sm text-gray-500 hover:text-white"
        >
          ←
        </button>
        <p className="font-display text-[12px] font-bold uppercase tracking-widest text-cyan-300">
          🐍 Snake
        </p>
        <button
          onClick={() => setShowLB(true)}
          className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-amber-300 hover:bg-amber-500/20"
        >
          🏆 Top 20
        </button>
      </div>

      {/* Spielfeld — vertikal zentriert in der verbleibenden Hoehe */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-3">
        {myScore > 0 && (
          <p className="font-mono text-[10px] text-gray-500">
            Dein Bestwert: <span className="text-cyan-300">{myScore}</span>
          </p>
        )}
        <div className="w-full max-w-[420px]">
          <SnakeGame onGameOver={handleGameOver} highScore={myScore} />
        </div>
        {finalScore !== null && finalScore > 0 && (
          <div className="flex flex-col items-center">
            {isNewRecord ? (
              <p className="font-display text-[11px] font-bold uppercase tracking-widest text-amber-300">
                🏆 Neuer Highscore!
              </p>
            ) : (
              <p className="font-mono text-[10px] text-gray-500">
                Score gespeichert
              </p>
            )}
          </div>
        )}
      </div>

      {/* Leaderboard Modal */}
      {showLB && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowLB(false)}
        >
          <div
            className="mx-4 w-full max-w-xs rounded-2xl border border-gray-800 bg-dark p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-[10px] font-bold uppercase tracking-widest text-amber-300">
                🐍 SNAKE TOP 20
              </p>
              <button
                onClick={() => setShowLB(false)}
                className="text-gray-500 hover:text-white"
              >
                ×
              </button>
            </div>
            {leaderboard.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-600">
                Noch keine Scores
              </p>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto">
                {leaderboard.map((e, i) => (
                  <div
                    key={`${e.name}-${i}`}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
                      e.isMe
                        ? "bg-cyan-500/10 ring-1 ring-cyan-500/30"
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
                    <div className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-xs ${
                          e.isMe
                            ? "font-semibold text-cyan-300"
                            : "text-gray-300"
                        }`}
                      >
                        {e.name}
                        {e.isMe && (
                          <span className="ml-1 text-[9px] text-cyan-300/70">
                            (du)
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-xs font-bold text-cyan-200">
                      {e.score}
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
