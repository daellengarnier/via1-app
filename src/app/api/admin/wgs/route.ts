import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { wgSlug } from "@/lib/wg-unlock";

// GET /api/admin/wgs — Liste aller WGs mit Passwort-Status fuer die
// Admin-UI.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(session.user.roles ?? []).includes("ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const wgs = await prisma.wg.findMany({
    orderBy: [{ floor: "asc" }, { side: "asc" }],
    include: {
      passwordSetBy: { select: { name: true } },
    },
  });

  return NextResponse.json(
    wgs.map((w) => ({
      id: w.id,
      name: w.name,
      slug: wgSlug(w.name),
      floor: w.floor,
      side: w.side,
      hasPassword: !!w.passwordHash,
      passwordSetAt: w.passwordSetAt?.toISOString() ?? null,
      passwordSetBy: w.passwordSetBy?.name ?? null,
    }))
  );
}
