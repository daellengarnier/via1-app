import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/drohne/complaint/[id]/like — toggled das "Anschliessen"
// (Like) auf eine Drohnen-Beschwerde. Pro (Beschwerde, User) ein Like.
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const complaintId = params.id;
  const existing = await prisma.droneComplaintLike.findUnique({
    where: { complaintId_userId: { complaintId, userId: session.user.id } },
  });

  if (existing) {
    await prisma.droneComplaintLike.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true, liked: false });
  }

  await prisma.droneComplaintLike.create({
    data: { complaintId, userId: session.user.id },
  });
  return NextResponse.json({ ok: true, liked: true });
}
