import { redirect } from "next/navigation";
import { gateWgSubpage } from "@/lib/wg-lookup";
import { KochplanClient } from "./KochplanClient";

interface Props {
  params: { slug: string };
}

export default async function KochplanPage({ params }: Props) {
  const gate = await gateWgSubpage(params.slug);
  if (!gate.ok) redirect(gate.redirectTo);

  return (
    <KochplanClient
      slug={params.slug}
      wgName={gate.wg.name}
      meId={gate.userId}
      meName={gate.userName}
    />
  );
}
