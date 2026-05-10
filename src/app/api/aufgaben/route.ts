import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeAufgabe } from "@/lib/aufgaben-serialize";
import { notify } from "@/lib/notify";

// GET /api/aufgaben
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const aufgaben = await prisma.aufgabe.findMany({
    orderBy: [{ done: "asc" }, { createdAt: "desc" }],
    include: {
      createdBy: true,
      activeWorkers: { include: { user: true } },
      subTodos: true,
      images: true,
    },
  });

  return NextResponse.json(aufgaben.map(serializeAufgabe));
}

// POST /api/aufgaben
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    title?: unknown;
    description?: unknown;
    location?: unknown;
    pin?: unknown;
    assignee?: unknown;
    subTodos?: unknown;
    images?: unknown;
  };
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "title erforderlich" }, { status: 400 });
  }

  const description =
    typeof body.description === "string" ? body.description : "";
  const location = typeof body.location === "string" ? body.location : "";
  const assignee =
    typeof body.assignee === "string" && body.assignee.trim() !== ""
      ? body.assignee.trim()
      : null;

  let pinLat: number | null = null;
  let pinLng: number | null = null;
  if (
    body.pin &&
    typeof body.pin === "object" &&
    "lat" in body.pin &&
    "lng" in body.pin
  ) {
    const p = body.pin as { lat: unknown; lng: unknown };
    if (typeof p.lat === "number" && typeof p.lng === "number") {
      pinLat = p.lat;
      pinLng = p.lng;
    }
  }

  const subTodoTitles = Array.isArray(body.subTodos)
    ? body.subTodos
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim())
        .filter((t) => t !== "")
    : [];

  const imagesInput = Array.isArray(body.images)
    ? body.images
        .filter((x): x is string => typeof x === "string")
        .filter((x) => x.startsWith("data:image/"))
        .slice(0, 8)
    : [];

  const created = await prisma.aufgabe.create({
    data: {
      title,
      description,
      location,
      assignee,
      pinLat,
      pinLng,
      createdById: session.user.id,
      subTodos:
        subTodoTitles.length > 0
          ? {
              create: subTodoTitles.map((title, i) => ({
                title,
                position: i,
              })),
            }
          : undefined,
      images:
        imagesInput.length > 0
          ? {
              create: imagesInput.map((data, i) => ({ data, position: i })),
            }
          : undefined,
    },
    include: {
      createdBy: true,
      activeWorkers: { include: { user: true } },
      subTodos: true,
      images: true,
    },
  });

  notify({
    kind: "AUFGABE_NEW",
    title: `Neue Aufgabe: ${title}`,
    body: description || location || undefined,
    link: "/aufgaben",
    audience: "all",
    excludeUserId: session.user.id,
  }).catch((e) => console.error("notify", e));

  return NextResponse.json(serializeAufgabe(created));
}
