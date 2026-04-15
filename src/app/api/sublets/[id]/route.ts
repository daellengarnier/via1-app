import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/sublets/[id] — Untermiete bearbeiten
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sublet = await prisma.sublet.findUnique({
    where: { id: params.id },
  });
  if (!sublet) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const isAdmin = (session.user.roles || []).includes("ADMIN");
  if (sublet.createdById !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  const data: Record<string, unknown> = {};
  if (typeof body.subtenantName === "string") {
    data.subtenantName = body.subtenantName.trim();
  }
  if (typeof body.subtenantFullName === "string") {
    data.subtenantFullName = body.subtenantFullName.trim();
  }
  if (typeof body.subtenantPhone === "string") {
    data.subtenantPhone = body.subtenantPhone.trim();
  }
  if (typeof body.subtenantEmail === "string") {
    const email = body.subtenantEmail.trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Ungültige E-Mail-Adresse" },
        { status: 400 }
      );
    }
    data.subtenantEmail = email;
  }
  if (
    typeof body.fromDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(body.fromDate)
  ) {
    data.fromDate = new Date(`${body.fromDate}T00:00:00.000Z`);
  }
  if (
    typeof body.toDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(body.toDate)
  ) {
    data.toDate = new Date(`${body.toDate}T00:00:00.000Z`);
  }
  if (typeof body.notes === "string") {
    data.notes = body.notes;
  }

  const updated = await prisma.sublet.update({
    where: { id: params.id },
    data,
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    id: updated.id,
    subtenantName: updated.subtenantName,
    subtenantFullName: updated.subtenantFullName,
    subtenantPhone: updated.subtenantPhone,
    subtenantEmail: updated.subtenantEmail,
    fromDate: updated.fromDate.toISOString().split("T")[0],
    toDate: updated.toDate.toISOString().split("T")[0],
    notes: updated.notes,
    createdBy: updated.createdBy.name,
    createdById: updated.createdById,
  });
}

// DELETE /api/sublets/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sublet = await prisma.sublet.findUnique({
    where: { id: params.id },
  });
  if (!sublet) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const isAdmin = (session.user.roles || []).includes("ADMIN");
  if (sublet.createdById !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.sublet.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
