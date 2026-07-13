"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminAnalytics from "@/components/AdminAnalytics";
import AdminBulkUpload from "@/components/AdminBulkUpload";
import AdminCategories from "@/components/AdminCategories";
import AdminDesignSettings from "@/components/AdminDesignSettings";
import AdminMaterials from "@/components/AdminMaterials";
import AdminOrderManager from "@/components/AdminOrderManager";
import AdminSiteSettings from "@/components/AdminSiteSettings";
import AdminThumbnails from "@/components/AdminThumbnails";
import { isAllowedAdminEmail } from "@/lib/admin";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Category, PptMaterialWithCategory, SiteSettings } from "@/lib/types";

type Tab = "materials" | "categories" | "site" | "design" | "bulk" | "order" | "thumbnails" | "analytics";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "materials", label: "PPT 자료 관리" },
  { id: "categories", label: "카테고리 관리" },
  { id: "site", label: "사이트 정보 설정" },
  { id: "design", label: "디자인 설정" },
  { id: "bulk", label: "대량 업로드" },
  { id: "order", label: "순서 관리" },
  { id: "thumbnails", label: "썸네일 관리" },
  { id: "analytics", label: "방문 통계" }
];

export default function AdminPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [tab, setTab] = useState<Tab>("materials");
  const [isChecking, setIsChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [authBlocked, setAuthBlocked] = useState(false);
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [materials, setMaterials] = useState<PptMaterialWithCategory[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [hasOrderDraft, setHasOrderDraft] = useState(false);

  const summaryItems = useMemo(
    () => [
      { label: "전체 자료", value: `${materials.length}개` },
      { label: "카테고리", value: `${categories.length}개` },
      { label: "다운로드 가능", value: `${materials.filter((material) => material.is_downloadable).length}개` },
      { label: "미분류", value: `${materials.filter((material) => !material.category_id && !material.secondary_category_id).length}개` }
    ],
    [categories.length, materials]
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    let categoryRows = null;
    let materialRows = null;
    let settingRow = null;
    let categoryError = null;
    let materialError = null;
    let settingError = null;

    try {
      const results = await withTimeout(
        Promise.all([
          supabase.from("categories").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
          supabase
            .from("ppt_materials")
            .select("*")
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false }),
          supabase.from("site_settings").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle()
        ]),
        10000,
        "ADMIN_DATA_TIMEOUT"
      );

      categoryRows = results[0].data;
      categoryError = results[0].error;
      materialRows = results[1].data;
      materialError = results[1].error;
      settingRow = results[2].data;
      settingError = results[2].error;
    } catch (error) {
      console.error("Admin data load timeout", error);
      setMessage("데이터를 불러오는 시간이 너무 오래 걸립니다. Supabase 연결 상태와 인터넷 연결을 확인해주세요.");
      setIsLoading(false);
      return;
    }

    const firstError = categoryError ?? materialError ?? settingError;
    if (firstError) {
      console.error("Admin data load error", firstError);
      setMessage("데이터를 불러오지 못했습니다. Supabase 설정과 로그인 상태를 확인해주세요.");
      setIsLoading(false);
      return;
    }

    setCategories((categoryRows ?? []) as Category[]);
    setMaterials((materialRows ?? []) as PptMaterialWithCategory[]);
    setSettings(settingRow as SiteSettings | null);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    async function checkAdminSession() {
      try {
        const { data, error } = await withTimeout(supabase.auth.getSession(), 8000, "ADMIN_AUTH_TIMEOUT");
        if (!isMounted) return;

        if (error) {
          setMessage("로그인 정보가 만료되었습니다. 다시 로그인해주세요.");
          setIsChecking(false);
          setIsLoading(false);
          setAuthBlocked(true);
          router.replace("/login");
          return;
        }
        if (!data.session) {
          setIsChecking(false);
          setIsLoading(false);
          setAuthBlocked(true);
          router.replace("/login");
          return;
        }
        if (!isAllowedAdminEmail(data.session.user.email)) {
          setMessage("허용된 관리자 계정이 아닙니다. 다시 로그인해주세요.");
          setIsChecking(false);
          setIsLoading(false);
          setAuthBlocked(true);
          supabase.auth.signOut().finally(() => router.replace("/login"));
          return;
        }
        setUserEmail(data.session.user.email ?? "");
        setAuthBlocked(false);
        setIsChecking(false);
        loadData();
      } catch (error) {
        if (!isMounted) return;
        console.error("Admin auth check timeout", error);
        setMessage("관리자 권한 확인 시간이 너무 오래 걸립니다. Supabase 연결 정보, 인터넷 연결, 브라우저 세션을 확인해주세요.");
        setIsChecking(false);
        setIsLoading(false);
        setAuthBlocked(true);
      }
    }

    checkAdminSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/login");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadData, router, supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function handleTabChange(nextTab: Tab) {
    if (tab === "order" && hasOrderDraft && nextTab !== "order") {
      const shouldMove = window.confirm("저장되지 않은 순서 변경사항이 있습니다. 이동하시겠습니까?");
      if (!shouldMove) return;
      setHasOrderDraft(false);
    }

    setTab(nextTab);
  }

  if (isChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-gray-900">
        <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold">관리자 권한을 확인하고 있습니다.</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Supabase 로그인 세션을 확인하는 중입니다. 이 화면이 오래 유지되면 인터넷 연결 또는 Supabase 프로젝트 연결 상태를 확인해주세요.
          </p>
        </div>
      </main>
    );
  }

  if (authBlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-gray-900">
        <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold">관리자 권한을 확인하지 못했습니다.</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            {message || "로그인 정보가 없거나 Supabase 인증 확인이 지연되고 있습니다."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => window.location.reload()} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-bold text-white">
              다시 확인
            </button>
            <a href="/login" className="rounded-md border bg-white px-4 py-2 text-sm font-semibold">
              로그인으로 이동
            </a>
            <a href="/" className="rounded-md border bg-white px-4 py-2 text-sm font-semibold">
              메인으로 이동
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 text-gray-900 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Pastel PPT Library 관리자</h1>
            <p className="mt-1 text-sm text-gray-600">
              현재 로그인: <span className="font-semibold">{userEmail || "이메일 정보 없음"}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/" className="rounded-md border bg-white px-4 py-2 text-sm font-semibold">
              메인 보기
            </a>
            <button type="button" onClick={handleLogout} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
              로그아웃
            </button>
          </div>
          </div>
        </header>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="관리자 요약">
          {summaryItems.map((item) => (
            <div key={item.label} className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-500">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-gray-950">{item.value}</p>
            </div>
          ))}
        </section>

        <nav className="mt-6 flex gap-2 overflow-x-auto rounded-xl border bg-white p-2 shadow-sm" aria-label="관리자 메뉴">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabChange(item.id)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === item.id ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {message ? (
          <div className="mt-4 flex items-start justify-between gap-3 rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
            <p>{message}</p>
            <button type="button" onClick={() => setMessage("")} className="font-semibold text-blue-900" aria-label="알림 닫기">
              닫기
            </button>
          </div>
        ) : null}
        {isLoading ? <p className="mt-6">데이터를 불러오는 중...</p> : null}

        <section className="mt-6">
          {tab === "materials" ? (
            <AdminMaterials
              categories={categories}
              materials={materials}
              onChanged={loadData}
              setMessage={setMessage}
            />
          ) : null}
          {tab === "categories" ? (
            <AdminCategories categories={categories} materials={materials} onChanged={loadData} setMessage={setMessage} />
          ) : null}
          {tab === "site" ? (
            <AdminSiteSettings settings={settings} onChanged={loadData} setMessage={setMessage} />
          ) : null}
          {tab === "design" ? (
            <AdminDesignSettings settings={settings} onChanged={loadData} setMessage={setMessage} />
          ) : null}
          {tab === "bulk" ? (
            <AdminBulkUpload
              categories={categories}
              materials={materials}
              onChanged={loadData}
              setMessage={setMessage}
              onMoveToMaterials={() => setTab("materials")}
            />
          ) : null}
          {tab === "order" ? (
            <AdminOrderManager
              categories={categories}
              materials={materials}
              onChanged={loadData}
              setMessage={setMessage}
              onDirtyChange={setHasOrderDraft}
            />
          ) : null}
          {tab === "thumbnails" ? (
            <AdminThumbnails
              categories={categories}
              materials={materials}
              onChanged={loadData}
              setMessage={setMessage}
            />
          ) : null}
          {tab === "analytics" ? <AdminAnalytics materials={materials} setMessage={setMessage} /> : null}
        </section>
      </div>
    </main>
  );
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(label)), timeoutMs);

    promise
      .then((value) => resolve(value))
      .catch((error) => reject(error))
      .finally(() => window.clearTimeout(timer));
  });
}
