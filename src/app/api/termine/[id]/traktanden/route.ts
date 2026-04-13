import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/termine/[id]/traktanden — neues Traktandum
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

  const body = (await req.json()) as { title?: unknown };
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "title erforderlich" }, { status: 400 });
  }

  // Naechste Order-Nummer = max + 1
  const last = await prisma.traktandum.findFirst({
    where: { terminId: params.id },
    orderBy: { order: "desc" },
  });
  const nextOrder = (last?.order ?? -1) + 1;

  const traktandum = await prisma.traktandum.create({
    data: {
      terminId: params.id,
      title,
      order: nextOrder,
      createdById: session.user.id,
    },
    include: { createdBy: true },
  });

  return NextResponse.json({
    id: traktandum.id,
    title: traktandum.title,
    notes: traktandum.notes,
    order: traktandum.order,
    createdBy: traktandum.createdBy.name,
  });
}
