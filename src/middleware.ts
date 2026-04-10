export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /login
     * - /setup/:token
     * - /api/auth (NextAuth endpoints)
     * - /api/setup (password setup API)
     * - /_next (Next.js internals)
     * - /favicon.ico, /manifest.webmanifest, etc.
     */
    "/((?!login|setup|api/auth|api/setup|_next|favicon\\.ico|manifest).*)",
  ],
};
