-- Globales FamilyKid-Modell mit Many-to-Many zu User (Eltern).
-- Eltern koennen ihre Kinder schnell zu Hauschat-Terminen anmelden
-- ohne jedes Mal Name/Diet/Allergien neu einzutippen.

CREATE TABLE "FamilyKid" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "diet"      "Diet" NOT NULL,
  "allergies" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FamilyKid_pkey" PRIMARY KEY ("id")
);

-- Implicit M2M join table (Prisma-Konvention: _<RelationName>)
CREATE TABLE "_FamilyKidParents" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  CONSTRAINT "_FamilyKidParents_AB_pkey" PRIMARY KEY ("A", "B")
);

CREATE INDEX "_FamilyKidParents_B_index" ON "_FamilyKidParents"("B");

ALTER TABLE "_FamilyKidParents"
  ADD CONSTRAINT "_FamilyKidParents_A_fkey"
  FOREIGN KEY ("A") REFERENCES "FamilyKid"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_FamilyKidParents"
  ADD CONSTRAINT "_FamilyKidParents_B_fkey"
  FOREIGN KEY ("B") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
