import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";

interface SignupBody {
  status?: "going" | "declined";
  childrenIds?: string[];
  guests?: number;
  notes?: string | null;
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

// PUT /api/meine-wg/[slug]/kochplan/eintraege/[id]/signup
// Bin-dabei oder Kann-nicht. Bei "going" optional Kinder + Gaeste.
export async function PUT(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const eintrag = await prisma.wgKochEintrag.findUnique({
    where: { id: params.id },
  });
  if (!eintrag || eintrag.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as SignupBody | null;
  const status = body?.status === "declined" ? "declined" : "going";

  let childrenIds: string[] = [];
  if (status === "going" && Array.isArray(body?.childrenIds)) {
    // Sanity-Check: Children muessen in dieser WG existieren und der User
    // muss als Parent eingetragen sein
    const validKinder = await prisma.wgKochKind.findMany({
      where: {
        wgId: access.wg.id,
        id: { in: body.childrenIds.filter((x) => typeof x === "string") },
      },
    });
    childrenIds = validKinder
      .filter((k) => k.parentIds.includes(access.user.id))
      .map((k) => k.id);
  }

  const guests =
    status === "going" ? clampInt(body?.guests, 0, 20, 0) : 0;
  const notes =
    typeof body?.notes === "string" ? body.notes.trim().slice(0, 200) || null : null;

  await prisma.wgKochSignup.upsert({
    where: {
      eintragId_userId: { eintragId: eintrag.id, userId: access.user.id },
    },
    create: {
      eintragId: eintrag.id,
      userId: access.user.id,
      status,
      childrenIds,
      guests,
      notes,
    },
    update: { status, childrenIds, guests, notes },
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/meine-wg/[slug]/kochplan/eintraege/[id]/signup
// Eigenen Status entfernen (zurueck zu "noch nicht geantwortet")
export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  await prisma.wgKochSignup.deleteMany({
    where: { eintragId: params.id, userId: access.user.id },
  });

  return NextResponse.json({ ok: true });
}
