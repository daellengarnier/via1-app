import { redirect } from "next/navigation";
import { gateWgSubpage } from "@/lib/wg-lookup";
import { DoodleDetailClient } from "./DoodleDetailClient";

interface Props {
  params: { slug: string; id: string };
}

export default async function DoodleDetailPage({ params }: Props) {
  const gate = await gateWgSubpage(params.slug);
  if (!gate.ok) redirect(gate.redirectTo);

  return (
    <DoodleDetailClient
      slug={params.slug}
      wgName={gate.wg.name}
      doodleId={params.id}
      meId={gate.userId}
    />
  );
}
