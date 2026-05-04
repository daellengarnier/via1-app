import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await prisma.putzplanEntry.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(
    entries.map((e) => ({
      wg: e.wg,
      completedAt: e.completedAt
        ? e.completedAt.toISOString().split("T")[0]
        : null,
    }))
  );
}

// POST /api/putzplan — WG als erledigt markieren oder Runde resetten
// Body: { action: "complete", wg: string }
//    or { action: "reset" }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    action?: string;
    wg?: string;
  };

  if (body.action === "reset") {
    await prisma.putzplanEntry.updateMany({
      data: { completedAt: null },
    });
  } else if (body.action === "complete" && body.wg) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    await prisma.putzplanEntry.updateMany({
      where: { wg: body.wg },
      data: { completedAt: today },
    });

    // Auto-Reset prüfen: wenn alle durch, neue Runde starten
    const all = await prisma.putzplanEntry.findMany();
    if (all.length > 0 && all.every((e) => e.completedAt !== null)) {
      await prisma.putzplanEntry.updateMany({
        data: { completedAt: null },
      });
    }
  } else {
    return NextResponse.json({ error: "Ungültige Aktion" }, { status: 400 });
  }

  // Aktuellen Stand zurückgeben
  const entries = await prisma.putzplanEntry.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(
    entries.map((e) => ({
      wg: e.wg,
      completedAt: e.completedAt
        ? e.completedAt.toISOString().split("T")[0]
        : null,
    }))
  );
}
