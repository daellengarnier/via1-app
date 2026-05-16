import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { wgSlug } from "@/lib/wg-unlock";
import { WgBackground } from "@/components/WgBackground";

// /meine-wg — Default: redirect direkt in eigene WG.
// /meine-wg?all=1 → Auswahlseite (zum Wechseln, z.B. Cross-WG-Partner).
export default async function MeineWgIndexPage({
  searchParams,
}: {
  searchParams?: { all?: string; select?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      room: { include: { wg: true } },
      lastVisitedWg: true,
    },
  });
  const myWg = me?.room?.wg ?? null;
  // Auto-Redirect-Ziel: zuletzt besuchte WG, sonst eigene WG.
  // So sieht z.B. Ambar nach einmaligem Family-WG-Login dort die
  // Uebersicht statt ihrer offiziellen Ostblock-WG.
  const defaultWg = me?.lastVisitedWg ?? myWg;

  const forceList = !!(searchParams?.all || searchParams?.select);
  if (defaultWg && !forceList) {
    redirect(`/meine-wg/${wgSlug(defaultWg.name)}`);
  }

  const allWgs = await prisma.wg.findMany({
    orderBy: [{ floor: "asc" }, { side: "asc" }],
  });
  const otherWgs = allWgs.filter((w) => w.id !== myWg?.id);

  function floorLabel(floor: number, side: "NORD" | "OST"): string {
    return `${floor === 0 ? "EG" : `${floor}. OG`} · ${side === "NORD" ? "Nord" : "Ost"}`;
  }

  return (
    <>
      <WgBackground />
      <div className="mx-auto min-h-screen max-w-md px-4 pb-24 pt-14">
      <h1 className="mb-1 font-display text-3xl font-bold uppercase tracking-wider text-white">
        Meine WG
      </h1>
      <p className="mb-6 text-xs text-gray-400">
        Waehle die WG aus, in die du rein willst.
      </p>

      {myWg && (
        <>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
            Deine WG
          </p>
          <Link
            href={`/meine-wg/${wgSlug(myWg.name)}`}
            className="wg-tile mb-6 flex items-center justify-between p-4 hover:brightness-110"
          >
            <div>
              <p className="font-display text-2xl font-bold uppercase tracking-wider text-white">
                {myWg.name}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-gray-300">
                {floorLabel(myWg.floor, myWg.side)}
              </p>
            </div>
            <span className="font-mono text-2xl text-white">→</span>
          </Link>
        </>
      )}

      {otherWgs.length > 0 && (
        <>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
            {myWg ? "Andere WGs" : "Alle WGs"}
          </p>
          <p className="mb-2 text-[11px] text-gray-500">
            Wenn du auch in einer anderen WG mitmachst (z.B. als Partner:in),
            kannst du dich dort mit dem WG-Passwort anmelden.
          </p>
          <div className="space-y-2">
            {otherWgs.map((w) => (
              <Link
                key={w.id}
                href={`/meine-wg/${wgSlug(w.name)}`}
                className="wg-tile-light flex items-center justify-between p-3 hover:brightness-110"
              >
                <div>
                  <p className="font-display text-sm font-bold uppercase tracking-wider text-white">
                    {w.name}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                    {floorLabel(w.floor, w.side)}
                  </p>
                </div>
                <span className="font-mono text-lg text-gray-400">→</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
    </>
  );
}
