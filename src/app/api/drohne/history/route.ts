import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/drohne/history — liefert die letzten 20 Flights inkl.
// Starter und alle Beschwerden (max 50 pro Flight). Beschwerden bleiben
// im Archiv erhalten, auch nach Ende eines Flights.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const flights = await prisma.droneFlight.findMany({
    orderBy: { startedAt: "desc" },
    take: 20,
    include: {
      startedBy: { select: { id: true, name: true } },
      complaints: {
        orderBy: { createdAt: "asc" },
        take: 50,
        include: {
          author: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json({
    flights: flights.map((f) => ({
      id: f.id,
      startedAt: f.startedAt.toISOString(),
      endedAt: f.endedAt ? f.endedAt.toISOString() : null,
      startedBy: f.startedBy,
      complaints: f.complaints.map((c) => ({
        id: c.id,
        text: c.text,
        author: c.author,
        createdAt: c.createdAt.toISOString(),
      })),
    })),
  });
}
