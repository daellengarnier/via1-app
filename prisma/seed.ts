import { PrismaClient, Role } from "@prisma/client";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

async function main() {
  const alainToken = randomBytes(32).toString("hex");
  const yvesToken = randomBytes(32).toString("hex");

  const alain = await prisma.user.upsert({
    where: { setupToken: alainToken },
    update: {},
    create: {
      name: "Alain",
      role: Role.ADMIN,
      passwordSet: false,
      setupToken: alainToken,
    },
  });

  const yves = await prisma.user.upsert({
    where: { setupToken: yvesToken },
    update: {},
    create: {
      name: "Yves",
      role: Role.ADMIN,
      passwordSet: false,
      setupToken: yvesToken,
    },
  });

  console.log("Erstbenutzer angelegt:");
  console.log(`  Alain - Setup-Link: /setup/${alainToken}`);
  console.log(`  Yves  - Setup-Link: /setup/${yvesToken}`);
  console.log("");
  console.log("Diese Links beim ersten Login verwenden!");
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
