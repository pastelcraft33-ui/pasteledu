import Board from "@/components/Board";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Category, PptMaterial, SiteSettings } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function HomePage() {
  const supabase = createServerSupabaseClient();

  const [
    { data: settings, error: settingsError },
    { data: categories, error: categoriesError },
    { data: materials, error: materialsError }
  ] = await Promise.all([
    supabase.from("site_settings").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("categories").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    supabase.from("ppt_materials").select("*").order("created_at", { ascending: false })
  ]);
  const dataError = settingsError ?? categoriesError ?? materialsError;

  if (dataError && process.env.NODE_ENV === "development") {
    console.error("Failed to load library data from Supabase:", dataError);
  }

  return (
    <Board
      settings={settings as SiteSettings | null}
      categories={(categories ?? []) as Category[]}
      materials={(materials ?? []) as PptMaterial[]}
      hasDataError={Boolean(dataError)}
    />
  );
}
