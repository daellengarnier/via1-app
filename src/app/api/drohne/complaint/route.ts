import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/drohne/complaint  body: { text }
// Fuegt eine Beschwerde an den aktuell laufenden Flight. Wird auf der
// Drohne als Sprechblase angezeigt (alle User sehen sie).
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Text fehlt." }, { status: 400 });
  }
  if (text.length > 200) {
    return NextResponse.json({ error: "Max 200 Zeichen." }, { status: 400 });
  }

  const flight = await prisma.droneFlight.findFirst({
    where: { endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  if (!flight) {
    return NextResponse.json({ error: "Keine aktive Drohne." }, { status: 404 });
  }

  await prisma.droneComplaint.create({
    data: {
      flightId: flight.id,
      authorId: session.user.id,
      text,
    },
  });

  return NextResponse.json({ ok: true });
}
