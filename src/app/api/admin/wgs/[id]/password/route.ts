import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/admin/wgs/[id]/password
// Body: { password: string }  (>= 4 Zeichen)
// Setzt das Passwort fuer eine WG (oder loescht es, falls leer).
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(session.user.roles ?? []).includes("ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const wg = await prisma.wg.findUnique({ where: { id: params.id } });
  if (!wg) {
    return NextResponse.json({ error: "WG nicht gefunden." }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as
    | { password?: unknown; clear?: unknown }
    | null;

  if (body?.clear === true) {
    await prisma.wg.update({
      where: { id: wg.id },
      data: {
        passwordHash: null,
        passwordSetAt: null,
        passwordSetById: null,
      },
    });
    return NextResponse.json({ ok: true, cleared: true });
  }

  const password =
    body && typeof body.password === "string" ? body.password : "";
  if (password.length < 4) {
    return NextResponse.json(
      { error: "Passwort muss mindestens 4 Zeichen lang sein." },
      { status: 400 }
    );
  }

  const hash = await bcrypt.hash(password, 10);
  await prisma.wg.update({
    where: { id: wg.id },
    data: {
      passwordHash: hash,
      passwordSetAt: new Date(),
      passwordSetById: session.user.id,
    },
  });

  return NextResponse.json({ ok: true });
}
