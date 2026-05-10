import { redirect } from "next/navigation";
import { gateWgSubpage } from "@/lib/wg-lookup";
import { DoodleListClient } from "./DoodleListClient";

interface Props {
  params: { slug: string };
}

export default async function DoodlePage({ params }: Props) {
  const gate = await gateWgSubpage(params.slug);
  if (!gate.ok) redirect(gate.redirectTo);

  return <DoodleListClient slug={params.slug} wgName={gate.wg.name} />;
}
