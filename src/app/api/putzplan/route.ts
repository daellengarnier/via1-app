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
    completedAt?: string;
  };

  if (body.action === "reset") {
    await prisma.putzplanEntry.updateMany({
      data: { completedAt: null },
    });
  } else if (body.action === "complete" && body.wg) {
    // Default: heute. Optional: rueckwirkendes Datum (max heute, max 90 Tage zurueck)
    let when = new Date();
    if (body.completedAt && /^\d{4}-\d{2}-\d{2}$/.test(body.completedAt)) {
      const parsed = new Date(`${body.completedAt}T00:00:00Z`);
      if (!Number.isNaN(parsed.getTime())) {
        const today = new Date();
        today.setUTCHours(23, 59, 59, 999);
        const earliest = new Date();
        earliest.setUTCDate(earliest.getUTCDate() - 90);
        earliest.setUTCHours(0, 0, 0, 0);
        if (parsed.getTime() <= today.getTime() && parsed.getTime() >= earliest.getTime()) {
          when = parsed;
        }
      }
    }
    when.setUTCHours(0, 0, 0, 0);

    await prisma.putzplanEntry.updateMany({
      where: { wg: body.wg },
      data: { completedAt: when },
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
