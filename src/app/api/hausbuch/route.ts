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

function normalizeLinks(input: unknown, selfId?: string) {
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

function isPlainJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return value as Prisma.InputJsonValue;
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
      .map((img) => ({
        id: img.id,
        data: img.data,
        caption: img.caption,
        stepId: img.stepId,
        order: img.order,
      })),
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

// GET /api/hausbuch
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const articles = await prisma.hausbuchArticle.findMany({
    include: {
      updatedBy: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      images: true,
      linksFrom: {
        include: { to: { select: { id: true, title: true, category: true, type: true } } },
      },
      linksTo: {
        include: { from: { select: { id: true, title: true, category: true, type: true } } },
      },
    },
  });

  articles.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return a.title.localeCompare(b.title, "de-CH", { sensitivity: "base" });
  });

  return NextResponse.json(articles.map(serializeArticle));
}

// POST /api/hausbuch
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const type = typeof body.type === "string" ? body.type.trim().toUpperCase() : "INFO";
  const summary = typeof body.summary === "string" ? body.summary.trim() : null;
  const section = typeof body.section === "string" ? body.section.trim() || null : null;
  const tags = Array.isArray(body.tags)
    ? body.tags.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean).slice(0, 20)
    : [];
  const images = normalizeImages(body.images);
  const links = normalizeLinks(body.links);

  if (!title || !content || !category) {
    return NextResponse.json(
      { error: "title, content, category erforderlich" },
      { status: 400 }
    );
  }

  const isAdmin = (session.user.roles || []).includes("ADMIN");
  let owner = typeof body.owner === "string" && body.owner.trim() !== "" ? body.owner.trim() : "";
  if (!owner || !isAdmin) owner = session.user.name ?? "";

  const created = await prisma.hausbuchArticle.create({
    data: {
      title,
      summary,
      content,
      structured: isPlainJson(body.structured),
      type,
      category,
      section,
      tags,
      pinned: isAdmin && typeof body.pinned === "boolean" ? body.pinned : false,
      status: typeof body.status === "string" ? body.status : "PUBLISHED",
      owner,
      createdById: session.user.id,
      updatedById: session.user.id,
      images: { create: images },
      linksFrom: { create: links.map((link) => ({ toId: link.toId, label: link.label })) },
    },
    include: {
      updatedBy: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      images: true,
      linksFrom: {
        include: { to: { select: { id: true, title: true, category: true, type: true } } },
      },
      linksTo: {
        include: { from: { select: { id: true, title: true, category: true, type: true } } },
      },
    },
  });

  return NextResponse.json(serializeArticle(created));
}
