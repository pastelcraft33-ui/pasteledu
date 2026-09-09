"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { createSafeStorageFileName, getTitleFromFileName, isAllowedPptFile, parseTagsInput } from "@/lib/file-utils";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { BulkUploadFileItem, Category, CategoryGroup, LibrarySection, PptMaterialWithCategory } from "@/lib/types";

type Props = {
  categories: Category[];
  materials: PptMaterialWithCategory[];
  onChanged: () => Promise<void>;
  setMessage: (message: string) => void;
  onMoveToMaterials: () => void;
};

type UploadResult = {
  successCount: number;
  failedCount: number;
  failedNames: string[];
};

export default function AdminBulkUpload({ categories, materials, onChanged, setMessage, onMoveToMaterials }: Props) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [items, setItems] = useState<BulkUploadFileItem[]>([]);
  const [subjectCategoryId, setSubjectCategoryId] = useState("");
  const [monthCategoryId, setMonthCategoryId] = useState("");
  const [librarySection, setLibrarySection] = useState<LibrarySection>("elementary");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isDownloadable, setIsDownloadable] = useState(true);
  const [startSortOrder, setStartSortOrder] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const subjectCategories = useMemo(() => getCategoriesByGroup(categories, "subject", subjectCategoryId), [categories, subjectCategoryId]);
  const monthCategories = useMemo(() => getCategoriesByGroup(categories, "month", monthCategoryId), [categories, monthCategoryId]);

  const completedCount = items.filter((item) => item.status === "success").length;
  const hasInvalidFiles = items.some((item) => item.status === "failed");

  useEffect(() => {
    const maxSortOrder = materials.reduce((max, material) => Math.max(max, material.sort_order ?? 0), 0);
    setStartSortOrder(maxSortOrder + 1);
  }, [materials]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    setResult(null);

    const nextItems = selectedFiles.map((file) => {
      const isValid = isAllowedPptFile(file);

      return {
        id: createItemId(file),
        file,
        originalName: file.name,
        expectedTitle: getTitleFromFileName(file.name),
        size: file.size,
        status: isValid ? "pending" : "failed",
        errorMessage: isValid ? undefined : "PPT 또는 PPTX 파일만 업로드할 수 있습니다."
      } satisfies BulkUploadFileItem;
    });

    setItems(nextItems);
    if (nextItems.some((item) => item.status === "failed")) {
      setMessage("PPT 또는 PPTX 파일만 업로드할 수 있습니다.");
    } else {
      setMessage(nextItems.length > 0 ? `${nextItems.length}개 파일이 선택되었습니다.` : "");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (items.length === 0) {
      setMessage("업로드할 파일을 선택해주세요.");
      return;
    }

    if (hasInvalidFiles) {
      setMessage("PPT 또는 PPTX 파일만 업로드할 수 있습니다.");
      return;
    }

    setIsUploading(true);
    setResult(null);
    setMessage("대량 업로드를 시작합니다.");

    let successCount = 0;
    const failedNames: string[] = [];
    const parsedTags = parseTagsInput(tags);

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      setItemStatus(item.id, "uploading");

      try {
        const path = createSafeStorageFileName(item.originalName);
        const uploadResult = await supabase.storage.from("ppt-files").upload(path, item.file, { upsert: false });

        if (uploadResult.error) {
          throw uploadResult.error;
        }

        const { data } = supabase.storage.from("ppt-files").getPublicUrl(path);
        const normalizedMonthCategoryId = monthCategoryId && monthCategoryId !== subjectCategoryId ? monthCategoryId : null;
        const insertResult = await supabase.from("ppt_materials").insert({
          category_id: subjectCategoryId || null,
          secondary_category_id: normalizedMonthCategoryId,
          title: item.expectedTitle,
          description: description.trim() || null,
          tags: parsedTags,
          library_sections: [librarySection],
          thumbnail_url: null,
          file_url: data.publicUrl,
          file_name: item.originalName,
          is_downloadable: isDownloadable,
          sort_order: Number(startSortOrder) + index
        });

        if (insertResult.error) {
          throw insertResult.error;
        }

        successCount += 1;
        setItemStatus(item.id, "success");
      } catch (error) {
        console.error("Bulk upload failed", item.originalName, error);
        const errorMessage = error instanceof Error ? error.message : "업로드 또는 등록에 실패했습니다.";
        failedNames.push(item.originalName);
        setItemStatus(item.id, "failed", errorMessage);
      }
    }

    setIsUploading(false);
    const summary = {
      successCount,
      failedCount: failedNames.length,
      failedNames
    };
    setResult(summary);
    await onChanged();
    setMessage(`대량 업로드가 완료되었습니다. 성공: ${summary.successCount}개, 실패: ${summary.failedCount}개`);
  }

  function setItemStatus(id: string, status: BulkUploadFileItem["status"], errorMessage?: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              errorMessage
            }
          : item
      )
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">대량 업로드</h2>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          여러 개의 PPT/PPTX 파일을 한 번에 업로드할 수 있습니다.
          <br />
          업로드된 자료는 선택한 기본 주제별 카테고리, 기본 월별 카테고리와 기본 태그로 등록됩니다.
          <br />
          등록 후 “PPT 자료 관리” 탭에서 제목, 설명, 주제별/월별 카테고리, 태그, 썸네일을 수정할 수 있습니다.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block lg:col-span-2">
            <span className="text-sm font-semibold">PPT/PPTX 파일 선택</span>
            <input type="file" multiple accept=".ppt,.pptx" onChange={handleFileChange} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">기본 주제별 카테고리</span>
            <select value={subjectCategoryId} onChange={(event) => setSubjectCategoryId(event.target.value)} className="mt-1 w-full rounded-md border px-3 py-2">
              <option value="">선택 안 함</option>
              {subjectCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">카테고리 관리에서 “주제별”로 체크된 카테고리만 표시됩니다.</p>
          </label>

          <label className="block">
            <span className="text-sm font-semibold">기본 노출 영역</span>
            <select
              value={librarySection}
              onChange={(event) => setLibrarySection(event.target.value as LibrarySection)}
              className="mt-1 w-full rounded-md border px-3 py-2"
            >
              <option value="kindergarten">유치원관</option>
              <option value="elementary">초등관</option>
              <option value="senior">실버관</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">대량 등록 후 PPT 자료 관리에서 여러 관으로 변경할 수 있습니다.</p>
          </label>

          <label className="block">
            <span className="text-sm font-semibold">기본 월별 카테고리</span>
            <select value={monthCategoryId} onChange={(event) => setMonthCategoryId(event.target.value)} className="mt-1 w-full rounded-md border px-3 py-2">
              <option value="">선택 안 함</option>
              {monthCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">카테고리 관리에서 “월별”로 체크된 카테고리만 표시됩니다.</p>
          </label>

          <label className="block">
            <span className="text-sm font-semibold">시작 정렬 순서</span>
            <input
              type="number"
              value={startSortOrder}
              onChange={(event) => setStartSortOrder(Number(event.target.value))}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">기본 설명</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1 min-h-28 w-full rounded-md border px-3 py-2"
              placeholder="모든 업로드 자료에 동일하게 들어갈 설명"
            />
          </label>

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold">기본 태그</span>
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="안전교육, 초등, 수업자료"
                className="mt-1 w-full rounded-md border px-3 py-2"
              />
              <p className="mt-1 text-xs text-gray-500">쉼표로 구분해서 입력해주세요. 예: 안전교육, 초등, 수업자료</p>
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={isDownloadable} onChange={(event) => setIsDownloadable(event.target.checked)} />
              다운로드 가능
            </label>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isUploading}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {isUploading ? "업로드 중..." : "업로드 시작"}
          </button>
          {items.length > 0 ? (
            <p className="text-sm text-gray-600">
              {completedCount} / {items.length}개 업로드 완료
            </p>
          ) : null}
        </div>
      </form>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold">선택된 파일 목록</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="py-2">번호</th>
                <th>파일명</th>
                <th>파일 크기</th>
                <th>예상 제목</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className="border-b align-top">
                  <td className="py-3">{index + 1}</td>
                  <td className="max-w-[260px] truncate" title={item.originalName}>
                    {item.originalName}
                  </td>
                  <td>{formatFileSize(item.size)}</td>
                  <td className="max-w-[260px] truncate" title={item.expectedTitle}>
                    {item.expectedTitle}
                  </td>
                  <td>
                    <span className={getStatusClassName(item.status)}>{getStatusLabel(item.status)}</span>
                    {item.errorMessage ? <p className="mt-1 text-xs text-red-600">{item.errorMessage}</p> : null}
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-500">
                    업로드할 파일을 선택해주세요.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {result ? (
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold">업로드 결과</h3>
          <p className="mt-3 text-sm leading-6 text-gray-700">
            대량 업로드가 완료되었습니다.
            <br />
            성공: {result.successCount}개
            <br />
            실패: {result.failedCount}개
          </p>
          {result.failedNames.length > 0 ? (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              <p className="font-semibold">실패한 파일</p>
              <ul className="mt-2 list-disc pl-5">
                {result.failedNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            업로드된 자료는 썸네일 없이 등록되었습니다. 썸네일, 설명, 태그, 주제별/월별 카테고리 수정이 필요하면 “PPT 자료 관리” 탭에서 수정해주세요.
          </p>
          <button type="button" onClick={onMoveToMaterials} className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-bold text-white">
            PPT 자료 관리로 이동
          </button>
        </section>
      ) : null}
    </div>
  );
}

function createItemId(file: File) {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);

  return `${file.name}-${file.size}-${id}`;
}

function getCategoriesByGroup(categories: Category[], group: CategoryGroup, selectedId: string) {
  const groupedCategories = categories.filter((category) => getCategoryGroups(category).includes(group));
  if (!selectedId || groupedCategories.some((category) => category.id === selectedId)) return groupedCategories;

  const selectedCategory = categories.find((category) => category.id === selectedId);
  return selectedCategory ? [...groupedCategories, selectedCategory] : groupedCategories;
}

function getCategoryGroups(category: Category): CategoryGroup[] {
  return category.category_groups?.length ? category.category_groups : ["subject"];
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)}KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)}MB`;
}

function getStatusLabel(status: BulkUploadFileItem["status"]) {
  switch (status) {
    case "uploading":
      return "업로드 중...";
    case "success":
      return "등록 완료";
    case "failed":
      return "실패";
    default:
      return "대기 중";
  }
}

function getStatusClassName(status: BulkUploadFileItem["status"]) {
  switch (status) {
    case "uploading":
      return "inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700";
    case "success":
      return "inline-flex rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-700";
    case "failed":
      return "inline-flex rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-700";
    default:
      return "inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600";
  }
}
