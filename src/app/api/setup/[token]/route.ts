import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/setup/[token] — Prueft Token und gibt zurueck ob es eine
// Erstanmeldung ist oder ein Passwort-Reset (Profil existiert bereits).
export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  if (!params.token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { setupToken: params.token },
    select: {
      name: true,
      fullName: true,
      email: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Ungueltiger oder bereits verwendeter Token." },
      { status: 404 }
    );
  }

  // "Reset" wenn das Profil schon einen Namen hat (wurde bereits einmal
  // eingerichtet). Sonst Erstanmeldung.
  const isReset = !!(user.fullName && user.fullName.trim() !== "");

  return NextResponse.json({
    valid: true,
    isReset,
    displayName: user.name,
    email: user.email,
  });
}
