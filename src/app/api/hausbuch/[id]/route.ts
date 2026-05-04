import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ImageInput = { data?: unknown; caption?: unknown; stepId?: unknown };
type LinkInput = { toId?: unknown; label?: unknown };

function normalizeImages(input: unknown) {
  if (!Array.isArray(input)) return [];
  return input
    .filter((x): x is ImageInput => !!x && typeof x === "object")
    .map((img, order) => ({
      data: typeof img.data === "string" ? img.data : "",
      caption: typeof img.caption === "string" ? img.caption.trim() : null,
      stepId: typeof img.stepId === "string" ? img.stepId : null,
      order,
    }))
    .filter((img) => img.data.startsWith("data:image/"))
    .slice(0, 12);
}

function normalizeLinks(input: unknown, selfId: string) {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  return input
    .filter((x): x is LinkInput => !!x && typeof x === "object")
    .map((link) => ({
      toId: typeof link.toId === "string" ? link.toId : "",
      label: typeof link.label === "string" ? link.label.trim() : null,
    }))
    .filter((link) => {
      if (!link.toId || link.toId === selfId || seen.has(link.toId)) return false;
      seen.add(link.toId);
      return true;
    })
    .slice(0, 20);
}

function serializeArticle(a: Prisma.HausbuchArticleGetPayload<{
  include: {
    updatedBy: { select: { id: true; name: true } };
    createdBy: { select: { id: true; name: true } };
    images: true;
    linksFrom: { include: { to: { select: { id: true; title: true; category: true; type: true } } } };
    linksTo: { include: { from: { select: { id: true; title: true; category: true; type: true } } } };
  };
}>) {
  return {
    id: a.id,
    title: a.title,
    summary: a.summary,
    content: a.content,
    structured: a.structured,
    type: a.type,
    category: a.category,
    section: a.section,
    tags: a.tags,
    pinned: a.pinned,
    status: a.status,
    owner: a.owner,
    images: a.images
      .sort((x, y) => x.order - y.order)
      .map((img) => ({ id: img.id, data: img.data, caption: img.caption, stepId: img.stepId, order: img.order })),
    links: a.linksFrom.map((link) => ({
      id: link.id,
      toId: link.toId,
      label: link.label,
      title: link.to.title,
      category: link.to.category,
      type: link.to.type,
    })),
    backlinks: a.linksTo.map((link) => ({
      id: link.id,
      fromId: link.fromId,
      title: link.from.title,
      category: link.from.category,
      type: link.from.type,
    })),
    createdBy: a.createdBy?.name ?? null,
    createdById: a.createdBy?.id ?? null,
    updatedBy: a.updatedBy.name,
    updatedAt: a.updatedAt.toISOString(),
  };
}

// PATCH /api/hausbuch/[id]
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.hausbuchArticle.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = (session.user.roles || []).includes("ADMIN");
  const isCreator = existing.createdById === session.user.id;
  if (!isAdmin && !isCreator) {
    return NextResponse.json({ error: "Nur eigene Eintraege koennen bearbeitet werden" }, { status: 403 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const data: Prisma.HausbuchArticleUpdateInput = { updatedBy: { connect: { id: session.user.id } } };
  if (typeof body.title === "string" && body.title.trim() !== "") data.title = body.title.trim();
  if (typeof body.summary === "string") data.summary = body.summary.trim() || null;
  if (typeof body.content === "string") data.content = body.content;
  if (body.structured !== undefined) data.structured = body.structured as Prisma.InputJsonValue;
  if (typeof body.type === "string" && body.type.trim() !== "") data.type = body.type.trim().toUpperCase();
  if (typeof body.category === "string" && body.category.trim() !== "") data.category = body.category.trim();
  if (typeof body.section === "string") data.section = body.section.trim() || null;
  if (Array.isArray(body.tags)) {
    data.tags = body.tags.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean).slice(0, 20);
  }
  if (isAdmin && typeof body.pinned === "boolean") data.pinned = body.pinned;
  if (typeof body.status === "string" && body.status.trim() !== "") data.status = body.status.trim();
  if (isAdmin && typeof body.owner === "string" && body.owner.trim() !== "") data.owner = body.owner.trim();

  const images = normalizeImages(body.images);
  const links = normalizeLinks(body.links, params.id);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.hausbuchImage.deleteMany({ where: { articleId: params.id } });
    if (images.length > 0) {
      await tx.hausbuchImage.createMany({ data: images.map((img) => ({ ...img, articleId: params.id })) });
    }
    await tx.hausbuchArticleLink.deleteMany({ where: { fromId: params.id } });
    if (links.length > 0) {
      await tx.hausbuchArticleLink.createMany({
        data: links.map((link) => ({ fromId: params.id, toId: link.toId, label: link.label })),
        skipDuplicates: true,
      });
    }
    return tx.hausbuchArticle.update({
      where: { id: params.id },
      data,
      include: {
        updatedBy: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        images: true,
        linksFrom: { include: { to: { select: { id: true, title: true, category: true, type: true } } } },
        linksTo: { include: { from: { select: { id: true, title: true, category: true, type: true } } } },
      },
    });
  });

  return NextResponse.json(serializeArticle(updated));
}

// DELETE /api/hausbuch/[id] — Eigene Artikel oder Admin
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await prisma.hausbuchArticle.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const isAdmin = (session.user.roles || []).includes("ADMIN");
  const isCreator = existing.createdById === session.user.id;
  if (!isAdmin && !isCreator) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.hausbuchArticle.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
