import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_KINDS = new Set(["liked", "want_to_try"]);

interface CreateBody {
  kaffeeName?: unknown;
  notes?: unknown;
  shopUrl?: unknown;
  kind?: unknown;
}

// GET /api/kaffee/wunsch — alle Wuensche neueste zuerst.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await prisma.kaffeeWunsch.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true, avatar: true } },
    },
  });

  return NextResponse.json(
    list.map((w) => ({
      id: w.id,
      kaffeeName: w.kaffeeName,
      notes: w.notes,
      shopUrl: w.shopUrl,
      kind: w.kind,
      createdAt: w.createdAt.toISOString(),
      createdBy: w.createdBy,
    }))
  );
}

// POST /api/kaffee/wunsch — neuer Wunsch.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as CreateBody | null;
  const kaffeeName =
    typeof body?.kaffeeName === "string"
      ? body.kaffeeName.trim().slice(0, 100)
      : "";
  if (!kaffeeName) {
    return NextResponse.json({ error: "kaffeeName fehlt" }, { status: 400 });
  }
  const notes =
    typeof body?.notes === "string" ? body.notes.trim().slice(0, 500) : "";
  const shopUrlRaw =
    typeof body?.shopUrl === "string" ? body.shopUrl.trim() : "";
  let shopUrl: string | null = null;
  if (shopUrlRaw) {
    // Nur http(s)-URLs akzeptieren — kein javascript:, data:, etc.
    try {
      const u = new URL(shopUrlRaw);
      if (u.protocol === "http:" || u.protocol === "https:") {
        shopUrl = shopUrlRaw.slice(0, 500);
      }
    } catch {
      // Ungueltige URL → null
    }
  }
  const kind =
    typeof body?.kind === "string" && VALID_KINDS.has(body.kind)
      ? body.kind
      : "want_to_try";

  const created = await prisma.kaffeeWunsch.create({
    data: {
      kaffeeName,
      notes,
      shopUrl,
      kind,
      createdById: session.user.id,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id });
}
