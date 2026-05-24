import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/drohne/stop — beendet den aktuell laufenden Flight.
// Nur der Starter (oder ein Admin) darf stoppen, sonst koennten
// Mit-Bewohner Livio die Drohne wegtoggeln.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const flight = await prisma.droneFlight.findFirst({
    where: { endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  if (!flight) {
    return NextResponse.json({ ok: true, skipped: "no-active-flight" });
  }

  const isAdmin = (session.user.roles ?? []).includes("ADMIN");
  if (flight.startedById !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Nur der Starter darf stoppen." }, { status: 403 });
  }

  await prisma.droneFlight.update({
    where: { id: flight.id },
    data: { endedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
