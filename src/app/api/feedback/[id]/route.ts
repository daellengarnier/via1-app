import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

// PATCH /api/feedback/[id] — Status ändern (z.B. erledigt)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.roles?.includes("ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { status?: string };
  const status = typeof body.status === "string" ? body.status : "";
  if (!status) {
    return NextResponse.json({ error: "Status erforderlich" }, { status: 400 });
  }

  const feedback = await prisma.feedback.findUnique({
    where: { id: params.id },
  });
  if (!feedback) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.feedback.update({
    where: { id: params.id },
    data: { status },
  });

  // Erfasser benachrichtigen wenn erledigt
  if (status === "erledigt") {
    const author = await prisma.user.findFirst({
      where: { email: feedback.authorEmail },
      select: { id: true },
    });
    if (author) {
      const typeLabel = feedback.type === "bug" ? "Bug" : "Idee";
      notify({
        kind: "FEEDBACK_RESOLVED",
        title: `${typeLabel} erledigt: ${feedback.title}`,
        body: `Dein Eintrag wurde als erledigt markiert.`,
        link: "/feedback",
        audience: [author.id],
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true, status });
}

// DELETE /api/feedback/[id] — Feedback löschen (Ersteller oder Admin)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feedback = await prisma.feedback.findUnique({
    where: { id: params.id },
  });
  if (!feedback) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = (session.user.roles || []).includes("ADMIN");
  const isAuthor = feedback.authorEmail === session.user.email;
  if (!isAdmin && !isAuthor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.feedback.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
