import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/termine/[id]/attendance — eigener Anwesenheits-Status setzen
// Body: { status: "going" | "not-going" | null }
export async function PUT(
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

  const body = (await req.json()) as { status?: unknown };
  const status = body.status;

  if (status === null) {
    // Eintrag loeschen
    await prisma.attendance.deleteMany({
      where: { terminId: params.id, userId: session.user.id },
    });
    return NextResponse.json({ status: null });
  }

  if (status !== "going" && status !== "not-going") {
    return NextResponse.json(
      { error: "status muss going/not-going/null sein" },
      { status: 400 }
    );
  }

  const dbStatus = status === "going" ? "GOING" : "NOT_GOING";
  await prisma.attendance.upsert({
    where: {
      terminId_userId: { terminId: params.id, userId: session.user.id },
    },
    create: {
      terminId: params.id,
      userId: session.user.id,
      status: dbStatus,
    },
    update: { status: dbStatus },
  });

  return NextResponse.json({ status });
}

// DELETE /api/termine/[id]/attendance — Admin: User-Attendance entfernen
// Body: { userId: string }
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.roles?.includes("ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await req.json()) as { userId?: string };
  if (!body.userId) {
    return NextResponse.json({ error: "userId erforderlich" }, { status: 400 });
  }
  await prisma.attendance.deleteMany({
    where: { terminId: params.id, userId: body.userId },
  });
  return NextResponse.json({ ok: true });
}
