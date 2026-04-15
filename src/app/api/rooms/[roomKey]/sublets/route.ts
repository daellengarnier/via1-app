import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/rooms/[roomKey]/sublets — aktuelle + kommende Untermieten
export async function GET(
  _req: Request,
  { params }: { params: { roomKey: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sublets = await prisma.sublet.findMany({
    where: { roomKey: params.roomKey },
    orderBy: { fromDate: "asc" },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(
    sublets.map((s) => ({
      id: s.id,
      subtenantName: s.subtenantName,
      subtenantFullName: s.subtenantFullName,
      subtenantPhone: s.subtenantPhone,
      subtenantEmail: s.subtenantEmail,
      fromDate: s.fromDate.toISOString().split("T")[0],
      toDate: s.toDate.toISOString().split("T")[0],
      notes: s.notes,
      createdBy: s.createdBy.name,
      createdById: s.createdById,
    }))
  );
}

// POST /api/rooms/[roomKey]/sublets — neue Untermiete eintragen
export async function POST(
  req: Request,
  { params }: { params: { roomKey: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as {
    subtenantName?: unknown;
    subtenantFullName?: unknown;
    subtenantPhone?: unknown;
    subtenantEmail?: unknown;
    fromDate?: unknown;
    toDate?: unknown;
    notes?: unknown;
  };
  const subtenantName =
    typeof body.subtenantName === "string" ? body.subtenantName.trim() : "";
  const subtenantFullName =
    typeof body.subtenantFullName === "string"
      ? body.subtenantFullName.trim()
      : "";
  const subtenantPhone =
    typeof body.subtenantPhone === "string" ? body.subtenantPhone.trim() : "";
  const subtenantEmail =
    typeof body.subtenantEmail === "string"
      ? body.subtenantEmail.trim().toLowerCase()
      : "";
  const fromDate = typeof body.fromDate === "string" ? body.fromDate : "";
  const toDate = typeof body.toDate === "string" ? body.toDate : "";
  if (!subtenantName) {
    return NextResponse.json(
      { error: "Name der Untermieter:in fehlt" },
      { status: 400 }
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
    return NextResponse.json(
      { error: "Datum muss YYYY-MM-DD sein" },
      { status: 400 }
    );
  }
  if (
    subtenantEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subtenantEmail)
  ) {
    return NextResponse.json(
      { error: "Ungültige E-Mail-Adresse" },
      { status: 400 }
    );
  }

  const created = await prisma.sublet.create({
    data: {
      roomKey: params.roomKey,
      subtenantName,
      subtenantFullName,
      subtenantPhone,
      subtenantEmail,
      fromDate: new Date(`${fromDate}T00:00:00.000Z`),
      toDate: new Date(`${toDate}T00:00:00.000Z`),
      notes: typeof body.notes === "string" ? body.notes : "",
      createdById: session.user.id,
    },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    id: created.id,
    subtenantName: created.subtenantName,
    subtenantFullName: created.subtenantFullName,
    subtenantPhone: created.subtenantPhone,
    subtenantEmail: created.subtenantEmail,
    fromDate: created.fromDate.toISOString().split("T")[0],
    toDate: created.toDate.toISOString().split("T")[0],
    notes: created.notes,
    createdBy: created.createdBy.name,
    createdById: created.createdById,
  });
}
