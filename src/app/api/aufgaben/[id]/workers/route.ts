import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeAufgabe } from "@/lib/aufgaben-serialize";
import { notify } from "@/lib/notify";

// POST /api/aufgaben/[id]/workers — aktueller User startet / joint
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const aufgabe = await prisma.aufgabe.findUnique({ where: { id: params.id } });
  if (!aufgabe) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (aufgabe.done) {
    return NextResponse.json(
      { error: "Aufgabe ist bereits erledigt" },
      { status: 400 }
    );
  }

  // Pruefen ob die Aufgabe schon Worker hat (dann ist's ein Join,
  // kein "angefangen")
  const existingWorkers = await prisma.aufgabeActiveWorker.count({
    where: { aufgabeId: params.id },
  });

  await prisma.aufgabeActiveWorker.upsert({
    where: {
      aufgabeId_userId: {
        aufgabeId: params.id,
        userId: session.user.id,
      },
    },
    create: {
      aufgabeId: params.id,
      userId: session.user.id,
    },
    update: {},
  });

  const full = await prisma.aufgabe.findUnique({
    where: { id: params.id },
    include: {
      createdBy: true,
      activeWorkers: { include: { user: true } },
      subTodos: true,
    },
  });
  if (!full) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Nur beim ersten Worker eine "angefangen"-Notification senden
  if (existingWorkers === 0) {
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });
    notify({
      kind: "AUFGABE_STARTED",
      title: `${me?.name ?? "Jemand"} packt eine Aufgabe an`,
      body: aufgabe.title,
      link: "/aufgaben",
      audience: "all",
      excludeUserId: session.user.id,
    }).catch((e) => console.error("notify", e));
  }

  return NextResponse.json(serializeAufgabe(full));
}

// DELETE /api/aufgaben/[id]/workers — aktueller User steigt aus
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.aufgabeActiveWorker.deleteMany({
    where: {
      aufgabeId: params.id,
      userId: session.user.id,
    },
  });

  const full = await prisma.aufgabe.findUnique({
    where: { id: params.id },
    include: {
      createdBy: true,
      activeWorkers: { include: { user: true } },
      subTodos: true,
    },
  });
  if (!full) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(serializeAufgabe(full));
}
