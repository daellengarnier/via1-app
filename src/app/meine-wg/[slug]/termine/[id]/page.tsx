import { redirect } from "next/navigation";
import { gateWgSubpage } from "@/lib/wg-lookup";
import { TerminDetailClient } from "./TerminDetailClient";

interface Props {
  params: { slug: string; id: string };
}

export default async function WgTerminDetailPage({ params }: Props) {
  const gate = await gateWgSubpage(params.slug);
  if (!gate.ok) redirect(gate.redirectTo);

  return (
    <TerminDetailClient
      slug={params.slug}
      wgName={gate.wg.name}
      terminId={params.id}
      meId={gate.userId}
    />
  );
}
