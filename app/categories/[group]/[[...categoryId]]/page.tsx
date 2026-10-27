import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Board from "@/components/Board";
import { loadLibraryData } from "@/lib/library-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type Props = { params: { group: string; categoryId?: string[] } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (params.group !== "month" && params.group !== "subject") return {};
  const data = await loadLibraryData();
  const category = data.categories.find((item) => item.id === params.categoryId?.[0]);
  return { title: (category?.name ?? (params.group === "month" ? "월별 수업자료" : "주제별 수업자료")) + " | 파스텔에듀" };
}

export default async function CategoryPage({ params }: Props) {
  const { group, categoryId } = params;
  if ((group !== "month" && group !== "subject") || (categoryId && categoryId.length !== 1)) notFound();
  const data = await loadLibraryData();
  const id = categoryId?.[0];
  if (id && !data.hasDataError) {
    const category = data.categories.find((item) => item.id === id);
    const groups = category?.category_groups?.length ? category.category_groups : ["subject"];
    if (!category || !groups.includes(group)) notFound();
  }
  return <Board key={group + ":" + (id ?? "all")} {...data} initialView={group} categoryId={id} />;
}
