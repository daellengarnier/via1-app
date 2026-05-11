import { prisma } from "@/lib/prisma";

// Sorgt dafuer dass es immer einen Platzhalter-Termin fuer die naechste
// Haussitzung gibt. Wird beim Lesen der Termin-Liste aufgerufen — wenn
// die letzte Haussitzung vorbei ist und keine kommende existiert, wird
// fuer die naechste WG in der Rotation ein Platzhalter angelegt.
export async function ensureNextHaussitzungPlaceholder(
  fallbackAuthorId: string | null
): Promise<void> {
  const now = new Date();

  // Gibt es bereits eine kommende Haussitzung (Datum > jetzt oder Platzhalter)?
  const upcoming = await prisma.termin.findFirst({
    where: {
      isHaussitzung: true,
      OR: [{ date: null }, { date: { gt: now } }],
    },
    select: { id: true },
  });
  if (upcoming) return;

  // Letzte (vergangene) Haussitzung holen
  const last = await prisma.termin.findFirst({
    where: { isHaussitzung: true, date: { lte: now } },
    orderBy: { date: "desc" },
    select: { id: true, responsibleWgId: true },
  });
  if (!last?.responsibleWgId) return;

  // Naechste WG in der Rotation
  const lastRotation = await prisma.haussitzungRotation.findUnique({
    where: { wgId: last.responsibleWgId },
    select: { position: true },
  });
  if (!lastRotation) return;

  const all = await prisma.haussitzungRotation.findMany({
    orderBy: { position: "asc" },
    select: { wgId: true, position: true, wg: { select: { name: true } } },
  });
  if (all.length === 0) return;

  const idx = all.findIndex((r) => r.position === lastRotation.position);
  const next = all[(idx + 1) % all.length];
  if (!next) return;

  // Author: irgendein Admin als Fallback wenn nichts mitgegeben wurde
  let authorId = fallbackAuthorId;
  if (!authorId) {
    const admin = await prisma.user.findFirst({
      where: { roles: { has: "ADMIN" } },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    authorId = admin?.id ?? null;
  }
  if (!authorId) return;

  await prisma.termin.create({
    data: {
      title: "Haussitzung",
      date: null,
      location: "Saal",
      type: "SITZUNG",
      organizer: next.wg.name,
      withAttendance: true,
      isHaussitzung: true,
      responsibleWgId: next.wgId,
      createdById: authorId,
    },
  });
}

// Liefert die Rotation in Reihenfolge + die aktuell verantwortliche WG.
export async function getHaussitzungRotation() {
  const rotation = await prisma.haussitzungRotation.findMany({
    orderBy: { position: "asc" },
    include: { wg: { select: { id: true, name: true } } },
  });

  const placeholder = await prisma.termin.findFirst({
    where: { isHaussitzung: true, date: null },
    include: { responsibleWg: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const lastDone = await prisma.termin.findFirst({
    where: { isHaussitzung: true, date: { not: null } },
    include: { responsibleWg: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  });

  return {
    rotation: rotation.map((r) => ({
      wgId: r.wgId,
      wgName: r.wg.name,
      position: r.position,
    })),
    nextResponsible: placeholder?.responsibleWg ?? null,
    placeholderTerminId: placeholder?.id ?? null,
    lastResponsible: lastDone?.responsibleWg ?? null,
    lastDate: lastDone?.date ?? null,
  };
}
