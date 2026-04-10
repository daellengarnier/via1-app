import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const body = (await request.json()) as { token: string; password: string };
  const { token, password } = body;

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
      { error: "Ungueltiger oder bereits verwendeter Token." },
      { status: 404 }
    );
  }

  if (user.passwordSet) {
    return NextResponse.json(
      { error: "Passwort wurde bereits eingerichtet." },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

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
