import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toDateOnly(d: Date): string {
  return d.toISOString().split("T")[0]!;
}

function parseDate(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return new Date(`${s}T00:00:00.000Z`);
}

// PATCH /api/bookings/[id] — Owner oder Admin darf guest/from/to aendern.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
  });
  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = booking.createdById === session.user.id;
  const isAdmin = (session.user.roles || []).includes("ADMIN");
  if (!isOwner && !isAdmin) {
    return NextResponse.json(
      { error: "Nur eigene Buchung oder Admin" },
      { status: 403 }
    );
  }

  const body = (await req.json()) as {
    guest?: unknown;
    from?: unknown;
    to?: unknown;
  };

  const data: { guest?: string; fromDate?: Date; toDate?: Date } = {};

  if (typeof body.guest === "string") {
    const g = body.guest.trim();
    if (!g) {
      return NextResponse.json(
        { error: "guest darf nicht leer sein" },
        { status: 400 }
      );
    }
    data.guest = g;
  }

  if (typeof body.from === "string") {
    const from = parseDate(body.from);
    if (!from) {
      return NextResponse.json(
        { error: "Ungueltiges from-Datum" },
        { status: 400 }
      );
    }
    data.fromDate = from;
  }

  if (typeof body.to === "string") {
    const to = parseDate(body.to);
    if (!to) {
      return NextResponse.json(
        { error: "Ungueltiges to-Datum" },
        { status: 400 }
      );
    }
    data.toDate = to;
  }

  const finalFrom = data.fromDate ?? booking.fromDate;
  const finalTo = data.toDate ?? booking.toDate;
  if (finalFrom.getTime() > finalTo.getTime()) {
    return NextResponse.json(
      { error: "from muss vor to sein" },
      { status: 400 }
    );
  }

  // Konfliktpruefung: ueberlappende Buchungen (ausser sich selbst).
  const conflict = await prisma.booking.findFirst({
    where: {
      id: { not: params.id },
      fromDate: { lte: finalTo },
      toDate: { gte: finalFrom },
    },
  });
  if (conflict) {
    return NextResponse.json(
      { error: `Konflikt: ${conflict.guest} hat in diesem Zeitraum gebucht.` },
      { status: 409 }
    );
  }

  const updated = await prisma.booking.update({
    where: { id: params.id },
    data,
    include: {
      createdBy: { select: { id: true, name: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });

  return NextResponse.json({
    id: updated.id,
    guest: updated.guest,
    invitedBy: updated.createdBy.name,
    invitedById: updated.createdBy.id,
    from: toDateOnly(updated.fromDate),
    to: toDateOnly(updated.toDate),
    comments: updated.comments.map((c) => ({
      id: c.id,
      author: c.author.name,
      authorId: c.author.id,
      text: c.text,
      date: toDateOnly(c.createdAt),
    })),
  });
}

// DELETE /api/bookings/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
  });
  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = booking.createdById === session.user.id;
  const isAdmin = (session.user.roles || []).includes("ADMIN");
  if (!isOwner && !isAdmin) {
    return NextResponse.json(
      { error: "Nur eigene Buchung oder Admin" },
      { status: 403 }
    );
  }

  await prisma.booking.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
