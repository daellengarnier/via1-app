import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeSubTodo } from "@/lib/aufgaben-serialize";

// GET /api/aufgaben/[id]/subtodos
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subs = await prisma.aufgabeSubTodo.findMany({
    where: { aufgabeId: params.id },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(subs.map(serializeSubTodo));
}

// POST /api/aufgaben/[id]/subtodos  body: { title: string }
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const aufgabe = await prisma.aufgabe.findUnique({ where: { id: params.id } });
  if (!aufgabe) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json()) as { title?: unknown };
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "title erforderlich" }, { status: 400 });
  }

  const last = await prisma.aufgabeSubTodo.findFirst({
    where: { aufgabeId: params.id },
    orderBy: { position: "desc" },
  });
  const position = (last?.position ?? -1) + 1;

  const created = await prisma.aufgabeSubTodo.create({
    data: { aufgabeId: params.id, title, position },
  });
  return NextResponse.json(serializeSubTodo(created));
}
