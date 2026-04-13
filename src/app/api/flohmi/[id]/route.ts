import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/flohmi/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const inserat = await prisma.flohmiInserat.findUnique({
    where: { id: params.id },
  });
  if (!inserat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = inserat.createdById === session.user.id;
  const isAdmin = (session.user.roles || []).includes("ADMIN");
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.flohmiInserat.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
