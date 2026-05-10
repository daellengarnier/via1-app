-- CreateTable
CREATE TABLE "aufgabe_sub_todos" (
    "id" TEXT NOT NULL,
    "aufgabeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aufgabe_sub_todos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "aufgabe_sub_todos_aufgabeId_position_idx" ON "aufgabe_sub_todos"("aufgabeId", "position");

-- AddForeignKey
ALTER TABLE "aufgabe_sub_todos" ADD CONSTRAINT "aufgabe_sub_todos_aufgabeId_fkey" FOREIGN KEY ("aufgabeId") REFERENCES "aufgaben"("id") ON DELETE CASCADE ON UPDATE CASCADE;
