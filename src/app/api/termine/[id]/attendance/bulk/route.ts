import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/termine/[id]/attendance/bulk
// Body: { userId: string, status: "going" | "not-going" | null }
// Damit kann man (auch fremde) User fuer diesen Termin markieren,
// wie es die Anwesenheits-Modal des Detail-Views braucht.
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const termin = await prisma.termin.findUnique({ where: { id: params.id } });
  if (!termin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json()) as {
    userId?: unknown;
    status?: unknown;
  };
  const userId = typeof body.userId === "string" ? body.userId : "";
  const status = body.status;
  if (!userId) {
    return NextResponse.json({ error: "userId erforderlich" }, { status: 400 });
  }

  if (status === null) {
    await prisma.attendance.deleteMany({
      where: { terminId: params.id, userId },
    });
    return NextResponse.json({ ok: true });
  }

  if (status !== "going" && status !== "not-going") {
    return NextResponse.json(
      { error: "status muss going/not-going/null sein" },
      { status: 400 }
    );
  }

  const dbStatus = status === "going" ? "GOING" : "NOT_GOING";
  await prisma.attendance.upsert({
    where: { terminId_userId: { terminId: params.id, userId } },
    create: { terminId: params.id, userId, status: dbStatus },
    update: { status: dbStatus },
  });
  return NextResponse.json({ ok: true });
}
