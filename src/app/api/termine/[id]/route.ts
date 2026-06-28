import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditTermin } from "@/lib/termin-permissions";
import { notify } from "@/lib/notify";
import {
  combineDateTime,
  serializeTerminDetail,
} from "@/lib/termine-serialize";

const terminDetailInclude = {
  createdBy: true,
  editors: true,
  traktanden: {
    include: { createdBy: true },
    orderBy: [{ order: "asc" as const }, { createdAt: "asc" as const }],
  },
  attendances: { include: { user: true } },
  mealSignups: {
    include: { user: true, guests: true },
    orderBy: { createdAt: "asc" as const },
  },
  comments: {
    include: { author: true },
    orderBy: { createdAt: "asc" as const },
  },
  responsibleWg: { select: { id: true, name: true } },
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
  return NextResponse.json(
    serializeTerminDetail(termin, session.user.id, {
      id: session.user.id,
      name: session.user.name,
      roles: session.user.roles ?? [],
    })
  );
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

  const existing = await prisma.termin.findUnique({
    where: { id: params.id },
    include: { editors: { select: { id: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json()) as Record<string, unknown>;

  // archived ist eine sensible Aktion (versteckt den Termin) — hier
  // schaerfen wir die Permission, auch wenn der Rest des PATCH aktuell
  // offen ist (siehe Security-Audit, spaeter wird's komplett verschaerft).
  if (typeof body.archived === "boolean") {
    if (!canEditTermin(session, existing)) {
      return NextResponse.json(
        {
          error:
            "Nur Ersteller:in, Sitzungsleitung, Protokollführung, Co-Bearbeiter:in oder Admin",
        },
        { status: 403 }
      );
    }
  }
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
  if (typeof body.dinnerMenu === "string" || body.dinnerMenu === null) {
    data.dinnerMenu =
      typeof body.dinnerMenu === "string" && body.dinnerMenu.trim() !== ""
        ? body.dinnerMenu.trim()
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

  // Archiv-Toggle: archived=true setzt archivedAt=jetzt, =false setzt null
  if (typeof body.archived === "boolean") {
    data.archivedAt = body.archived ? new Date() : null;
  }

  // Co-Bearbeiter (editors) komplett ersetzen wenn editorIds geschickt wird.
  // Leeres Array = alle entfernen.
  if (Array.isArray(body.editorIds)) {
    const editorIds = body.editorIds.filter(
      (id): id is string => typeof id === "string"
    );
    const filtered = editorIds.filter((id) => id !== existing.createdById);
    data.editors = { set: filtered.map((id) => ({ id })) };
  }

  const termin = await prisma.termin.update({
    where: { id: params.id },
    data,
    include: terminDetailInclude,
  });

  // Sitzung wurde gerade abgeschlossen (archived=true)? Dann alle
  // noch nicht publizierten Pendenzen (Drafts) publizieren und
  // Push-Notifications an die jeweiligen Zugewiesenen.
  if (body.archived === true && !existing.archivedAt) {
    const drafts = await prisma.aufgabe.findMany({
      where: { sourceTerminId: params.id, publishedAt: null },
      include: { assignees: { select: { id: true } } },
    });
    if (drafts.length > 0) {
      await prisma.aufgabe.updateMany({
        where: { sourceTerminId: params.id, publishedAt: null },
        data: { publishedAt: new Date() },
      });
      for (const a of drafts) {
        const targets = a.assignees
          .map((u) => u.id)
          .filter((id) => id !== session.user.id);
        if (targets.length > 0) {
          notify({
            kind: "AUFGABE_NEW",
            title: `Dir wurde eine Aufgabe zugewiesen: ${a.title}`,
            body: a.description || undefined,
            link: "/aufgaben",
            audience: targets,
          }).catch((e) => console.error("notify-draft-publish", e));
        }
      }
    }
  }

  return NextResponse.json(
    serializeTerminDetail(termin, session.user.id, {
      id: session.user.id,
      name: session.user.name,
      roles: session.user.roles ?? [],
    })
  );
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
