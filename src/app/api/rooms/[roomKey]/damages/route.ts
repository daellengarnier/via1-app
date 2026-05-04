import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeDamage } from "@/lib/damages-serialize";

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
      reportedBy: true,
      feedbacks: { orderBy: { createdAt: "asc" }, include: { author: true } },
    },
  });
  return NextResponse.json(damages.map(serializeDamage));
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
    title?: unknown;
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
      location: params.roomKey,
      title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : description.slice(0, 60),
      description,
      severity,
      reportedById: session.user.id,
    },
    include: {
      reportedBy: true,
      feedbacks: { orderBy: { createdAt: "asc" }, include: { author: true } },
    },
  });

  return NextResponse.json(serializeDamage(created));
}
