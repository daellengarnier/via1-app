import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditTermin } from "@/lib/termin-permissions";

// POST /api/termine/[id]/traktanden — neues Traktandum
// Body: { title: string; createdById?: string }
//
// Wer wird als Ersteller eingetragen?
//   - Wenn createdById im Body steht UND der aktuelle User canEditTermin
//     hat → der gewaehlte User wird gespeichert (Protokollant erfasst
//     ein Traktandum im Namen einer anderen Person, die nicht selbst
//     anwesend ist oder zu spaet eingetragen hat).
//   - Sonst: der aktuelle User (Standardfall).
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const termin = await prisma.termin.findUnique({
    where: { id: params.id },
    include: { editors: { select: { id: true } } },
  });
  if (!termin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json()) as {
    title?: unknown;
    notes?: unknown;
    createdById?: unknown;
  };
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "title erforderlich" }, { status: 400 });
  }
  const notes = typeof body.notes === "string" ? body.notes : "";

  // Ersteller bestimmen — Default: ich. Override nur wenn berechtigt.
  let creatorId = session.user.id;
  const requestedCreatorId =
    typeof body.createdById === "string" && body.createdById.trim() !== ""
      ? body.createdById.trim()
      : null;
  if (requestedCreatorId && requestedCreatorId !== session.user.id) {
    if (!canEditTermin(session, termin)) {
      return NextResponse.json(
        {
          error:
            "Nur Termin-Bearbeiter:innen dürfen einen anderen Ersteller eintragen",
        },
        { status: 403 }
      );
    }
    // User existiert?
    const exists = await prisma.user.findUnique({
      where: { id: requestedCreatorId },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json(
        { error: "Gewählte Person existiert nicht" },
        { status: 400 }
      );
    }
    creatorId = requestedCreatorId;
  }

  // Naechste Order-Nummer = max + 1
  const last = await prisma.traktandum.findFirst({
    where: { terminId: params.id },
    orderBy: { order: "desc" },
  });
  const nextOrder = (last?.order ?? -1) + 1;

  const traktandum = await prisma.traktandum.create({
    data: {
      terminId: params.id,
      title,
      notes,
      order: nextOrder,
      createdById: creatorId,
    },
    include: { createdBy: true },
  });

  return NextResponse.json({
    id: traktandum.id,
    title: traktandum.title,
    notes: traktandum.notes,
    order: traktandum.order,
    createdBy: traktandum.createdBy.name,
    createdById: traktandum.createdById,
    canEdit: true,
  });
}
