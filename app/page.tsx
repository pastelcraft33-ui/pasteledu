import Board from "@/components/Board";
import { loadLibraryData } from "@/lib/library-data";
import { resolveHomeView } from "@/lib/library-navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function HomePage({ searchParams }: { searchParams: { view?: string | string[] } }) {
  const data = await loadLibraryData();
  const initialView = resolveHomeView(searchParams.view);
  return <Board key={initialView} {...data} initialView={initialView} />;
}
