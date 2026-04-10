import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = [
    {
      name: "Alain",
      email: "alain@via1.ch",
      role: Role.ADMIN,
      setupToken: "6a41ffdd2505086d2d2f6694ce41b78e",
      passwordSet: false,
    },
    {
      name: "Yves",
      email: "yves@via1.ch",
      role: Role.ADMIN,
      setupToken: "a5197785a70c80509e7e671d6e55d089",
      passwordSet: false,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    console.log(`Created user: ${user.name} (Token: ${user.setupToken})`);
  }

  console.log("\nSetup-URLs:");
  console.log(
    `  Alain: https://app.felsenau.org/setup/${users[0]!.setupToken}`
  );
  console.log(
    `  Yves:  https://app.felsenau.org/setup/${users[1]!.setupToken}`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
