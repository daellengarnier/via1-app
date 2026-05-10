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
        <div className="space-y-2">
          <FeatureLink
            href={`/meine-wg/${params.slug}/kochplan`}
            icon="🍳"
            title="Kochplan"
            subtitle="Wer kocht wann, wer isst mit"
          />
          <FeatureLink
            href={`/meine-wg/${params.slug}/einkauf`}
            icon="🛒"
            title="Einkaufsliste"
            subtitle="Gemeinsame Einkaufsliste"
          />
          <FeatureLink
            href={`/meine-wg/${params.slug}/aemtli`}
            icon="🧹"
            title="Aemtli"
            subtitle="Putzplan mit Rotation"
          />
          <FeatureLink
            href={`/meine-wg/${params.slug}/termine`}
            icon="📅"
            title="WG-Termine"
            subtitle="Sitzungen mit Traktanden + Protokoll"
          />
          <FeatureLink
            href={`/meine-wg/${params.slug}/doodle`}
            icon="🗓"
            title="Termin-Doodle"
            subtitle="Datums-Umfragen → Termin"
          />
          <FeatureLinkPlaceholder icon="📌" title="WG-Pinnwand" />
        </div>
      )}
    </div>
  );
}

function FeatureLink({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4 hover:border-accent hover:bg-accent/10"
    >
      <span className="text-2xl">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-white">{title}</p>
        <p className="text-[11px] text-gray-400">{subtitle}</p>
      </div>
      <span className="text-accent">→</span>
    </a>
  );
}

function FeatureLinkPlaceholder({
  icon,
  title,
}: {
  icon: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/30 p-4 opacity-60">
      <span className="text-2xl grayscale">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-gray-400">{title}</p>
        <p className="font-mono text-[10px] uppercase tracking-wider text-gray-600">
          bald
        </p>
      </div>
    </div>
  );
}
