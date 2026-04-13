import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/termine/[id]/comments/[cid] — eigener Kommentar oder Admin
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; cid: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const c = await prisma.terminComment.findUnique({
    where: { id: params.cid },
  });
  if (!c || c.terminId !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = c.authorId === session.user.id;
  const isAdmin = (session.user.roles || []).includes("ADMIN");
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.terminComment.delete({ where: { id: params.cid } });
  return NextResponse.json({ ok: true });
}
