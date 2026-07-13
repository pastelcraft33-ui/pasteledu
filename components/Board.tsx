"use client";

import { useEffect, useMemo, useState } from "react";
import BoardHeader from "@/components/BoardHeader";
import CategoryOverviewModal from "@/components/CategoryOverviewModal";
import CategoryColumn from "@/components/CategoryColumn";
import EmptyState from "@/components/EmptyState";
import MaterialModal from "@/components/MaterialModal";
import SearchBar from "@/components/SearchBar";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Category, CategoryGroup, PptMaterial, SiteSettings } from "@/lib/types";

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
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [query, setQuery] = useState("");
  const [activeCategoryGroup, setActiveCategoryGroup] = useState<CategoryGroup>("subject");
  const [selectedMaterial, setSelectedMaterial] = useState<PptMaterial | null>(null);
  const [overviewCategory, setOverviewCategory] = useState<{ category: Category | null } | null>(null);
  const [urlMaterialId, setUrlMaterialId] = useState<string | null>(null);
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

    if (!hasInitialServerData || hasDataError) {
      loadClientData();
    }

    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(Boolean(data.session));
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session));
    });

    return () => subscription.unsubscribe();
  }, [hasDataError, hasInitialServerData, supabase]);

  useEffect(() => {
    if (!selectedMaterial) return;

    const materialId = selectedMaterial.id;
    const startedAt = Date.now();
    let didRecordDuration = false;

    recordMaterialEvent(supabase, materialId, "click");

    function recordDuration() {
      if (didRecordDuration) return;
      didRecordDuration = true;
      const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      recordMaterialEvent(supabase, materialId, "duration", durationSeconds);
    }

    window.addEventListener("beforeunload", recordDuration);

    return () => {
      recordDuration();
      window.removeEventListener("beforeunload", recordDuration);
    };
  }, [selectedMaterial, supabase]);

  useEffect(() => {
    function syncMaterialIdFromUrl() {
      const params = new URLSearchParams(window.location.search);
      setUrlMaterialId(params.get("ppt"));
    }

    syncMaterialIdFromUrl();
    window.addEventListener("popstate", syncMaterialIdFromUrl);

    return () => window.removeEventListener("popstate", syncMaterialIdFromUrl);
  }, []);

  useEffect(() => {
    if (!urlMaterialId) {
      setSelectedMaterial(null);
      return;
    }

    const materialFromUrl = clientMaterials.find((material) => material.id === urlMaterialId);
    if (materialFromUrl) setSelectedMaterial(materialFromUrl);
  }, [clientMaterials, urlMaterialId]);

  function openMaterial(material: PptMaterial) {
    setOverviewCategory(null);
    setSelectedMaterial(material);
    setUrlMaterialId(material.id);
    updateMaterialUrl(material.id);
  }

  function closeMaterial() {
    setSelectedMaterial(null);
    setUrlMaterialId(null);
    updateMaterialUrl(null);
  }

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

  const visibleCategories = useMemo(() => {
    return clientCategories.filter((category) => getCategoryGroups(category).includes(activeCategoryGroup));
  }, [activeCategoryGroup, clientCategories]);

  const selectedCategoryName = selectedMaterial ? getMaterialCategoryNames(selectedMaterial, clientCategories) : "미분류";
  const uncategorizedMaterials = filteredMaterials.filter((material) => !material.category_id && !material.secondary_category_id);
  const hasSearchResults = filteredMaterials.length > 0;
  const shouldShowUncategorized = uncategorizedMaterials.length > 0;
  const shouldShowCategoryEmpty = visibleCategories.length === 0 && !normalizedQuery && !shouldShowUncategorized && !isClientLoading;
  const shouldShowBoard = (visibleCategories.length > 0 || shouldShowUncategorized) && (hasSearchResults || !normalizedQuery);

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
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
            <BoardHeader />
            <div className="w-full lg:max-w-2xl">
              <SearchBar
                value={query}
                onChange={setQuery}
                resultCount={filteredMaterials.length}
                showResultCount={Boolean(normalizedQuery)}
                borderColor={viewSettings.card_border_color}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="카테고리 보기 선택">
            {categoryGroupTabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveCategoryGroup(item.id)}
                className="rounded-md border px-4 py-2 text-sm font-extrabold transition sm:text-base"
                style={{
                  backgroundColor: activeCategoryGroup === item.id ? viewSettings.button_color : viewSettings.card_background_color,
                  borderColor: viewSettings.card_border_color,
                  color: activeCategoryGroup === item.id ? "#ffffff" : viewSettings.text_color
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
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
            {visibleCategories.map((category) => (
              <CategoryColumn
                key={category.id}
                category={category}
                materials={filteredMaterials.filter((material) => isMaterialInCategory(material, category.id))}
                hasMaterials={clientMaterials.some((material) => isMaterialInCategory(material, category.id))}
                settings={viewSettings}
                onSelectMaterial={openMaterial}
                onViewAll={() => setOverviewCategory({ category })}
              />
            ))}
            {shouldShowUncategorized ? (
              <CategoryColumn
                category={null}
                materials={uncategorizedMaterials}
                hasMaterials={clientMaterials.some((material) => !material.category_id && !material.secondary_category_id)}
                settings={viewSettings}
                onSelectMaterial={openMaterial}
                onViewAll={() => setOverviewCategory({ category: null })}
              />
            ) : null}
          </div>
        ) : null}
      </section>

      {overviewCategory ? (
        <CategoryOverviewModal
          category={overviewCategory.category}
          materials={clientMaterials.filter((material) =>
            overviewCategory.category
              ? isMaterialInCategory(material, overviewCategory.category.id)
              : !material.category_id && !material.secondary_category_id
          )}
          settings={viewSettings}
          onSelectMaterial={openMaterial}
          onClose={() => setOverviewCategory(null)}
        />
      ) : null}

      {selectedMaterial ? (
        <MaterialModal
          material={selectedMaterial}
          categoryName={selectedCategoryName}
          settings={viewSettings}
          onClose={closeMaterial}
        />
      ) : null}
    </main>
  );
}

const categoryGroupTabs: Array<{ id: CategoryGroup; label: string }> = [
  { id: "subject", label: "주제별" },
  { id: "month", label: "월별" }
];

function getCategoryGroups(category: Category) {
  return category.category_groups?.length ? category.category_groups : (["subject"] as CategoryGroup[]);
}

function isMaterialInCategory(material: PptMaterial, categoryId: string) {
  return material.category_id === categoryId || material.secondary_category_id === categoryId;
}

function getMaterialCategoryNames(material: PptMaterial, categories: Category[]) {
  const names = [material.category_id, material.secondary_category_id]
    .filter((id): id is string => Boolean(id))
    .map((id) => categories.find((category) => category.id === id)?.name)
    .filter(Boolean);

  return names.length > 0 ? names.join(", ") : "미분류";
}

function updateMaterialUrl(materialId: string | null) {
  const url = new URL(window.location.href);
  if (materialId) {
    url.searchParams.set("ppt", materialId);
  } else {
    url.searchParams.delete("ppt");
  }

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.pushState({}, "", nextUrl);
}

function recordMaterialEvent(
  supabase: ReturnType<typeof createBrowserSupabaseClient>,
  materialId: string,
  eventType: "click" | "duration",
  durationSeconds?: number
) {
  supabase
    .from("ppt_material_events")
    .insert({
      material_id: materialId,
      event_type: eventType,
      duration_seconds: durationSeconds ?? null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null
    })
    .then(({ error }) => {
      if (error && process.env.NODE_ENV === "development") {
        console.error("PPT 통계 이벤트 저장 실패", error);
      }
    });
}
