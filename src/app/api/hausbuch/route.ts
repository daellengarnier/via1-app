import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/hausbuch
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const articles = await prisma.hausbuchArticle.findMany({
    orderBy: [{ category: "asc" }, { title: "asc" }],
    include: {
      updatedBy: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(
    articles.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      category: a.category,
      owner: a.owner,
      createdBy: a.createdBy?.name ?? null,
      createdById: a.createdBy?.id ?? null,
      updatedBy: a.updatedBy.name,
      updatedAt: a.updatedAt.toISOString(),
    }))
  );
}

// POST /api/hausbuch
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    title?: unknown;
    content?: unknown;
    category?: unknown;
    owner?: unknown;
  };
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content : "";
  const category =
    typeof body.category === "string" ? body.category.trim() : "";

  if (!title || !content || !category) {
    return NextResponse.json(
      { error: "title, content, category erforderlich" },
      { status: 400 }
    );
  }

  // Owner wird automatisch auf den Ersteller gesetzt (ausser Admin
  // gibt explizit einen abweichenden Owner mit).
  const isAdmin = (session.user.roles || []).includes("ADMIN");
  let owner =
    typeof body.owner === "string" && body.owner.trim() !== ""
      ? body.owner.trim()
      : "";
  if (!owner || !isAdmin) {
    // Non-admin kann den Owner nicht aendern — es ist immer der Ersteller
    owner = session.user.name ?? "";
  }

  const created = await prisma.hausbuchArticle.create({
    data: {
      title,
      content,
      category,
      owner,
      createdById: session.user.id,
      updatedById: session.user.id,
    },
    include: {
      updatedBy: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    id: created.id,
    title: created.title,
    content: created.content,
    category: created.category,
    owner: created.owner,
    createdBy: created.createdBy?.name ?? null,
    createdById: created.createdBy?.id ?? null,
    updatedBy: created.updatedBy.name,
    updatedAt: created.updatedAt.toISOString(),
  });
}
