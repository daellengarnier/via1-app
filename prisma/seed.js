"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();

const wgs = [
  {
    name: "Nordwind",
    floor: 0,
    side: client_1.Side.NORD,
    rooms: [
      { keyNumber: "N01", number: 1 },
      { keyNumber: "N02", number: 2 },
      { keyNumber: "N03", number: 3 },
      { keyNumber: "N04", number: 4 },
      { keyNumber: "N05", number: 5 },
    ],
  },
  {
    name: "Ostblock",
    floor: 0,
    side: client_1.Side.OST,
    rooms: [
      { keyNumber: "O01", number: 1 },
      { keyNumber: "O02", number: 2 },
      { keyNumber: "O03", number: 3 },
      { keyNumber: "O04", number: 4 },
      { keyNumber: "O05", number: 5 },
    ],
  },
  {
    name: "Dreiecksbar",
    floor: 1,
    side: client_1.Side.NORD,
    rooms: [
      { keyNumber: "N11", number: 1 },
      { keyNumber: "N12", number: 2 },
      { keyNumber: "N13", number: 3 },
      { keyNumber: "N14", number: 4 },
      { keyNumber: "N15", number: 5 },
    ],
  },
  {
    name: "Kleenex",
    floor: 1,
    side: client_1.Side.OST,
    rooms: [
      { keyNumber: "O11", number: 1 },
      { keyNumber: "O12", number: 2 },
      { keyNumber: "O13", number: 3 },
      { keyNumber: "O14", number: 4 },
      { keyNumber: "O15", number: 5 },
    ],
  },
  {
    name: "Family-WG",
    floor: 2,
    side: client_1.Side.NORD,
    rooms: [
      { keyNumber: "N21", number: 1 },
      { keyNumber: "N22", number: 2 },
      { keyNumber: "N23", number: 3 },
      { keyNumber: "N24", number: 4 },
      { keyNumber: "N25", number: 5 },
    ],
  },
  {
    name: "Bonzen",
    floor: 2,
    side: client_1.Side.OST,
    rooms: [
      { keyNumber: "O21", number: 1 },
      { keyNumber: "O22", number: 2 },
      { keyNumber: "O23", number: 3 },
      { keyNumber: "O24", number: 4 },
    ],
  },
];

async function main() {
  // WGs und Zimmer erstellen
  for (const wg of wgs) {
    const created = await prisma.wg.upsert({
      where: { name: wg.name },
      update: {},
      create: {
        name: wg.name,
        floor: wg.floor,
        side: wg.side,
        rooms: {
          create: wg.rooms,
        },
      },
    });
    console.log(
      `WG: ${created.name} (${wg.side} ${wg.floor}. OG) - ${wg.rooms.length} Zimmer`
    );
  }

  // Erstbenutzer (mit Multi-Rollen)
  const users = [
    {
      name: "Alain",
      email: "alain@via1.ch",
      roles: [client_1.Role.ADMIN, client_1.Role.HAUSWART],
      setupToken: "6a41ffdd2505086d2d2f6694ce41b78e",
      passwordSet: false,
    },
    {
      name: "Yves",
      email: "yves@via1.ch",
      roles: [client_1.Role.ADMIN],
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
    console.log(
      `User: ${user.name} (Roles: ${user.roles.join(", ")}, Token: ${user.setupToken})`
    );
  }

  console.log("\nSetup-URLs:");
  console.log(
    `  Alain: https://app.felsenau.org/setup/${users[0].setupToken}`
  );
  console.log(`  Yves:  https://app.felsenau.org/setup/${users[1].setupToken}`);
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
