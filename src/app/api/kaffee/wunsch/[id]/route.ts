import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/kaffee/wunsch/[id] — Ersteller oder Admin.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wunsch = await prisma.kaffeeWunsch.findUnique({
    where: { id: params.id },
    select: { createdById: true },
  });
  if (!wunsch) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const isAdmin = (session.user.roles ?? []).includes("ADMIN");
  if (wunsch.createdById !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Nicht erlaubt" }, { status: 403 });
  }

  await prisma.kaffeeWunsch.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
