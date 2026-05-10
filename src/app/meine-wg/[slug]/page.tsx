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
import { WgDashboardClient } from "./WgDashboardClient";
import { WgPageHeader } from "@/components/WgPageHeader";

interface Props {
  params: { slug: string };
}

export default async function MeineWgSlugPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  // Phase 0: nur Admins
  // Admin-Restriction wurde entfernt — alle eingeloggten User duerfen rein

  const allWgs = await prisma.wg.findMany();
  const wg = allWgs.find((w) => wgSlug(w.name) === params.slug);
  if (!wg) {
    return (
      <div className="mx-auto min-h-screen max-w-md px-4 pb-24">
        <WgPageHeader title="Meine WG" />
        <p className="mt-4 text-sm text-gray-400">WG nicht gefunden.</p>
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

  const subtitle = `${wg.floor === 0 ? "EG" : `${wg.floor}. OG`} · ${wg.side === "NORD" ? "Nord" : "Ost"} · Privater Bereich`;

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-24">
      <WgPageHeader title={wg.name} subtitle={subtitle} />
      <div className="h-5" />

      {!wg.passwordHash ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-amber-300">
            🔓 Noch kein Passwort gesetzt
          </p>
          <p className="text-sm text-gray-300">
            Fuer diese WG ist noch kein Passwort hinterlegt. Setze es als
            Admin ueber{" "}
            <a className="text-white hover:underline" href="/admin/wgs">
              /admin/wgs
            </a>
            .
          </p>
        </div>
      ) : !unlocked ? (
        <UnlockForm wgSlug={params.slug} wgName={wg.name} />
      ) : (
        <WgDashboardClient
          slug={params.slug}
          meId={session.user.id}
          meName={session.user.name ?? ""}
        />
      )}
    </div>
  );
}

