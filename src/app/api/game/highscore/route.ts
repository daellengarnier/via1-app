import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/game/highscore — Top 20 einzelne Spiele + eigener Bestwert
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [meBest, topScores] = await Promise.all([
    prisma.gameScore.findFirst({
      where: { userId: session.user.id },
      orderBy: { score: "desc" },
      select: { score: true },
    }),
    prisma.gameScore.findMany({
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

// POST /api/game/highscore — jeder Spielstand wird gespeichert
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

  const prevBest = await prisma.gameScore.findFirst({
    where: { userId: session.user.id },
    orderBy: { score: "desc" },
    select: { score: true },
  });
  const previousBest = prevBest?.score ?? 0;
  const isNewRecord = score > previousBest;

  await prisma.gameScore.create({
    data: {
      userId: session.user.id,
      score,
    },
  });

  // User.gameHighScore zusaetzlich aktualisieren (Badge auf Home)
  if (isNewRecord) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { gameHighScore: score },
    });
  }

  return NextResponse.json({
    score,
    isNewRecord,
    previousBest,
  });
}
