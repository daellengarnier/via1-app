import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/game/highscore — globaler Highscore + eigener Score + Leaderboard
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [me, leaderboard] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { gameHighScore: true },
    }),
    prisma.user.findMany({
      where: { gameHighScore: { gt: 0 } },
      orderBy: { gameHighScore: "desc" },
      take: 10,
      select: { id: true, name: true, gameHighScore: true },
    }),
  ]);

  return NextResponse.json({
    myScore: me?.gameHighScore ?? 0,
    topScore: leaderboard[0]?.gameHighScore ?? 0,
    topPlayer: leaderboard[0]?.name ?? null,
    leaderboard: leaderboard.map((u) => ({
      name: u.name,
      score: u.gameHighScore,
      isMe: u.id === session.user.id,
    })),
  });
}

// POST /api/game/highscore — neuen Score melden (nur wenn hoeher)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { score?: unknown };
  const score = typeof body.score === "number" ? Math.floor(body.score) : 0;
  if (score <= 0) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { gameHighScore: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isNewRecord = score > user.gameHighScore;
  if (isNewRecord) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { gameHighScore: score },
    });
  }

  return NextResponse.json({
    score,
    isNewRecord,
    previousBest: user.gameHighScore,
  });
}
