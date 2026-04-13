import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

function toDateOnly(d: Date): string {
  return d.toISOString().split("T")[0]!;
}

// POST /api/bookings/[id]/comments
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
  });
  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json()) as { text?: unknown };
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "text erforderlich" }, { status: 400 });
  }
  if (text.length > 500) {
    return NextResponse.json(
      { error: "text zu lang" },
      { status: 400 }
    );
  }

  const c = await prisma.bookingComment.create({
    data: {
      bookingId: params.id,
      authorId: session.user.id,
      text,
    },
    include: { author: { select: { id: true, name: true } } },
  });

  // Nur den Booking-Ersteller benachrichtigen (wenn nicht selbst)
  if (booking.createdById !== session.user.id) {
    notify({
      kind: "BOOKING_COMMENT",
      title: `Kommentar auf deiner Buchung (${booking.guest})`,
      body: `${c.author.name}: ${text}`,
      link: "/gaesti",
      audience: [booking.createdById],
    }).catch((e) => console.error("notify", e));
  }

  return NextResponse.json({
    id: c.id,
    author: c.author.name,
    authorId: c.author.id,
    text: c.text,
    date: toDateOnly(c.createdAt),
  });
}
