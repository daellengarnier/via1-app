import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  WG_UNLOCK_COOKIE_NAME,
  decodeWgUnlock,
  wgSlug,
} from "@/lib/wg-unlock";
import { UnlockForm } from "./UnlockForm";

interface Props {
  params: { slug: string };
}

export default async function MeineWgSlugPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  // Phase 0: nur Admins
  if (!(session.user.roles ?? []).includes("ADMIN")) redirect("/");

  const allWgs = await prisma.wg.findMany();
  const wg = allWgs.find((w) => wgSlug(w.name) === params.slug);
  if (!wg) {
    return (
      <div className="mx-auto min-h-screen max-w-md px-4 py-6 pb-24">
        <h1 className="mb-2 font-cinzel text-2xl text-accent">Meine WG</h1>
        <p className="text-sm text-gray-400">WG nicht gefunden.</p>
      </div>
    );
  }

  const cookieStore = cookies();
  const payload = decodeWgUnlock(
    cookieStore.get(WG_UNLOCK_COOKIE_NAME)?.value
  );
  const unlocked =
    !!payload &&
    payload.uid === session.user.id &&
    payload.wgs.includes(wg.id);

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 py-6 pb-24">
      <h1 className="mb-1 font-cinzel text-3xl text-accent">{wg.name}</h1>
      <p className="mb-6 font-mono text-[10px] uppercase tracking-widest text-gray-500">
        {wg.floor === 0 ? "EG" : `${wg.floor}. OG`} ·{" "}
        {wg.side === "NORD" ? "Nord" : "Ost"} · Privater Bereich
      </p>

      {!wg.passwordHash ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-amber-300">
            🔓 Noch kein Passwort gesetzt
          </p>
          <p className="text-sm text-gray-300">
            Fuer diese WG ist noch kein Passwort hinterlegt. Setze es als
            Admin ueber{" "}
            <a className="text-accent hover:underline" href="/admin/wgs">
              /admin/wgs
            </a>
            .
          </p>
        </div>
      ) : !unlocked ? (
        <UnlockForm wgSlug={params.slug} wgName={wg.name} />
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5">
            <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-accent">
              🔓 Entsperrt — bald hier:
            </p>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>· Kochplan</li>
              <li>· Einkaufsliste</li>
              <li>· Aemtli (Putzplan)</li>
              <li>· WG-Termine + Termin-Doodle</li>
              <li>· WG-Pinnwand</li>
              <li>· Finanzen</li>
            </ul>
          </div>
          <p className="text-center text-[10px] text-gray-600">
            Phase 0 — Skeleton. Inhalt kommt schrittweise.
          </p>
        </div>
      )}
    </div>
  );
}
