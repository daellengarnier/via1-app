import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users — Liste aller Bewohner:innen mit Zimmer + WG
// fuer Attendance-Modal, Meal-Signups-Zuordnung, Bewohnende-Seite.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [users, scoreRows] = await Promise.all([
    prisma.user.findMany({
      where: { passwordSet: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        fullName: true,
        favoriteAnimal: true,
        avatar: true,
        birthday: true,
        diet: true,
        allergies: true,
        room: {
          select: {
            id: true,
            keyNumber: true,
            number: true,
            wg: { select: { name: true } },
          },
        },
      },
    }),
    // Highscore + Total-Spielzeit pro User + Game in einem Sweep
    prisma.gameScore.groupBy({
      by: ["userId", "game"],
      _max: { score: true },
      _sum: { durationSec: true },
    }),
  ]);

  const dietMap = {
    FLEISCH: "Fleisch",
    VEGI: "Vegetarisch",
    VEGAN: "Vegan",
  } as const;

  interface Stats {
    tetrisHighscore: number;
    snakeHighscore: number;
    tetrisSec: number;
    snakeSec: number;
  }
  const empty = (): Stats => ({
    tetrisHighscore: 0,
    snakeHighscore: 0,
    tetrisSec: 0,
    snakeSec: 0,
  });
  const scoreMap = new Map<string, Stats>();
  for (const row of scoreRows) {
    const cur = scoreMap.get(row.userId) ?? empty();
    if (row.game === "tetris") {
      cur.tetrisHighscore = row._max.score ?? 0;
      cur.tetrisSec = row._sum.durationSec ?? 0;
    }
    if (row.game === "snake") {
      cur.snakeHighscore = row._max.score ?? 0;
      cur.snakeSec = row._sum.durationSec ?? 0;
    }
    scoreMap.set(row.userId, cur);
  }

  return NextResponse.json(
    users.map((u) => {
      const stats = scoreMap.get(u.id) ?? empty();
      return {
        id: u.id,
        name: u.name,
        fullName: u.fullName ?? "",
        favoriteAnimal: u.favoriteAnimal ?? "",
        avatar: u.avatar ?? null,
        birthday: u.birthday ? u.birthday.toISOString().split("T")[0] : null,
        diet: u.diet ? dietMap[u.diet] : null,
        allergies: u.allergies ?? "",
        roomKey: u.room?.keyNumber ?? null,
        roomNumber: u.room?.number ?? null,
        wgName: u.room?.wg.name ?? null,
        tetrisHighscore: stats.tetrisHighscore,
        snakeHighscore: stats.snakeHighscore,
        tetrisSec: stats.tetrisSec,
        snakeSec: stats.snakeSec,
      };
    })
  );
}
