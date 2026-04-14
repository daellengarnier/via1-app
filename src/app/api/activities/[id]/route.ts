import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/activities/[id] — eigene oder Admin
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const activity = await prisma.activity.findUnique({
    where: { id: params.id },
  });
  if (!activity) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const isAdmin = (session.user.roles || []).includes("ADMIN");
  if (activity.createdById !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.activity.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
