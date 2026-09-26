import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users/[id]/avatar?v=<avatarUpdatedAt> — liefert das
// Profilbild als Binaer-Response mit langem Cache. Der v-Parameter
// aendert sich bei jedem neuen Bild, deshalb darf der Browser die
// Antwort als immutable behandeln.
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { avatar: true, avatarUpdatedAt: true },
  });
  if (!user?.avatar) {
    return new NextResponse(null, { status: 404 });
  }

  const match = user.avatar.match(/^data:(image\/[\w.+-]+);base64,(.+)$/);
  if (!match) {
    return new NextResponse(null, { status: 404 });
  }

  const etag = `"${user.avatarUpdatedAt?.getTime() ?? match[2]!.length}"`;
  const cacheHeaders = {
    "Cache-Control": "private, max-age=31536000, immutable",
    ETag: etag,
  };
  if (req.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: cacheHeaders });
  }

  const body = Buffer.from(match[2]!, "base64");
  return new NextResponse(body, {
    headers: {
      ...cacheHeaders,
      "Content-Type": match[1]!,
      "Content-Length": String(body.length),
    },
  });
}
