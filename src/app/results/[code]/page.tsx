import { notFound } from "next/navigation";
import * as store from "@/lib/store";
import { ResultsView } from "./ResultsView";

export const metadata = { title: "Resultados · Copa Ciega" };

export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { code } = await params;
  const { print } = await searchParams;
  if (!store.getEventByCode(code)) notFound();
  return <ResultsView code={code.toUpperCase()} print={print === "1"} />;
}
