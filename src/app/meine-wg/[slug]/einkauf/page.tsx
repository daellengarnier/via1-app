import { redirect } from "next/navigation";
import { gateWgSubpage } from "@/lib/wg-lookup";
import { EinkaufClient } from "./EinkaufClient";

interface Props {
  params: { slug: string };
}

export default async function EinkaufPage({ params }: Props) {
  const gate = await gateWgSubpage(params.slug);
  if (!gate.ok) redirect(gate.redirectTo);

  return (
    <EinkaufClient slug={params.slug} wgName={gate.wg.name} meId={gate.userId} />
  );
}
