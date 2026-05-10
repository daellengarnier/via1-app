import { redirect } from "next/navigation";
import { gateWgSubpage } from "@/lib/wg-lookup";
import { PinnwandClient } from "./PinnwandClient";

interface Props {
  params: { slug: string };
}

export default async function PinnwandPage({ params }: Props) {
  const gate = await gateWgSubpage(params.slug);
  if (!gate.ok) redirect(gate.redirectTo);

  return (
    <PinnwandClient slug={params.slug} wgName={gate.wg.name} meId={gate.userId} />
  );
}
