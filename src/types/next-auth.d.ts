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
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles: string[];
  }
}
