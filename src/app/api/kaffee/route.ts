import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/kaffee — aktuellen Kaffee lesen
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const current = await prisma.kaffeeCurrent.findUnique({
    where: { id: "singleton" },
  });

  if (!current) {
    return NextResponse.json({
      name: "Unbekannt",
      herkunft: "",
      duftnotizen: "",
      fairtrade: false,
      changedBy: "",
      changedAt: null,
    });
  }

  return NextResponse.json({
    name: current.name,
    herkunft: current.herkunft,
    duftnotizen: current.duftnotizen,
    fairtrade: current.fairtrade,
    changedBy: current.changedBy,
    changedAt: current.changedAt.toISOString().split("T")[0],
  });
}

// PUT /api/kaffee — Kaffee wechseln
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    name?: unknown;
    herkunft?: unknown;
    duftnotizen?: unknown;
    fairtrade?: unknown;
  };

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name erforderlich" }, { status: 400 });
  }

  const updated = await prisma.kaffeeCurrent.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      name,
      herkunft: typeof body.herkunft === "string" ? body.herkunft : "",
      duftnotizen: typeof body.duftnotizen === "string" ? body.duftnotizen : "",
      fairtrade: body.fairtrade === true,
      changedBy: session.user.name ?? "",
      changedAt: new Date(),
    },
    update: {
      name,
      herkunft: typeof body.herkunft === "string" ? body.herkunft : "",
      duftnotizen: typeof body.duftnotizen === "string" ? body.duftnotizen : "",
      fairtrade: body.fairtrade === true,
      changedBy: session.user.name ?? "",
      changedAt: new Date(),
    },
  });

  return NextResponse.json({
    name: updated.name,
    herkunft: updated.herkunft,
    duftnotizen: updated.duftnotizen,
    fairtrade: updated.fairtrade,
    changedBy: updated.changedBy,
    changedAt: updated.changedAt.toISOString().split("T")[0],
  });
}
