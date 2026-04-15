import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/users — Liste aller User mit Status (nur Admins)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(session.user.roles || []).includes("ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: [{ passwordSet: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      fullName: true,
      email: true,
      roles: true,
      passwordSet: true,
      setupToken: true,
      createdAt: true,
      updatedAt: true,
      room: {
        select: {
          keyNumber: true,
          wg: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      fullName: u.fullName ?? "",
      email: u.email,
      roles: u.roles,
      passwordSet: u.passwordSet,
      hasSetupToken: !!u.setupToken,
      setupToken: u.setupToken,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      wgName: u.room?.wg.name ?? null,
      roomKey: u.room?.keyNumber ?? null,
    }))
  );
}
