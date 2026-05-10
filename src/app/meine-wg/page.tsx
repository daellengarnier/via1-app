import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { wgSlug } from "@/lib/wg-unlock";

// /meine-wg → Liste der WGs (oder Redirect auf eigene WG falls vorhanden).
// Phase 0: nur fuer Admins zugaenglich.
export default async function MeineWgIndexPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (!(session.user.roles ?? []).includes("ADMIN")) redirect("/");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { room: { include: { wg: true } } },
  });

  if (me?.room?.wg) {
    redirect(`/meine-wg/${wgSlug(me.room.wg.name)}`);
  }

  // Kein eigenes Zimmer → Liste aller WGs anzeigen
  const wgs = await prisma.wg.findMany({
    orderBy: [{ floor: "asc" }, { side: "asc" }],
  });

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 py-6 pb-24">
      <h1 className="mb-1 font-cinzel text-3xl text-accent">Meine WG</h1>
      <p className="mb-6 text-xs text-gray-500">
        Du hast keinem Zimmer zugewiesen — waehle die WG aus, in die du rein
        willst.
      </p>
      <div className="space-y-2">
        {wgs.map((w) => (
          <a
            key={w.id}
            href={`/meine-wg/${wgSlug(w.name)}`}
            className="block rounded-lg border border-gray-800 bg-white/5 px-4 py-3 hover:border-accent"
          >
            <p className="font-medium text-white">{w.name}</p>
            <p className="font-mono text-[10px] text-gray-500">
              {w.floor === 0 ? "EG" : `${w.floor}. OG`} ·{" "}
              {w.side === "NORD" ? "Nord" : "Ost"}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
