import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { token, password } = await request.json();

  if (!token || !password) {
    return NextResponse.json(
      { error: "Token und Passwort erforderlich." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Passwort muss mindestens 8 Zeichen lang sein." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { setupToken: token },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Ungueltiger oder abgelaufener Setup-Link." },
      { status: 404 }
    );
  }

  if (user.passwordSet) {
    return NextResponse.json(
      { error: "Passwort wurde bereits gesetzt." },
      { status: 400 }
    );
  }

  const hashedPassword = await hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordSet: true,
      setupToken: null,
    },
  });

  return NextResponse.json({ success: true });
}
