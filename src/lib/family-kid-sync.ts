import { prisma } from "@/lib/prisma";

// Spiegelt einen FamilyKid in WgKochKind-Eintraegen — einen pro WG der
// Eltern. Damit kann ein FamilyKid (z.B. Nori) im WG-Kochplan vom
// Elternteil direkt mit-angemeldet werden, ohne dass Eltern doppelt
// pflegen muessen. Idempotent: bestehende WgKochKind mit familyKidId
// werden aktualisiert oder geloescht, neue erzeugt.
export async function syncFamilyKidToWgKochKind(
  familyKidId: string
): Promise<void> {
  const kid = await prisma.familyKid.findUnique({
    where: { id: familyKidId },
    include: {
      parents: { select: { id: true, room: { select: { wgId: true } } } },
    },
  });
  if (!kid) {
    // Geloescht: alle gespiegelten WgKochKind entfernen
    await prisma.wgKochKind.deleteMany({ where: { familyKidId } });
    return;
  }

  // WG-IDs der Eltern (dedupliziert, ohne nulls)
  const wgIds = Array.from(
    new Set(
      kid.parents
        .map((p) => p.room?.wgId)
        .filter((id): id is string => typeof id === "string")
    )
  );
  const parentIds = kid.parents.map((p) => p.id);

  // Bestehende Spiegel-WgKochKinds finden
  const existing = await prisma.wgKochKind.findMany({
    where: { familyKidId },
    select: { id: true, wgId: true },
  });
  const existingByWg = new Map(existing.map((e) => [e.wgId, e.id]));

  // Entfernen wo Eltern nicht mehr in der WG sind
  const toDelete = existing
    .filter((e) => !wgIds.includes(e.wgId))
    .map((e) => e.id);
  if (toDelete.length > 0) {
    await prisma.wgKochKind.deleteMany({ where: { id: { in: toDelete } } });
  }

  // Pro WG: upsert
  await Promise.all(
    wgIds.map((wgId) => {
      const existingId = existingByWg.get(wgId);
      if (existingId) {
        return prisma.wgKochKind.update({
          where: { id: existingId },
          data: { name: kid.name, parentIds },
        });
      }
      return prisma.wgKochKind.create({
        data: {
          wgId,
          name: kid.name,
          parentIds,
          familyKidId: kid.id,
        },
      });
    })
  );
}

// Beim Loeschen eines FamilyKid: alle Spiegel-WgKochKinds entfernen.
export async function removeWgKochKindMirrors(
  familyKidId: string
): Promise<void> {
  await prisma.wgKochKind.deleteMany({ where: { familyKidId } });
}
