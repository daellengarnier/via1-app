import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeDamage } from "@/lib/damages-serialize";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as { text?: unknown };
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "Rückmeldung fehlt" }, { status: 400 });

  await prisma.roomDamageFeedback.create({ data: { damageId: params.id, authorId: session.user.id, text } });
  const updated = await prisma.roomDamage.update({
    where: { id: params.id },
    data: { status: "rueckmeldung" },
    include: { reportedBy: true, feedbacks: { orderBy: { createdAt: "asc" }, include: { author: true } } },
  });
  return NextResponse.json(serializeDamage(updated));
}
