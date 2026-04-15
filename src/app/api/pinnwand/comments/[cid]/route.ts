import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/pinnwand/comments/[cid]
export async function DELETE(
  _req: Request,
  { params }: { params: { cid: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const comment = await prisma.pinnwandComment.findUnique({
    where: { id: params.cid },
  });
  if (!comment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const isAdmin = (session.user.roles || []).includes("ADMIN");
  if (comment.authorId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.pinnwandComment.delete({ where: { id: params.cid } });
  return NextResponse.json({ ok: true });
}
