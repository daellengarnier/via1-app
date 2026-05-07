import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { text?: string };
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Text erforderlich" }, { status: 400 });
  }

  const feedback = await prisma.feedback.findUnique({
    where: { id: params.id },
  });
  if (!feedback) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const comment = await prisma.feedbackComment.create({
    data: {
      feedbackId: params.id,
      authorName: session.user.name ?? "",
      text,
    },
  });

  // Erfasser benachrichtigen (wenn nicht selbst kommentiert)
  if (feedback.authorEmail !== session.user.email) {
    const author = await prisma.user.findFirst({
      where: { email: feedback.authorEmail },
      select: { id: true },
    });
    if (author) {
      notify({
        kind: "FEEDBACK_COMMENT",
        title: `Kommentar zu deinem Eintrag`,
        body: `${session.user.name}: ${text.slice(0, 80)}`,
        link: "/feedback",
        audience: [author.id],
      }).catch(() => {});
    }
  }

  return NextResponse.json({
    id: comment.id,
    authorName: comment.authorName,
    text: comment.text,
    createdAt: comment.createdAt.toISOString().split("T")[0],
  });
}
