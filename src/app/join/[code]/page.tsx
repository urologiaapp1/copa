import { notFound } from "next/navigation";
import * as store from "@/lib/store";
import { JoinForm } from "./JoinForm";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const event = await store.getEventByCode(code);
  if (!event) notFound();

  const closed = event.status === "closed" || event.status === "revealed";

  return (
    <JoinForm code={event.code} title={event.title} modalityKey={event.modality} closed={closed} />
  );
}
