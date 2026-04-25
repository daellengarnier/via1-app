import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.roles?.includes("ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = params.id;

  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "Du kannst dich nicht selbst löschen." },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return NextResponse.json({ error: "User nicht gefunden." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    // Shared content without cascade — delete or orphan
    await tx.traktandum.deleteMany({ where: { createdById: userId } });
    await tx.termin.deleteMany({ where: { createdById: userId } });
    await tx.aufgabe.deleteMany({ where: { createdById: userId } });
    await tx.booking.deleteMany({ where: { createdById: userId } });
    await tx.flohmiInserat.updateMany({
      where: { takenById: userId },
      data: { takenById: null, takenAt: null },
    });
    await tx.flohmiInserat.deleteMany({ where: { createdById: userId } });
    await tx.activity.deleteMany({ where: { createdById: userId } });
    await tx.shoppingItem.updateMany({
      where: { completedById: userId },
      data: { completedById: null },
    });
    await tx.shoppingItem.deleteMany({ where: { createdById: userId } });
    await tx.sublet.deleteMany({ where: { createdById: userId } });
    await tx.hausbuchArticle.updateMany({
      where: { createdById: userId },
      data: { createdById: null },
    });
    await tx.hausbuchArticle.deleteMany({
      where: { updatedById: userId },
    });
    await tx.roomDamage.updateMany({
      where: { reportedById: userId },
      data: { reportedById: null },
    });
    // User delete — cascades personal data (scores, notes, comments,
    // attendance, signups, notifications, push subscriptions, etc.)
    await tx.user.delete({ where: { id: userId } });
  });

  return NextResponse.json({ ok: true });
}
