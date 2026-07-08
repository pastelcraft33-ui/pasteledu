"use client";

import { useEffect, useMemo, useState } from "react";
import BoardHeader from "@/components/BoardHeader";
import CategoryColumn from "@/components/CategoryColumn";
import EmptyState from "@/components/EmptyState";
import MaterialModal from "@/components/MaterialModal";
import SearchBar from "@/components/SearchBar";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Category, PptMaterial, SiteSettings } from "@/lib/types";

type Props = {
  settings: SiteSettings | null;
  categories: Category[];
  materials: PptMaterial[];
  hasDataError?: boolean;
};

const fallbackSettings: Omit<SiteSettings, "id" | "created_at" | "updated_at"> = {
  site_name: "Pastel PPT Library",
  header_title: "파스텔에듀 수업자료실",
  header_description: "",
  logo_url: null,
  favicon_url: null,
  background_color: "#ffffff",
  header_background_color: "#ffffff",
  default_column_color: "#ffffff",
  card_background_color: "#ffffff",
  card_border_color: "#e5e7eb",
  button_color: "#111827",
  text_color: "#111827",
  font_family: "system-ui",
  card_radius: 12,
  use_card_shadow: true
};

export default function Board({ settings, categories, materials, hasDataError = false }: Props) {
  const [query, setQuery] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<PptMaterial | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [clientSettings, setClientSettings] = useState<SiteSettings | null>(settings);
  const [clientCategories, setClientCategories] = useState<Category[]>(categories);
  const [clientMaterials, setClientMaterials] = useState<PptMaterial[]>(materials);
  const [clientDataError, setClientDataError] = useState(hasDataError);
  const [isClientLoading, setIsClientLoading] = useState(categories.length === 0 && materials.length === 0 && !settings);
  const viewSettings = { ...fallbackSettings, ...clientSettings };
  const normalizedQuery = query.trim().toLowerCase();
  const hasInitialServerData = categories.length > 0 || materials.length > 0 || Boolean(settings);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    async function loadClientData() {
      if (!hasInitialServerData) setIsClientLoading(true);
      const timeout = new Promise<"timeout">((resolve) => {
        window.setTimeout(() => resolve("timeout"), 8000);
      });
      const request = Promise.all([
        supabase.from("site_settings").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle(),
        supabase.from("categories").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
        supabase.from("ppt_materials").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true })
      ]);
      const result = await Promise.race([request, timeout]);

      if (result === "timeout") {
        console.error("자료실 데이터를 불러오지 못했습니다. Supabase 요청 시간이 초과되었습니다.");
        setClientDataError(!hasInitialServerData);
        setIsClientLoading(false);
        return;
      }

      const [
        { data: settingRows, error: settingsError },
        { data: categoryRows, error: categoriesError },
        { data: materialRows, error: materialsError }
      ] = result;

      const firstError = settingsError ?? categoriesError ?? materialsError;
      if (firstError) {
        console.error("자료실 데이터를 불러오지 못했습니다.", firstError);
        setClientDataError(!hasInitialServerData);
      } else {
        setClientSettings(settingRows as SiteSettings | null);
        setClientCategories((categoryRows ?? []) as Category[]);
        setClientMaterials((materialRows ?? []) as PptMaterial[]);
        setClientDataError(false);
      }
      setIsClientLoading(false);
    }

    loadClientData();

    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(Boolean(data.session));
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session));
    });

    return () => subscription.unsubscribe();
  }, [hasInitialServerData]);

  const filteredMaterials = useMemo(() => {
    if (!normalizedQuery) return clientMaterials;

    return clientMaterials.filter((material) => {
      const searchable = [
        material.title,
        material.description ?? "",
        ...(material.tags ?? [])
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [clientMaterials, normalizedQuery]);

  const selectedCategory = selectedMaterial
    ? clientCategories.find((category) => category.id === selectedMaterial.category_id) ?? null
    : null;
  const uncategorizedMaterials = filteredMaterials.filter((material) => !material.category_id);
  const hasSearchResults = filteredMaterials.length > 0;
  const shouldShowUncategorized = uncategorizedMaterials.length > 0;
  const shouldShowCategoryEmpty = clientCategories.length === 0 && !normalizedQuery && !shouldShowUncategorized && !isClientLoading;
  const shouldShowBoard = (clientCategories.length > 0 || shouldShowUncategorized) && (hasSearchResults || !normalizedQuery);

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: viewSettings.background_color,
        color: viewSettings.text_color,
        fontFamily: viewSettings.font_family
      }}
    >
      <section
        className="border-b px-4 py-1 sm:px-8 sm:py-1.5"
        style={{ backgroundColor: viewSettings.header_background_color, borderColor: viewSettings.card_border_color }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-1.5 sm:gap-2">
          <BoardHeader settings={viewSettings} isLoggedIn={isLoggedIn} />
          <SearchBar
            value={query}
            onChange={setQuery}
            resultCount={filteredMaterials.length}
            showResultCount={Boolean(normalizedQuery)}
            borderColor={viewSettings.card_border_color}
          />
        </div>
      </section>

      <section className="px-4 py-5 sm:px-8 sm:py-6">
        {clientDataError ? (
          <EmptyState
            title="자료실 데이터를 불러오지 못했습니다."
            description="Supabase 연결 정보 또는 RLS 정책을 확인해주세요."
            buttonColor={viewSettings.button_color}
            borderColor={viewSettings.card_border_color}
            tone="error"
          />
        ) : null}

        {isClientLoading ? <p className="text-sm opacity-70">자료실을 불러오는 중입니다...</p> : null}

        {!hasSearchResults && normalizedQuery ? (
          <EmptyState
            title="검색 결과가 없습니다."
            description="다른 검색어로 다시 찾아보세요."
            buttonColor={viewSettings.button_color}
            borderColor={viewSettings.card_border_color}
          />
        ) : null}

        {shouldShowCategoryEmpty ? (
          <EmptyState
            title="등록된 카테고리가 없습니다."
            description={"관리자로 로그인한 뒤 카테고리를 추가해주세요.\nSupabase SQL seed를 아직 실행하지 않았다면 supabase/schema.sql을 Supabase SQL Editor에서 실행해야 합니다."}
            detail="개발 중이라면 Supabase Table Editor에서 categories 테이블에 데이터가 있는지 확인해주세요."
            actionHref={isLoggedIn ? "/admin" : "/login"}
            actionLabel={isLoggedIn ? "관리자 페이지로 이동" : "로그인하기"}
            buttonColor={viewSettings.button_color}
            borderColor={viewSettings.card_border_color}
          />
        ) : null}

        {shouldShowBoard ? (
          <div className="mx-auto grid min-h-[620px] max-w-7xl items-start gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {clientCategories.map((category) => (
              <CategoryColumn
                key={category.id}
                category={category}
                materials={filteredMaterials.filter((material) => material.category_id === category.id)}
                settings={viewSettings}
                onSelectMaterial={setSelectedMaterial}
              />
            ))}
            {shouldShowUncategorized ? (
              <CategoryColumn
                category={null}
                materials={uncategorizedMaterials}
                settings={viewSettings}
                onSelectMaterial={setSelectedMaterial}
              />
            ) : null}
          </div>
        ) : null}
      </section>

      {selectedMaterial ? (
        <MaterialModal
          material={selectedMaterial}
          categoryName={selectedCategory?.name ?? "미분류"}
          settings={viewSettings}
          onClose={() => setSelectedMaterial(null)}
        />
      ) : null}
    </main>
  );
}
