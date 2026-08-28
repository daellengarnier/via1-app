import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Gibt nur das Datum (YYYY-MM-DD) aus einem Date zurueck
function toDateOnly(d: Date): string {
  return d.toISOString().split("T")[0]!;
}

function parseDate(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return new Date(`${s}T00:00:00.000Z`);
}

// GET /api/bookings — alle Buchungen inkl. Kommentare + Invited-By-Name
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    orderBy: { fromDate: "asc" },
    include: {
      createdBy: { select: { id: true, name: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });

  return NextResponse.json(
    bookings.map((b) => ({
      id: b.id,
      guest: b.guest,
      invitedBy: b.createdBy.name,
      invitedById: b.createdBy.id,
      from: toDateOnly(b.fromDate),
      to: toDateOnly(b.toDate),
      comments: b.comments.map((c) => ({
        id: c.id,
        author: c.author.name,
        authorId: c.author.id,
        text: c.text,
        date: toDateOnly(c.createdAt),
      })),
    }))
  );
}

// POST /api/bookings — neue Buchung, mit Konfliktpruefung
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    guest?: unknown;
    from?: unknown;
    to?: unknown;
  };
  const guest = typeof body.guest === "string" ? body.guest.trim() : "";
  const fromStr = typeof body.from === "string" ? body.from : "";
  const toStr = typeof body.to === "string" ? body.to : "";
  const fromDate = parseDate(fromStr);
  const toDate = parseDate(toStr);

  if (!guest || !fromDate || !toDate) {
    return NextResponse.json(
      { error: "guest, from, to erforderlich" },
      { status: 400 }
    );
  }
  if (fromDate.getTime() > toDate.getTime()) {
    return NextResponse.json(
      { error: "from muss vor to sein" },
      { status: 400 }
    );
  }

  // Konfliktpruefung: ueberlappende Buchungen (beide Grenzen inklusiv,
  // da to bei uns als letzter belegter Tag interpretiert wird).
  const conflict = await prisma.booking.findFirst({
    where: {
      fromDate: { lte: toDate },
      toDate: { gte: fromDate },
    },
    include: { createdBy: { select: { name: true } } },
  });
  if (conflict) {
    return NextResponse.json(
      {
        error: `Konflikt: ${conflict.guest} hat in diesem Zeitraum gebucht.`,
      },
      { status: 409 }
    );
  }

  const created = await prisma.booking.create({
    data: {
      guest,
      fromDate,
      toDate,
      createdById: session.user.id,
    },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    id: created.id,
    guest: created.guest,
    invitedBy: created.createdBy.name,
    invitedById: created.createdBy.id,
    from: toDateOnly(created.fromDate),
    to: toDateOnly(created.toDate),
    comments: [],
  });
}
