import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users — Liste aller Bewohner:innen (nur id + name)
// fuer Attendance-Modal, Meal-Signups-Zuordnung etc.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { passwordSet: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return NextResponse.json(users);
}
