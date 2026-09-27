import { redirect } from "next/navigation";
import { gateWgSubpage } from "@/lib/wg-lookup";
import { HafermilchClient } from "./HafermilchClient";

interface Props {
  params: { slug: string };
}

export default async function HafermilchPage({ params }: Props) {
  const gate = await gateWgSubpage(params.slug);
  if (!gate.ok) redirect(gate.redirectTo);

  return (
    <HafermilchClient
      slug={params.slug}
      wgName={gate.wg.name}
      meId={gate.userId}
    />
  );
}
