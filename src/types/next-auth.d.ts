import "next-auth";

declare module "next-auth" {
  interface User {
    roles: string[];
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      roles: string[];
      // Wenn gesetzt: User ist aktuell impersoniert. Enthaelt den
      // Original-Admin der die Impersonation gestartet hat — wird
      // verwendet um die Impersonation zu beenden + den Banner zu zeigen.
      impersonatedBy?: { id: string; name: string };
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles: string[];
    impersonatedBy?: { id: string; name: string };
  }
}
