import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/rooms/[roomKey]/damages — alle Schaeden fuer dieses Zimmer
export async function GET(
  _req: Request,
  { params }: { params: { roomKey: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const damages = await prisma.roomDamage.findMany({
    where: { roomKey: params.roomKey },
    orderBy: [{ resolvedAt: "asc" }, { reportedAt: "desc" }],
    include: {
      reportedBy: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(
    damages.map((d) => ({
      id: d.id,
      description: d.description,
      severity: d.severity,
      reportedAt: d.reportedAt.toISOString(),
      resolvedAt: d.resolvedAt?.toISOString() ?? null,
      reportedBy: d.reportedBy?.name ?? null,
      reportedById: d.reportedById,
    }))
  );
}

// POST /api/rooms/[roomKey]/damages — neuen Schaden melden
export async function POST(
  req: Request,
  { params }: { params: { roomKey: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as {
    description?: unknown;
    severity?: unknown;
  };
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  if (!description) {
    return NextResponse.json(
      { error: "Beschreibung fehlt" },
      { status: 400 }
    );
  }
  const severity =
    body.severity === "klein" ||
    body.severity === "mittel" ||
    body.severity === "gross"
      ? body.severity
      : "klein";

  const created = await prisma.roomDamage.create({
    data: {
      roomKey: params.roomKey,
      description,
      severity,
      reportedById: session.user.id,
    },
    include: {
      reportedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    id: created.id,
    description: created.description,
    severity: created.severity,
    reportedAt: created.reportedAt.toISOString(),
    resolvedAt: null,
    reportedBy: created.reportedBy?.name ?? null,
    reportedById: created.reportedById,
  });
}
