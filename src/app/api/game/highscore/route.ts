import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_GAMES = new Set(["tetris", "snake"]);

function pickGame(value: string | null | undefined): string | null {
  if (!value) return null;
  if (VALID_GAMES.has(value)) return value;
  return null;
}

// GET /api/game/highscore[?game=snake|tetris]
// Top 20 einzelne Spiele + eigener Bestwert. Optional gefiltert
// nach Spiel; ohne Filter werden alle Spiele kombiniert (fuer den
// Highscore-Badge im Hamburger-Menue).
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const game = pickGame(url.searchParams.get("game"));
  const where = game ? { game } : {};

  const [meBest, topScores] = await Promise.all([
    prisma.gameScore.findFirst({
      where: { userId: session.user.id, ...(game ? { game } : {}) },
      orderBy: { score: "desc" },
      select: { score: true },
    }),
    prisma.gameScore.findMany({
      where,
      orderBy: { score: "desc" },
      take: 20,
      include: {
        user: { select: { id: true, name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    myScore: meBest?.score ?? 0,
    topScore: topScores[0]?.score ?? 0,
    topPlayer: topScores[0]?.user.name ?? null,
    leaderboard: topScores.map((s) => ({
      name: s.user.name,
      score: s.score,
      date: s.createdAt.toISOString(),
      isMe: s.user.id === session.user.id,
    })),
  });
}

// POST /api/game/highscore
// Body: { score, game?: "tetris"|"snake" } — game default "tetris"
// fuer Rueckwaertskompatibilitaet
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { score?: unknown; game?: unknown };
  const score = typeof body.score === "number" ? Math.floor(body.score) : 0;
  if (score <= 0) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 });
  }
  const game =
    typeof body.game === "string" && VALID_GAMES.has(body.game)
      ? body.game
      : "tetris";

  const prevBest = await prisma.gameScore.findFirst({
    where: { userId: session.user.id, game },
    orderBy: { score: "desc" },
    select: { score: true },
  });
  const previousBest = prevBest?.score ?? 0;
  const isNewRecord = score > previousBest;

  await prisma.gameScore.create({
    data: {
      userId: session.user.id,
      score,
      game,
    },
  });

  // User.gameHighScore: behaelt das spielelubergreifende All-Time-Best
  const overallBest = await prisma.gameScore.findFirst({
    where: { userId: session.user.id },
    orderBy: { score: "desc" },
    select: { score: true },
  });
  if ((overallBest?.score ?? 0) > 0) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { gameHighScore: overallBest?.score ?? 0 },
    });
  }

  return NextResponse.json({
    score,
    game,
    isNewRecord,
    previousBest,
  });
}
