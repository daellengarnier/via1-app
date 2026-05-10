import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";

interface SignupBody {
  adults?: number;
  kids?: number;
  guests?: number;
  notes?: string | null;
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

// PUT /api/meine-wg/[slug]/kochplan/eintraege/[id]/signup
// Erstellt oder aktualisiert die eigene Anmeldung.
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
  const adults = clampInt(body?.adults, 0, 20, 1);
  const kids = clampInt(body?.kids, 0, 20, 0);
  const guests = clampInt(body?.guests, 0, 20, 0);
  const notes =
    typeof body?.notes === "string" ? body.notes.trim().slice(0, 200) || null : null;

  if (adults + kids + guests === 0) {
    return NextResponse.json(
      { error: "Mindestens eine Person muss angemeldet sein." },
      { status: 400 }
    );
  }

  await prisma.wgKochSignup.upsert({
    where: {
      eintragId_userId: { eintragId: eintrag.id, userId: access.user.id },
    },
    create: {
      eintragId: eintrag.id,
      userId: access.user.id,
      adults,
      kids,
      guests,
      notes,
    },
    update: { adults, kids, guests, notes },
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/meine-wg/[slug]/kochplan/eintraege/[id]/signup
// Eigene Anmeldung loeschen.
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
