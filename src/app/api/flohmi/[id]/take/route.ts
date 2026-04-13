import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/flohmi/[id]/take — aktueller User markiert das Inserat als
// genommen
export async function POST(
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
  if (inserat.takenById) {
    return NextResponse.json(
      { error: "Bereits genommen" },
      { status: 409 }
    );
  }

  const updated = await prisma.flohmiInserat.update({
    where: { id: params.id },
    data: {
      takenById: session.user.id,
      takenAt: new Date(),
    },
    include: {
      takenBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    takenBy: updated.takenBy?.name ?? null,
    takenById: updated.takenBy?.id ?? null,
    takenAt: updated.takenAt?.toISOString().split("T")[0] ?? null,
  });
}
