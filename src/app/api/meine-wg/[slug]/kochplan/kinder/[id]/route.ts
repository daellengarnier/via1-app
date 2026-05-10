import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess, wgMemberFilter } from "@/lib/wg-access";

interface PatchBody {
  name?: string;
  parentIds?: string[];
}

// PATCH /api/meine-wg/[slug]/kochplan/kinder/[id]
export async function PATCH(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const k = await prisma.wgKochKind.findUnique({ where: { id: params.id } });
  if (!k || k.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as PatchBody | null;
  if (!body) {
    return NextResponse.json({ error: "Ungueltiger Body" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim().slice(0, 50);
  }
  if (Array.isArray(body.parentIds)) {
    const candidate = body.parentIds.filter((x) => typeof x === "string");
    const validParents = await prisma.user.findMany({
      where: {
        AND: [
          { id: { in: candidate } },
          wgMemberFilter(access.wg.id),
        ],
      },
      select: { id: true },
    });
    data.parentIds = validParents.map((p) => p.id);
  }

  await prisma.wgKochKind.update({ where: { id: k.id }, data });
  return NextResponse.json({ ok: true });
}

// DELETE /api/meine-wg/[slug]/kochplan/kinder/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const k = await prisma.wgKochKind.findUnique({ where: { id: params.id } });
  if (!k || k.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  await prisma.wgKochKind.delete({ where: { id: k.id } });
  return NextResponse.json({ ok: true });
}
