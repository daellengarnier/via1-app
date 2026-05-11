import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  removeWgKochKindMirrors,
  syncFamilyKidToWgKochKind,
} from "@/lib/family-kid-sync";
import type { Diet } from "@prisma/client";

const VALID_DIETS: Diet[] = ["FLEISCH", "VEGI", "VEGAN"];

interface PatchBody {
  name?: unknown;
  diet?: unknown;
  allergies?: unknown;
  parentIds?: unknown; // wenn gesetzt: komplette neue Eltern-Liste
}

async function loadOwn(kidId: string, userId: string) {
  const kid = await prisma.familyKid.findUnique({
    where: { id: kidId },
    include: { parents: { select: { id: true } } },
  });
  if (!kid) return null;
  if (!kid.parents.some((p) => p.id === userId)) return "forbidden" as const;
  return kid;
}

// PATCH /api/family-kids/[id] — nur Eltern duerfen aendern.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const kid = await loadOwn(params.id, session.user.id);
  if (!kid) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  if (kid === "forbidden") {
    return NextResponse.json({ error: "Nicht erlaubt" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as PatchBody | null;
  if (!body) {
    return NextResponse.json({ error: "Ungueltiger Body" }, { status: 400 });
  }

  const data: { name?: string; diet?: Diet; allergies?: string } = {};
  if (typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim().slice(0, 50);
  }
  if (
    typeof body.diet === "string" &&
    (VALID_DIETS as string[]).includes(body.diet)
  ) {
    data.diet = body.diet as Diet;
  }
  if (typeof body.allergies === "string") {
    data.allergies = body.allergies.trim().slice(0, 200);
  }

  // Optional: komplette Eltern-Liste ersetzen. Der aktuelle User muss
  // mindestens einer der neuen Eltern sein, sonst sperrt er sich selbst aus.
  let parentSet: { set: Array<{ id: string }> } | undefined;
  if (Array.isArray(body.parentIds)) {
    const ids = body.parentIds.filter((x): x is string => typeof x === "string");
    const idSet = new Set<string>([session.user.id, ...ids]);
    const valid = await prisma.user.findMany({
      where: { id: { in: Array.from(idSet) } },
      select: { id: true },
    });
    parentSet = { set: valid.map((u) => ({ id: u.id })) };
  }

  await prisma.familyKid.update({
    where: { id: kid.id },
    data: {
      ...data,
      ...(parentSet ? { parents: parentSet } : {}),
    },
  });

  // WgKochKind-Mirrors aktualisieren (Name + Eltern-WGs)
  await syncFamilyKidToWgKochKind(kid.id).catch((err) => {
    console.error("syncFamilyKidToWgKochKind nach PATCH fehlgeschlagen", err);
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/family-kids/[id] — nur Eltern duerfen loeschen.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const kid = await loadOwn(params.id, session.user.id);
  if (!kid) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  if (kid === "forbidden") {
    return NextResponse.json({ error: "Nicht erlaubt" }, { status: 403 });
  }

  // WgKochKind-Mirrors zuerst entfernen (FK ist nullable, also nicht
  // strikt noetig, aber sauberer)
  await removeWgKochKindMirrors(kid.id).catch((err) => {
    console.error("removeWgKochKindMirrors fehlgeschlagen", err);
  });

  await prisma.familyKid.delete({ where: { id: kid.id } });
  return NextResponse.json({ ok: true });
}
