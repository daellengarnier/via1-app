import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/sitzungsprotokolle — alle Protokolle, neueste zuerst.
// Liefert OHNE pdfData (sonst riesige Antwort) — Download separat.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await prisma.sitzungsprotokoll.findMany({
    orderBy: { date: "desc" },
    select: {
      id: true,
      title: true,
      date: true,
      wgName: true,
      terminId: true,
      createdAt: true,
      createdBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(
    list.map((p) => ({
      id: p.id,
      title: p.title,
      date: p.date.toISOString(),
      wgName: p.wgName,
      terminId: p.terminId,
      createdAt: p.createdAt.toISOString(),
      createdBy: p.createdBy,
    }))
  );
}

interface CreateBody {
  terminId?: unknown;
  title?: unknown;
  date?: unknown;
  wgName?: unknown;
  pdfData?: unknown;
}

// POST /api/sitzungsprotokolle — neues Protokoll anlegen.
// Wird vom Termin-Detail aufgerufen sobald exportPdf laeuft.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as CreateBody | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const pdfData = typeof body?.pdfData === "string" ? body.pdfData : "";
  const dateStr = typeof body?.date === "string" ? body.date : "";
  const terminId = typeof body?.terminId === "string" ? body.terminId : null;
  const wgName = typeof body?.wgName === "string" ? body.wgName : null;

  if (!title || !pdfData) {
    return NextResponse.json(
      { error: "title und pdfData sind erforderlich" },
      { status: 400 }
    );
  }
  if (!pdfData.startsWith("data:application/pdf")) {
    return NextResponse.json(
      { error: "pdfData muss eine data:application/pdf-URL sein" },
      { status: 400 }
    );
  }
  const date = dateStr ? new Date(dateStr) : new Date();
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Ungueltiges Datum" }, { status: 400 });
  }

  // Wenn ein Protokoll fuer denselben terminId schon existiert → ersetzen
  // (User hat das PDF neu generiert).
  if (terminId) {
    await prisma.sitzungsprotokoll.deleteMany({ where: { terminId } });
  }

  const created = await prisma.sitzungsprotokoll.create({
    data: {
      title,
      date,
      wgName,
      terminId,
      pdfData,
      createdById: session.user.id,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id });
}
