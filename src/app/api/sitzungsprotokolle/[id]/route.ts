import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/sitzungsprotokolle/[id] — gibt das PDF als Download zurueck.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const p = await prisma.sitzungsprotokoll.findUnique({
    where: { id: params.id },
    select: { title: true, pdfData: true, date: true },
  });
  if (!p) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  // pdfData ist "data:application/pdf;base64,XYZ..."
  const idx = p.pdfData.indexOf(",");
  const base64 = idx >= 0 ? p.pdfData.slice(idx + 1) : p.pdfData;
  const buffer = Buffer.from(base64, "base64");

  const dateStr = p.date.toISOString().split("T")[0];
  const filename = `${dateStr}_${p.title}.pdf`
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}

// DELETE /api/sitzungsprotokolle/[id] — Admin oder Ersteller.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const p = await prisma.sitzungsprotokoll.findUnique({
    where: { id: params.id },
    select: { createdById: true },
  });
  if (!p) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  const isAdmin = (session.user.roles ?? []).includes("ADMIN");
  if (p.createdById !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Nicht erlaubt" }, { status: 403 });
  }

  await prisma.sitzungsprotokoll.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
