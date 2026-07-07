"use client";

import { ChangeEvent, useMemo, useState } from "react";
import Image from "next/image";
import { createSafeStorageFileName, formatDate, isAllowedImageFile } from "@/lib/file-utils";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Category, PptMaterialWithCategory } from "@/lib/types";

type Props = {
  categories: Category[];
  materials: PptMaterialWithCategory[];
  onChanged: () => Promise<void>;
  setMessage: (message: string) => void;
};

type ThumbnailStatus = "all" | "has_thumbnail" | "no_thumbnail";
type DownloadStatus = "all" | "downloadable" | "not_downloadable";
type ItemStatus = "idle" | "uploading" | "success" | "failed";

const uncategorizedValue = "__uncategorized__";

export default function AdminThumbnails({ categories, materials, onChanged, setMessage }: Props) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [thumbnailFilter, setThumbnailFilter] = useState<ThumbnailStatus>("all");
  const [downloadFilter, setDownloadFilter] = useState<DownloadStatus>("all");
  const [itemStatuses, setItemStatuses] = useState<Record<string, ItemStatus>>({});

  const summaryItems = useMemo(
    () => [
      { label: "전체 자료", value: `${materials.length}개` },
      { label: "썸네일 있음", value: `${materials.filter((material) => Boolean(material.thumbnail_url)).length}개` },
      { label: "썸네일 없음", value: `${materials.filter((material) => !material.thumbnail_url).length}개` }
    ],
    [materials]
  );

  const filteredMaterials = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return materials.filter((material) => {
      if (categoryFilter === uncategorizedValue && material.category_id) return false;
      if (categoryFilter !== "all" && categoryFilter !== uncategorizedValue && material.category_id !== categoryFilter) return false;
      if (thumbnailFilter === "has_thumbnail" && !material.thumbnail_url) return false;
      if (thumbnailFilter === "no_thumbnail" && material.thumbnail_url) return false;
      if (downloadFilter === "downloadable" && !material.is_downloadable) return false;
      if (downloadFilter === "not_downloadable" && material.is_downloadable) return false;
      if (!keyword) return true;

      const searchable = [material.title, material.description ?? "", material.file_name ?? ""].join(" ").toLowerCase();
      return searchable.includes(keyword);
    });
  }, [categoryFilter, downloadFilter, materials, search, thumbnailFilter]);

  async function uploadThumbnail(material: PptMaterialWithCategory, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!isAllowedImageFile(file)) {
      setMessage("썸네일은 JPG, PNG, WEBP 파일만 업로드할 수 있습니다.");
      setItemStatus(material.id, "failed");
      return;
    }

    setItemStatus(material.id, "uploading");
    const path = createSafeStorageFileName(file.name);
    const uploadResult = await supabase.storage.from("thumbnails").upload(path, file, { upsert: false });

    if (uploadResult.error) {
      console.error("Thumbnail upload error", uploadResult.error);
      setMessage("썸네일 업로드 중 오류가 발생했습니다.");
      setItemStatus(material.id, "failed");
      return;
    }

    const { data } = supabase.storage.from("thumbnails").getPublicUrl(path);
    const updateResult = await supabase.from("ppt_materials").update({ thumbnail_url: data.publicUrl }).eq("id", material.id);

    if (updateResult.error) {
      console.error("Thumbnail update error", updateResult.error);
      setMessage("썸네일 업로드 중 오류가 발생했습니다.");
      setItemStatus(material.id, "failed");
      return;
    }

    setItemStatus(material.id, "success");
    setMessage(material.thumbnail_url ? "썸네일이 교체되었습니다." : "썸네일이 업로드되었습니다.");
    await onChanged();
  }

  async function deleteThumbnail(material: PptMaterialWithCategory) {
    if (!material.thumbnail_url) return;
    if (!window.confirm("정말 이 자료의 썸네일을 삭제하시겠습니까?")) return;

    setItemStatus(material.id, "uploading");
    const updateResult = await supabase.from("ppt_materials").update({ thumbnail_url: null }).eq("id", material.id);

    if (updateResult.error) {
      console.error("Thumbnail delete error", updateResult.error);
      setMessage("썸네일 삭제 중 오류가 발생했습니다.");
      setItemStatus(material.id, "failed");
      return;
    }

    // TODO: 필요하면 thumbnail_url에서 Storage 경로를 추출해 실제 파일도 삭제하도록 확장합니다.
    setItemStatus(material.id, "success");
    setMessage("썸네일이 삭제되었습니다.");
    await onChanged();
  }

  function setItemStatus(id: string, status: ItemStatus) {
    setItemStatuses((current) => ({ ...current, [id]: status }));
  }

  const emptyMessage = getEmptyMessage(materials.length, filteredMaterials.length, thumbnailFilter);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">썸네일 관리</h2>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          대량 업로드된 PPT 자료는 썸네일 없이 등록될 수 있습니다.
          <br />
          각 자료에 맞는 썸네일 이미지를 업로드하면 메인 자료실 카드에 표시됩니다.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="썸네일 요약">
        {summaryItems.map((item) => (
          <div key={item.label} className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-500">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-950">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_200px_180px_180px]">
          <label className="block">
            <span className="text-sm font-semibold">검색</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="자료 제목, 설명, 파일명 검색"
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">카테고리 필터</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="mt-1 w-full rounded-md border px-3 py-2">
              <option value="all">전체</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
              <option value={uncategorizedValue}>미분류</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">썸네일 상태</span>
            <select value={thumbnailFilter} onChange={(event) => setThumbnailFilter(event.target.value as ThumbnailStatus)} className="mt-1 w-full rounded-md border px-3 py-2">
              <option value="all">전체</option>
              <option value="has_thumbnail">썸네일 있음</option>
              <option value="no_thumbnail">썸네일 없음</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">다운로드 여부</span>
            <select value={downloadFilter} onChange={(event) => setDownloadFilter(event.target.value as DownloadStatus)} className="mt-1 w-full rounded-md border px-3 py-2">
              <option value="all">전체</option>
              <option value="downloadable">다운로드 가능</option>
              <option value="not_downloadable">다운로드 불가</option>
            </select>
          </label>
        </div>
      </section>

      {emptyMessage ? (
        <section className="rounded-xl border bg-white p-10 text-center text-gray-500 shadow-sm">{emptyMessage}</section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredMaterials.map((material) => {
            const status = itemStatuses[material.id] ?? "idle";
            const isUploading = status === "uploading";

            return (
              <article key={material.id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="relative aspect-video bg-gray-100">
                  {material.thumbnail_url ? (
                    <Image src={material.thumbnail_url} alt={`${material.title} 썸네일`} fill className="object-cover" sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-500">썸네일 없음</div>
                  )}
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="line-clamp-2 font-bold">{material.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{material.categories?.name ?? "미분류"}</p>
                  </div>
                  <dl className="space-y-1 text-sm text-gray-600">
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-semibold">파일명</dt>
                      <dd className="min-w-0 truncate">{material.file_name || "-"}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="font-semibold">등록일</dt>
                      <dd>{formatDate(material.created_at)}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="font-semibold">다운로드</dt>
                      <dd>{material.is_downloadable ? "가능" : "불가"}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="font-semibold">상태</dt>
                      <dd>{getStatusLabel(status)}</dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap gap-2">
                    <label className={`rounded-md px-3 py-2 text-sm font-bold text-white ${isUploading ? "cursor-not-allowed bg-gray-400" : "cursor-pointer bg-gray-900"}`}>
                      {isUploading ? "업로드 중..." : material.thumbnail_url ? "썸네일 교체" : "썸네일 업로드"}
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        disabled={isUploading}
                        onChange={(event) => uploadThumbnail(material, event)}
                        className="sr-only"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={isUploading || !material.thumbnail_url}
                      onClick={() => deleteThumbnail(material)}
                      className="rounded-md border px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-40"
                    >
                      썸네일 삭제
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

function getStatusLabel(status: ItemStatus) {
  switch (status) {
    case "uploading":
      return "업로드 중...";
    case "success":
      return "완료";
    case "failed":
      return "실패";
    default:
      return "대기";
  }
}

function getEmptyMessage(materialCount: number, filteredCount: number, thumbnailFilter: ThumbnailStatus) {
  if (materialCount === 0) return "등록된 PPT 자료가 없습니다.";
  if (filteredCount > 0) return "";
  if (thumbnailFilter === "no_thumbnail") return "썸네일이 없는 자료가 없습니다.";

  return "조건에 맞는 자료가 없습니다.";
}
