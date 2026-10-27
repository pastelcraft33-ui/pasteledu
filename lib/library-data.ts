import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Category, PptMaterial, SiteSettings } from "@/lib/types";

export const loadLibraryData = cache(async () => {
  const supabase = createServerSupabaseClient();
  const [settings, categories, materials] = await Promise.all([
    supabase.from("site_settings").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("categories").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    supabase.from("ppt_materials").select("*").order("created_at", { ascending: false })
  ]);
  const error = settings.error ?? categories.error ?? materials.error;
  if (error && process.env.NODE_ENV === "development") console.error("자료실 데이터를 불러오지 못했습니다.", error);

  return {
    settings: settings.data as SiteSettings | null,
    categories: (categories.data ?? []) as Category[],
    materials: (materials.data ?? []) as PptMaterial[],
    hasDataError: Boolean(error)
  };
});
