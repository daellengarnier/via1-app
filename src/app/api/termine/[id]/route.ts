import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  combineDateTime,
  serializeTerminDetail,
} from "@/lib/termine-serialize";

const terminDetailInclude = {
  traktanden: {
    include: { createdBy: true },
    orderBy: [{ order: "asc" as const }, { createdAt: "asc" as const }],
  },
  attendances: { include: { user: true } },
  mealSignups: {
    include: { user: true, guests: true },
    orderBy: { createdAt: "asc" as const },
  },
};

// GET /api/termine/[id]
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const termin = await prisma.termin.findUnique({
    where: { id: params.id },
    include: terminDetailInclude,
  });
  if (!termin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(serializeTerminDetail(termin, session.user.id));
}

// PATCH /api/termine/[id] — Titel, Ort, Sitzungsleitung, Protokollfuehrung,
// Datum/Zeit, withAttendance, dinner-Einstellungen
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.termin.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.location === "string") data.location = body.location.trim();
  if (typeof body.sitzungsleitung === "string")
    data.sitzungsleitung = body.sitzungsleitung.trim();
  if (typeof body.protokollfuehrung === "string")
    data.protokollfuehrung = body.protokollfuehrung.trim();
  if (typeof body.organizer === "string" || body.organizer === null) {
    data.organizer =
      typeof body.organizer === "string" && body.organizer.trim() !== ""
        ? body.organizer.trim()
        : null;
  }
  if (typeof body.withDinner === "boolean") data.withDinner = body.withDinner;
  if (typeof body.dinnerTime === "string" || body.dinnerTime === null) {
    data.dinnerTime =
      typeof body.dinnerTime === "string" ? body.dinnerTime : null;
  }
  if (typeof body.dinnerLocation === "string" || body.dinnerLocation === null) {
    data.dinnerLocation =
      typeof body.dinnerLocation === "string" && body.dinnerLocation.trim() !== ""
        ? body.dinnerLocation.trim()
        : null;
  }
  if (typeof body.dinnerOrganizer === "string" || body.dinnerOrganizer === null) {
    data.dinnerOrganizer =
      typeof body.dinnerOrganizer === "string" && body.dinnerOrganizer.trim() !== ""
        ? body.dinnerOrganizer.trim()
        : null;
  }
  if (typeof body.withAttendance === "boolean") {
    data.withAttendance = body.withAttendance;
  }

  // Datum/Zeit zusammen updaten
  if (typeof body.date === "string" && typeof body.time === "string") {
    if (
      /^\d{4}-\d{2}-\d{2}$/.test(body.date) &&
      /^\d{2}:\d{2}$/.test(body.time)
    ) {
      data.date = combineDateTime(body.date, body.time);
    }
  }

  const termin = await prisma.termin.update({
    where: { id: params.id },
    data,
    include: {
      traktanden: {
        include: { createdBy: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
      attendances: { include: { user: true } },
      mealSignups: {
        include: { user: true, guests: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  return NextResponse.json(serializeTerminDetail(termin, session.user.id));
}

// DELETE /api/termine/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const termin = await prisma.termin.findUnique({ where: { id: params.id } });
  if (!termin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = termin.createdById === session.user.id;
  const isAdmin = (session.user.roles || []).includes("ADMIN");
  if (!isOwner && !isAdmin) {
    return NextResponse.json(
      { error: "Nur eigener Termin oder Admin" },
      { status: 403 }
    );
  }

  await prisma.termin.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
