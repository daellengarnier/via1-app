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
    include: { updatedBy: { select: { id: true, name: true } } },
  });

  return NextResponse.json(
    articles.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      category: a.category,
      owner: a.owner,
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
  const owner = typeof body.owner === "string" ? body.owner.trim() : "";

  if (!title || !content || !category || !owner) {
    return NextResponse.json(
      { error: "title, content, category, owner erforderlich" },
      { status: 400 }
    );
  }

  const created = await prisma.hausbuchArticle.create({
    data: {
      title,
      content,
      category,
      owner,
      updatedById: session.user.id,
    },
    include: { updatedBy: { select: { id: true, name: true } } },
  });

  return NextResponse.json({
    id: created.id,
    title: created.title,
    content: created.content,
    category: created.category,
    owner: created.owner,
    updatedBy: created.updatedBy.name,
    updatedAt: created.updatedAt.toISOString(),
  });
}
