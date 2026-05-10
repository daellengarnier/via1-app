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
import { PinnwandClient } from "./PinnwandClient";

interface Props {
  params: { slug: string };
}

export default async function PinnwandPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  // Admin-Restriction wurde entfernt — alle eingeloggten User duerfen rein

  const allWgs = await prisma.wg.findMany();
  const wg = allWgs.find((w) => wgSlug(w.name) === params.slug);
  if (!wg) redirect("/meine-wg");

  const cookieStore = cookies();
  const payload = decodeWgUnlock(
    cookieStore.get(WG_UNLOCK_COOKIE_NAME)?.value
  );
  const unlocked =
    !!payload &&
    payload.uid === session.user.id &&
    payload.wgs.includes(wg.id);
  if (!unlocked) redirect(`/meine-wg/${params.slug}`);

  return (
    <PinnwandClient slug={params.slug} wgName={wg.name} meId={session.user.id} />
  );
}
