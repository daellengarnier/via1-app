import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/termine/[id]/comments — neuer Kommentar
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const termin = await prisma.termin.findUnique({ where: { id: params.id } });
  if (!termin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json()) as { text?: unknown };
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "text erforderlich" }, { status: 400 });
  }
  if (text.length > 1000) {
    return NextResponse.json({ error: "text zu lang" }, { status: 400 });
  }

  const c = await prisma.terminComment.create({
    data: {
      terminId: params.id,
      authorId: session.user.id,
      text,
    },
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json({
    id: c.id,
    author: c.author.name,
    authorId: c.author.id,
    text: c.text,
    date: c.createdAt.toISOString().split("T")[0]!,
  });
}
