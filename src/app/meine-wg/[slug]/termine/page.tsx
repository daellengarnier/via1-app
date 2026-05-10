import { redirect } from "next/navigation";
import { gateWgSubpage } from "@/lib/wg-lookup";
import { WgTermineClient } from "./WgTermineClient";

interface Props {
  params: { slug: string };
}

export default async function WgTerminePage({ params }: Props) {
  const gate = await gateWgSubpage(params.slug);
  if (!gate.ok) redirect(gate.redirectTo);

  return <WgTermineClient slug={params.slug} wgName={gate.wg.name} />;
}
