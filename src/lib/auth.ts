import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const DEMO_MODE = !process.env.DATABASE_URL;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Demo mode: any @via1.ch email with password "via1"
        if (DEMO_MODE) {
          if (
            credentials.email.endsWith("@via1.ch") &&
            credentials.password === "via1"
          ) {
            const name = credentials.email.split("@")[0]!;
            return {
              id: name,
              name: name.charAt(0).toUpperCase() + name.slice(1),
              email: credentials.email,
              roles: ["ADMIN"],
            };
          }
          return null;
        }

        // Production mode: check against database
        const { PrismaClient } = await import("@prisma/client");
        const bcrypt = await import("bcryptjs");
        const prisma = new PrismaClient();

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.password || !user.passwordSet) {
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            roles: user.roles,
          };
        } finally {
          await prisma.$disconnect();
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.roles = user.roles;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.roles = token.roles as string[];
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
