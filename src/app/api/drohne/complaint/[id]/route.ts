import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/drohne/complaint/[id] — Beschwerde loeschen.
// Nur der Author oder ein Admin darf loeschen.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const complaint = await prisma.droneComplaint.findUnique({
    where: { id: params.id },
    select: { id: true, authorId: true },
  });
  if (!complaint) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const isAdmin = (session.user.roles ?? []).includes("ADMIN");
  if (complaint.authorId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Nicht erlaubt" }, { status: 403 });
  }

  await prisma.droneComplaint.delete({ where: { id: complaint.id } });
  return NextResponse.json({ ok: true });
}
