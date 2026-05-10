import { redirect } from "next/navigation";
import { gateWgSubpage } from "@/lib/wg-lookup";
import { AemtliClient } from "./AemtliClient";

interface Props {
  params: { slug: string };
}

export default async function AemtliPage({ params }: Props) {
  const gate = await gateWgSubpage(params.slug);
  if (!gate.ok) redirect(gate.redirectTo);

  return (
    <AemtliClient slug={params.slug} wgName={gate.wg.name} meId={gate.userId} />
  );
}
