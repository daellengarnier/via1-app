import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/rooms/damages — gibt Liste aller roomKeys mit offenen Schaeden
// zurueck (fuer die Uebersichts-Indicators)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const damages = await prisma.roomDamage.findMany({
    where: { resolvedAt: null },
    select: { roomKey: true },
  });
  const roomKeys = Array.from(new Set(damages.map((d) => d.roomKey)));
  return NextResponse.json({ roomKeysWithOpenDamage: roomKeys });
}
