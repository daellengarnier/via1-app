import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/activities/[id]?scope=one|all — eigene oder Admin
// scope=all: wenn die Aktivitaet zu einer Serie gehoert, alle kuenftigen
// Instanzen der Serie loeschen. Default = "one" (nur diese Instanz).
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const activity = await prisma.activity.findUnique({
    where: { id: params.id },
  });
  if (!activity) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const isAdmin = (session.user.roles || []).includes("ADMIN");
  if (activity.createdById !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") === "all" ? "all" : "one";

  if (scope === "all" && activity.recurrenceGroupId) {
    // Alle Instanzen der Serie ab diesem Zeitpunkt loeschen
    const result = await prisma.activity.deleteMany({
      where: {
        recurrenceGroupId: activity.recurrenceGroupId,
        startAt: { gte: activity.startAt },
      },
    });
    return NextResponse.json({ ok: true, deleted: result.count });
  }

  await prisma.activity.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true, deleted: 1 });
}
