import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";

interface CreateBody {
  name?: string;
  parentIds?: string[];
}

// POST /api/meine-wg/[slug]/kochplan/kinder — Kind anlegen
export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const body = (await req.json().catch(() => null)) as CreateBody | null;
  const name = (body?.name ?? "").trim().slice(0, 50);
  if (!name) {
    return NextResponse.json({ error: "Name fehlt" }, { status: 400 });
  }

  const candidateIds = Array.isArray(body?.parentIds)
    ? body.parentIds.filter((x) => typeof x === "string")
    : [];
  let parentIds: string[] = [];
  if (candidateIds.length > 0) {
    const validParents = await prisma.user.findMany({
      where: {
        id: { in: candidateIds },
        room: { wgId: access.wg.id },
      },
      select: { id: true },
    });
    parentIds = validParents.map((p) => p.id);
  }

  const k = await prisma.wgKochKind.create({
    data: { wgId: access.wg.id, name, parentIds },
  });
  return NextResponse.json({ id: k.id });
}
