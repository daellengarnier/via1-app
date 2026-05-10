import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  WG_UNLOCK_COOKIE_NAME,
  decodeWgUnlock,
} from "@/lib/wg-unlock";
import { getWgBySlugCached } from "@/lib/wg-lookup";
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

  const wg = await getWgBySlugCached(params.slug);
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
      <Link
        href="/meine-wg?all=1"
        className="mt-1 inline-block font-mono text-[10px] uppercase tracking-widest text-gray-400 hover:text-white"
      >
        ↔ Andere WG
      </Link>
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

