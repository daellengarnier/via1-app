import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeSubTodo } from "@/lib/aufgaben-serialize";

// PATCH /api/aufgaben/[id]/subtodos/[subId]  body: { title?, done? }
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; subId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await prisma.aufgabeSubTodo.findUnique({
    where: { id: params.subId },
  });
  if (!sub || sub.aufgabeId !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json()) as { title?: unknown; done?: unknown };
  const data: { title?: string; done?: boolean } = {};
  if (typeof body.title === "string" && body.title.trim() !== "") {
    data.title = body.title.trim();
  }
  if (typeof body.done === "boolean") data.done = body.done;

  const updated = await prisma.aufgabeSubTodo.update({
    where: { id: params.subId },
    data,
  });
  return NextResponse.json(serializeSubTodo(updated));
}

// DELETE /api/aufgaben/[id]/subtodos/[subId]
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; subId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await prisma.aufgabeSubTodo.findUnique({
    where: { id: params.subId },
  });
  if (!sub || sub.aufgabeId !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.aufgabeSubTodo.delete({ where: { id: params.subId } });
  return NextResponse.json({ ok: true });
}
