"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Shapes, ShoppingBag, type LucideIcon } from "lucide-react";
import BoardHeader from "@/components/BoardHeader";
import CategoryOverviewModal from "@/components/CategoryOverviewModal";
import CategoryColumn from "@/components/CategoryColumn";
import EmptyState from "@/components/EmptyState";
import LibraryBanner from "@/components/LibraryBanner";
import LibrarySectionNav from "@/components/LibrarySectionNav";
import MaterialModal from "@/components/MaterialModal";
import SearchBar from "@/components/SearchBar";
import CategoryCardGrid from "@/components/CategoryCardGrid";
import { libraryBannerDefaults, resolveLibraryBannerImage, resolveLibraryBannerTitle } from "@/lib/library-banners";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Category, CategoryGroup, LibrarySection, LibraryView, MaterialEventType, PptMaterial, SiteSettings } from "@/lib/types";

type Props = {
  settings: SiteSettings | null;
  categories: Category[];
  materials: PptMaterial[];
  hasDataError?: boolean;
};

type ActiveLibraryView = LibraryView | "home";

const fallbackSettings: Omit<SiteSettings, "id" | "created_at" | "updated_at"> = {
  site_name: "Pastel PPT Library",
  header_title: "파스텔에듀 수업자료실",
  header_description: "",
  logo_url: null,
  favicon_url: null,
  background_color: "#ffffff",
  header_background_color: "#ffffff",
  banner_background_color: "#fce7f3",
  banner_text_color: "#db3f72",
  month_banner_image_url: null,
  subject_banner_image_url: null,
  kindergarten_banner_title: libraryBannerDefaults.kindergarten.title,
  kindergarten_banner_description: "유아 눈높이에 맞춘 즐거운 수업자료를 확인해보세요.",
  kindergarten_banner_image_url: libraryBannerDefaults.kindergarten.imageUrl,
  elementary_banner_title: libraryBannerDefaults.elementary.title,
  elementary_banner_description: "초등 수업에 바로 활용할 수 있는 자료를 모았습니다.",
  elementary_banner_image_url: libraryBannerDefaults.elementary.imageUrl,
  senior_banner_title: libraryBannerDefaults.senior.title,
  senior_banner_description: "시니어 학습과 활동을 위한 자료를 만나보세요.",
  senior_banner_image_url: libraryBannerDefaults.senior.imageUrl,
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
  const [activeView, setActiveView] = useState<ActiveLibraryView>("home");
  const [selectedMaterial, setSelectedMaterial] = useState<PptMaterial | null>(null);
  const [overviewCategory, setOverviewCategory] = useState<Category | null>(null);
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
    setSelectedMaterial(material);
    setUrlMaterialId(material.id);
    updateMaterialUrl(material.id);
  }

  function closeMaterial() {
    setSelectedMaterial(null);
    setUrlMaterialId(null);
    updateMaterialUrl(null);
  }

  function recordDownload(material: PptMaterial) {
    recordMaterialEvent(supabase, material.id, "download");
  }

  function goHome() {
    setActiveView("home");
    setQuery("");
    setOverviewCategory(null);
    setSelectedMaterial(null);
    setUrlMaterialId(null);
    updateMaterialUrl(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const isHome = activeView === "home";
  const activeCategoryGroup = isCategoryGroup(activeView) ? activeView : null;
  const activeLibrarySection = isLibrarySection(activeView) ? activeView : null;

  const viewMaterials = useMemo(() => {
    if (activeView === "home") return clientMaterials;

    if (isLibrarySection(activeView)) {
      return clientMaterials.filter((material) => getMaterialLibrarySections(material).includes(activeView));
    }

    return clientMaterials.filter((material) =>
      activeView === "month" ? Boolean(material.secondary_category_id) : Boolean(material.category_id)
    );
  }, [activeView, clientMaterials]);

  const filteredMaterials = useMemo(() => {
    if (!normalizedQuery) return viewMaterials;

    return viewMaterials.filter((material) => {
      const searchable = [
        material.title,
        material.description ?? "",
        ...(material.tags ?? [])
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [normalizedQuery, viewMaterials]);

  const visibleCategories = useMemo(() => {
    if (!activeCategoryGroup) return [];
    const groupedCategories = clientCategories.filter((category) => getCategoryGroups(category).includes(activeCategoryGroup));

    if (!normalizedQuery) return groupedCategories;

    return groupedCategories.filter((category) =>
      filteredMaterials.some((material) => isMaterialInCategoryGroup(material, category.id, activeCategoryGroup))
    );
  }, [activeCategoryGroup, clientCategories, filteredMaterials, normalizedQuery]);

  const selectedCategoryName = selectedMaterial ? getMaterialCategoryNames(selectedMaterial, clientCategories) : "미분류";
  const hasSearchResults = filteredMaterials.length > 0;
  const shouldShowCategoryEmpty = Boolean(activeCategoryGroup) && clientCategories.length === 0 && !normalizedQuery && !isClientLoading;
  const shouldShowViewEmpty = !isHome && !activeCategoryGroup && !shouldShowCategoryEmpty && viewMaterials.length === 0 && !normalizedQuery && !isClientLoading;
  const shouldShowGroupEmpty = Boolean(activeCategoryGroup) && viewMaterials.length > 0 && visibleCategories.length === 0 && !normalizedQuery && !isClientLoading;
  const shouldShowBoard = (hasSearchResults || !normalizedQuery) && (
    isHome
      ? !normalizedQuery || filteredMaterials.length > 0
      : activeLibrarySection
        ? filteredMaterials.length > 0
        : visibleCategories.length > 0
  );
  const customBanner = isHome ? null : getLibraryBannerSettings(activeView, viewSettings);

  return (
    <main
      className="flex min-h-screen flex-col"
      style={{
        backgroundColor: viewSettings.background_color,
        color: viewSettings.text_color,
        fontFamily: viewSettings.font_family
      }}
    >
      <section
        className="border-b px-4 py-3 sm:px-8 sm:py-4"
        style={{ backgroundColor: viewSettings.header_background_color, borderColor: viewSettings.card_border_color }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-8">
            <BoardHeader onHome={goHome} />
            <div className="w-full md:flex-1">
              <SearchBar
                value={query}
                onChange={setQuery}
                resultCount={filteredMaterials.length}
                showResultCount={Boolean(normalizedQuery)}
                borderColor={viewSettings.card_border_color}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3" aria-label="자료실 메뉴">
            <a
              href="https://www.pastelclay.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full border px-3 py-2 text-base font-extrabold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:min-h-[50px] sm:px-5 sm:py-2.5 sm:text-lg"
              style={{
                backgroundColor: `color-mix(in srgb, ${shoppingAccent} 6%, ${viewSettings.card_background_color})`,
                borderColor: viewSettings.card_border_color,
                color: viewSettings.text_color
              }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full sm:h-8 sm:w-8"
                style={{
                  backgroundColor: `color-mix(in srgb, ${shoppingAccent} 18%, ${viewSettings.card_background_color})`,
                  color: shoppingAccent
                }}
                aria-hidden="true"
              >
                <ShoppingBag className="h-4 w-4 stroke-[2.5] sm:h-[18px] sm:w-[18px]" />
              </span>
              쇼핑
            </a>
            {categoryGroupTabs.map((item) => {
              const isActive = activeView === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full border px-3 py-2 text-base font-extrabold transition hover:-translate-y-0.5 hover:shadow-md sm:min-h-[50px] sm:px-5 sm:py-2.5 sm:text-lg"
                  style={{
                    backgroundColor: isActive
                      ? `color-mix(in srgb, ${item.accent} 13%, ${viewSettings.card_background_color})`
                      : viewSettings.card_background_color,
                    borderColor: isActive ? item.accent : viewSettings.card_border_color,
                    color: isActive ? item.accent : viewSettings.text_color,
                    boxShadow: isActive ? "0 4px 12px rgba(15, 23, 42, 0.10)" : "none"
                  }}
                  aria-pressed={isActive}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full sm:h-8 sm:w-8"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${item.accent} ${isActive ? 23 : 14}%, ${viewSettings.card_background_color})`,
                      color: item.accent
                    }}
                    aria-hidden="true"
                  >
                    <Icon className="h-4 w-4 stroke-[2.5] sm:h-[18px] sm:w-[18px]" />
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <LibrarySectionNav
        activeSection={activeLibrarySection}
        onChange={setActiveView}
        textColor={viewSettings.text_color}
        backgroundColor={viewSettings.header_background_color}
        borderColor={viewSettings.card_border_color}
      />

      {!isHome && customBanner ? (
        <LibraryBanner
          view={activeView}
          title={customBanner.title}
          description={customBanner.description}
          imageUrl={customBanner.imageUrl}
          backgroundColor={viewSettings.banner_background_color}
          textColor={customBanner.textColor}
          borderColor={viewSettings.card_border_color}
        />
      ) : null}

      <section className="flex-1 px-4 py-5 sm:px-8 sm:py-6">
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

        {shouldShowViewEmpty ? (
          <EmptyState
            title={`${getLibraryViewLabel(activeView)}에 등록된 자료가 없습니다.`}
            description={isHome || activeLibrarySection ? "관리자 페이지에서 자료의 노출 영역을 선택해주세요." : "관리자 페이지에서 자료의 카테고리를 선택해주세요."}
            actionHref={isLoggedIn ? "/admin" : undefined}
            actionLabel={isLoggedIn ? "관리자 페이지로 이동" : undefined}
            buttonColor={viewSettings.button_color}
            borderColor={viewSettings.card_border_color}
          />
        ) : null}

        {shouldShowGroupEmpty ? (
          <EmptyState
            title={`${activeCategoryGroup === "month" ? "월별" : "주제별"}로 분류된 자료가 없습니다.`}
            description="다른 분류 버튼을 선택하거나 관리자 페이지에서 카테고리를 지정해주세요."
            buttonColor={viewSettings.button_color}
            borderColor={viewSettings.card_border_color}
          />
        ) : null}

        {shouldShowBoard ? (
          <div className="mx-auto min-h-[620px] max-w-7xl space-y-8">
            {isHome
              ? librarySections.map((section) => {
                  const sectionMaterials = filteredMaterials
                    .filter((material) => getMaterialLibrarySections(material).includes(section))
                    .slice(0, 8);
                  const sectionBanner = getLibraryBannerSettings(section, viewSettings);

                  return (
                    <CategoryColumn
                      key={section}
                      category={null}
                      titleOverride={sectionBanner.title}
                      descriptionOverride={sectionBanner.description}
                      materials={sectionMaterials}
                      hasMaterials
                      settings={viewSettings}
                      onSelectMaterial={openMaterial}
                      onDownloadMaterial={recordDownload}
                      onViewAll={() => setActiveView(section)}
                    />
                  );
                })
              : null}
            {activeLibrarySection ? (
              <CategoryColumn
                category={null}
                titleOverride={`${getLibrarySectionLabel(activeLibrarySection)} 전체 자료`}
                descriptionOverride={`${getLibrarySectionLabel(activeLibrarySection)}으로 등록된 모든 자료입니다.`}
                materials={filteredMaterials}
                settings={viewSettings}
                onSelectMaterial={openMaterial}
                onDownloadMaterial={recordDownload}
              />
            ) : null}
            {activeCategoryGroup ? (
              <CategoryCardGrid
                categories={visibleCategories}
                materials={normalizedQuery ? filteredMaterials : viewMaterials}
                group={activeCategoryGroup}
                settings={viewSettings}
                onSelectCategory={setOverviewCategory}
              />
            ) : null}
          </div>
        ) : null}
      </section>

      <footer
        className="border-t px-4 py-6 text-center sm:px-8"
        style={{ backgroundColor: viewSettings.header_background_color, borderColor: viewSettings.card_border_color }}
      >
        <p className="text-sm font-medium opacity-70">ⓒ Pastel edu. All rights reserved.</p>
        <a
          href="/login"
          className="mt-3 inline-flex items-center justify-center rounded-md px-5 py-2.5 text-base font-bold text-white shadow-sm"
          style={{ backgroundColor: viewSettings.button_color }}
        >
          관리자 로그인
        </a>
      </footer>

      {overviewCategory && activeCategoryGroup ? (
        <CategoryOverviewModal
          category={overviewCategory}
          materials={clientMaterials.filter((material) =>
            isMaterialInCategoryGroup(material, overviewCategory.id, activeCategoryGroup)
          )}
          settings={viewSettings}
          onSelectMaterial={openMaterial}
          onDownloadMaterial={recordDownload}
          onClose={() => setOverviewCategory(null)}
        />
      ) : null}

      {selectedMaterial ? (
        <MaterialModal
          material={selectedMaterial}
          categoryName={selectedCategoryName}
          settings={viewSettings}
          onDownload={() => recordDownload(selectedMaterial)}
          onClose={closeMaterial}
        />
      ) : null}
    </main>
  );
}

const shoppingAccent = "#168C7A";

const categoryGroupTabs: Array<{ id: CategoryGroup; label: string; icon: LucideIcon; accent: string }> = [
  { id: "month", label: "월별", icon: CalendarDays, accent: "#D97706" },
  { id: "subject", label: "주제별", icon: Shapes, accent: "#7557B7" }
];

const librarySections: LibrarySection[] = ["kindergarten", "elementary", "senior"];

function getMaterialLibrarySections(material: PptMaterial): LibrarySection[] {
  return material.library_sections?.length ? material.library_sections : ["elementary"];
}

function getLibrarySectionLabel(section: LibrarySection) {
  if (section === "kindergarten") return "유치원관";
  if (section === "senior") return "시니어관";
  return "초등관";
}

function getLibraryViewLabel(view: ActiveLibraryView) {
  if (view === "home") return "메인 자료실";
  if (view === "month") return "월별 수업자료";
  if (view === "subject") return "주제별 수업자료";
  return getLibrarySectionLabel(view);
}

function getLibraryBannerSettings(
  view: LibraryView,
  settings: Omit<SiteSettings, "id" | "created_at" | "updated_at">
) {
  if (view === "month") {
    return {
      title: undefined,
      description: undefined,
      imageUrl: settings.month_banner_image_url,
      textColor: settings.banner_text_color
    };
  }
  if (view === "subject") {
    return {
      title: undefined,
      description: undefined,
      imageUrl: settings.subject_banner_image_url,
      textColor: settings.banner_text_color
    };
  }
  if (view === "kindergarten") {
    return {
      title: resolveLibraryBannerTitle(view, settings.kindergarten_banner_title),
      description: settings.kindergarten_banner_description ?? undefined,
      imageUrl: resolveLibraryBannerImage(view, settings.kindergarten_banner_image_url),
      textColor: libraryBannerDefaults[view].textColor
    };
  }
  if (view === "elementary") {
    return {
      title: resolveLibraryBannerTitle(view, settings.elementary_banner_title),
      description: settings.elementary_banner_description ?? undefined,
      imageUrl: resolveLibraryBannerImage(view, settings.elementary_banner_image_url),
      textColor: libraryBannerDefaults[view].textColor
    };
  }
  if (view === "senior") {
    return {
      title: resolveLibraryBannerTitle(view, settings.senior_banner_title),
      description: settings.senior_banner_description ?? undefined,
      imageUrl: resolveLibraryBannerImage(view, settings.senior_banner_image_url),
      textColor: libraryBannerDefaults[view].textColor
    };
  }

  return { title: undefined, description: undefined, imageUrl: null, textColor: settings.banner_text_color };
}

function isCategoryGroup(view: ActiveLibraryView): view is CategoryGroup {
  return view === "month" || view === "subject";
}

function isLibrarySection(view: ActiveLibraryView): view is LibrarySection {
  return view === "kindergarten" || view === "elementary" || view === "senior";
}

function isMaterialInCategoryGroup(material: PptMaterial, categoryId: string, group: CategoryGroup) {
  return group === "month" ? material.secondary_category_id === categoryId : material.category_id === categoryId;
}

function getCategoryGroups(category: Category): CategoryGroup[] {
  return category.category_groups?.length ? category.category_groups : ["subject"];
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
  eventType: MaterialEventType,
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
