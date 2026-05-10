import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";

interface TemplateBody {
  title?: string;
  description?: string | null;
  defaultTime?: string | null;
}

// POST /api/meine-wg/[slug]/kochplan/templates — neues Template anlegen
export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const body = (await req.json().catch(() => null)) as TemplateBody | null;
  const title = (body?.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Titel fehlt" }, { status: 400 });
  }
  const description = body?.description?.trim() || null;
  const defaultTime = body?.defaultTime ? body.defaultTime.trim().slice(0, 5) : null;

  const t = await prisma.wgKochTemplate.create({
    data: {
      wgId: access.wg.id,
      title,
      description,
      defaultTime,
    },
  });

  return NextResponse.json({
    id: t.id,
    title: t.title,
    description: t.description,
    defaultTime: t.defaultTime,
  });
}
