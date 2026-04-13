import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

function toDateOnly(d: Date): string {
  return d.toISOString().split("T")[0]!;
}

// GET /api/flohmi — alle (noch nicht zu lange) verfuegbaren + genommenen
// Inserate. Genommene Inserate verschwinden 2 Tage nach takenAt.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const inserate = await prisma.flohmiInserat.findMany({
    where: {
      OR: [{ takenAt: null }, { takenAt: { gte: twoDaysAgo } }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true } },
      takenBy: { select: { id: true, name: true } },
      images: { orderBy: { order: "asc" } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });

  return NextResponse.json(
    inserate.map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description,
      images: i.images.map((img) => img.data),
      createdBy: i.createdBy.name,
      createdById: i.createdBy.id,
      createdAt: toDateOnly(i.createdAt),
      takenBy: i.takenBy?.name ?? null,
      takenById: i.takenBy?.id ?? null,
      takenAt: i.takenAt ? toDateOnly(i.takenAt) : null,
      comments: i.comments.map((c) => ({
        id: c.id,
        author: c.author.name,
        authorId: c.author.id,
        text: c.text,
        date: toDateOnly(c.createdAt),
      })),
    }))
  );
}

// POST /api/flohmi
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    title?: unknown;
    description?: unknown;
    images?: unknown;
  };
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "title erforderlich" }, { status: 400 });
  }
  const description =
    typeof body.description === "string" ? body.description : "";

  const imagesInput = Array.isArray(body.images)
    ? (body.images as unknown[]).filter((x): x is string => typeof x === "string")
    : [];

  // Limit: Max 8 Bilder, jedes max ~500 KB Base64
  if (imagesInput.length > 8) {
    return NextResponse.json(
      { error: "Max. 8 Bilder pro Inserat" },
      { status: 400 }
    );
  }
  for (const img of imagesInput) {
    if (img.length > 700_000) {
      return NextResponse.json(
        { error: "Bild zu gross (max ~500KB pro Bild)" },
        { status: 400 }
      );
    }
  }

  const created = await prisma.flohmiInserat.create({
    data: {
      title,
      description,
      image: imagesInput[0] ?? null,
      createdById: session.user.id,
      images: {
        create: imagesInput.map((data, order) => ({ data, order })),
      },
    },
    include: {
      createdBy: { select: { id: true, name: true } },
      images: { orderBy: { order: "asc" } },
    },
  });

  notify({
    kind: "FLOHMI_NEW",
    title: `Neu im Flohmi: ${title}`,
    body: description || `von ${created.createdBy.name}`,
    link: "/flohmi",
    audience: "all",
    excludeUserId: session.user.id,
  }).catch((e) => console.error("notify", e));

  return NextResponse.json({
    id: created.id,
    title: created.title,
    description: created.description,
    images: created.images.map((img) => img.data),
    createdBy: created.createdBy.name,
    createdById: created.createdBy.id,
    createdAt: toDateOnly(created.createdAt),
    takenBy: null,
    takenById: null,
    takenAt: null,
    comments: [],
  });
}
