import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/push/subscribe — liefert den VAPID-Public-Key
// (muss vom Client zur PushManager.subscribe() verwendet werden)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const key = process.env.VAPID_PUBLIC_KEY ?? null;
  return NextResponse.json({ publicKey: key });
}

// POST /api/push/subscribe
// Body: { endpoint, keys: { p256dh, auth } }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
  };
  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  const p256dh =
    typeof body.keys?.p256dh === "string" ? body.keys.p256dh : "";
  const auth = typeof body.keys?.auth === "string" ? body.keys.auth : "";
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { error: "endpoint und keys erforderlich" },
      { status: 400 }
    );
  }

  // Upsert nach endpoint (unique)
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId: session.user.id,
      endpoint,
      p256dh,
      auth,
    },
    update: {
      userId: session.user.id,
      p256dh,
      auth,
    },
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/push/subscribe
// Body: { endpoint }
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { endpoint?: unknown };
  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  if (!endpoint) {
    return NextResponse.json(
      { error: "endpoint erforderlich" },
      { status: 400 }
    );
  }
  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: session.user.id },
  });
  return NextResponse.json({ ok: true });
}
