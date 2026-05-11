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
    // Highscores pro User + Game in einem Sweep aggregieren
    prisma.gameScore.groupBy({
      by: ["userId", "game"],
      _max: { score: true },
    }),
  ]);

  const dietMap = {
    FLEISCH: "Fleisch",
    VEGI: "Vegetarisch",
    VEGAN: "Vegan",
  } as const;

  const scoreMap = new Map<string, { tetris: number; snake: number }>();
  for (const row of scoreRows) {
    const cur = scoreMap.get(row.userId) ?? { tetris: 0, snake: 0 };
    if (row.game === "tetris") cur.tetris = row._max.score ?? 0;
    if (row.game === "snake") cur.snake = row._max.score ?? 0;
    scoreMap.set(row.userId, cur);
  }

  return NextResponse.json(
    users.map((u) => {
      const scores = scoreMap.get(u.id) ?? { tetris: 0, snake: 0 };
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
        tetrisHighscore: scores.tetris,
        snakeHighscore: scores.snake,
      };
    })
  );
}
