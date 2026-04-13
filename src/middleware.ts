export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /login
     * - /registrieren
     * - /setup/:token
     * - /api/auth (NextAuth endpoints)
     * - /api/setup (password setup API)
     * - /_next (Next.js internals)
     * - Alle statischen Dateien (mit Extension, z.B. .webp, .png, .ico, .svg)
     */
    "/((?!login|registrieren|setup|api/auth|api/setup|_next|.*\\..*).*)",
  ],
};
