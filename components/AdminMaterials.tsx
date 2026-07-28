"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import AdminDownloadButton from "@/components/AdminDownloadButton";
import { createDownloadFileName } from "@/lib/download-utils";
import { createSafeStorageFileName, getFileExtension, isAllowedPptFile, parseTagsInput } from "@/lib/file-utils";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { AgeGroup, Category, CategoryGroup, MaterialFormState, PptMaterialWithCategory } from "@/lib/types";

type Props = {
  categories: Category[];
  materials: PptMaterialWithCategory[];
  onChanged: () => Promise<void>;
  setMessage: (message: string) => void;
};

const emptyForm: MaterialFormState = {
  category_id: "",
  secondary_category_id: "",
  title: "",
  description: "",
  tags: "",
  age_groups: [],
  thumbnail_url: "",
  file_url: "",
  file_name: "",
  is_downloadable: true,
  sort_order: 0
};

const thumbnailExtensions = ["jpg", "jpeg", "png", "webp"];
const ageGroupOptions: AgeGroup[] = ["유치부", "저학년", "고학년", "중등부", "고등부", "시니어"];

export default function AdminMaterials({ categories, materials, onChanged, setMessage }: Props) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [form, setForm] = useState<MaterialFormState>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [downloadFilter, setDownloadFilter] = useState("all");
  const subjectCategories = useMemo(() => getCategoriesByGroup(categories, "subject", form.category_id), [categories, form.category_id]);
  const monthCategories = useMemo(() => getCategoriesByGroup(categories, "month", form.secondary_category_id), [categories, form.secondary_category_id]);

  const filteredMaterials = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return [...materials]
      .filter((material) => {
        if (categoryFilter === "uncategorized" && (material.category_id || material.secondary_category_id)) return false;
        if (categoryFilter !== "all" && categoryFilter !== "uncategorized" && !isMaterialInCategory(material, categoryFilter)) return false;
        if (downloadFilter === "downloadable" && !material.is_downloadable) return false;
        if (downloadFilter === "not_downloadable" && material.is_downloadable) return false;
        if (!keyword) return true;

        const haystack = [
          material.title,
          material.description ?? "",
          ...(material.tags ?? [])
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(keyword);
      })
      .sort((a, b) => a.sort_order - b.sort_order || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [categoryFilter, downloadFilter, materials, search]);

  function updateField<K extends keyof MaterialFormState>(key: K, value: MaterialFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleAgeGroup(ageGroup: AgeGroup) {
    setForm((current) => ({
      ...current,
      age_groups: current.age_groups.includes(ageGroup)
        ? current.age_groups.filter((item) => item !== ageGroup)
        : [...current.age_groups, ageGroup]
    }));
  }

  function openCreateForm() {
    setForm(emptyForm);
    setIsFormOpen(true);
    setMessage("");
  }

  function closeForm() {
    setForm(emptyForm);
    setIsFormOpen(false);
  }

  async function uploadFile(event: ChangeEvent<HTMLInputElement>, bucket: "ppt-files" | "thumbnails") {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, bucket);
    if (!validation.isValid) {
      setMessage(validation.message);
      event.target.value = "";
      return;
    }

    setIsUploading(true);
    setMessage("파일 업로드 중...");
    const path = createSafeStorageFileName(file.name);
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    setIsUploading(false);

    if (error) {
      console.error("File upload failed", error);
      setMessage("파일 업로드에 실패했습니다. Storage 버킷과 권한을 확인해주세요.");
      event.target.value = "";
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    if (bucket === "ppt-files") {
      setForm((current) => ({ ...current, file_url: data.publicUrl, file_name: file.name }));
      setMessage("PPT 파일 업로드가 완료되었습니다.");
    } else {
      setForm((current) => ({ ...current, thumbnail_url: data.publicUrl }));
      setMessage("썸네일 이미지 업로드가 완료되었습니다.");
    }
    event.target.value = "";
  }

  function editMaterial(material: PptMaterialWithCategory) {
    setForm({
      id: material.id,
      category_id: material.category_id ?? "",
      secondary_category_id: material.secondary_category_id ?? "",
      title: material.title,
      description: material.description ?? "",
      tags: (material.tags ?? []).join(", "),
      age_groups: material.age_groups ?? [],
      thumbnail_url: material.thumbnail_url ?? "",
      file_url: material.file_url ?? "",
      file_name: material.file_name ?? "",
      is_downloadable: material.is_downloadable,
      sort_order: material.sort_order
    });
    setIsFormOpen(true);
    setMessage("선택한 자료를 수정할 수 있습니다.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) {
      setMessage("필수 항목을 입력해주세요.");
      return;
    }

    if (isUploading) {
      setMessage("파일 업로드가 끝난 뒤 저장해주세요.");
      return;
    }

    if (!form.id && !form.file_url) {
      setMessage("PPT/PPTX 파일을 업로드한 뒤 자료를 등록해주세요.");
      return;
    }

    setIsSaving(true);
    const monthCategoryId = form.secondary_category_id && form.secondary_category_id !== form.category_id ? form.secondary_category_id : null;
    const payload = {
      category_id: form.category_id || null,
      secondary_category_id: monthCategoryId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      tags: parseTagsInput(form.tags),
      age_groups: form.age_groups,
      thumbnail_url: form.thumbnail_url || null,
      file_url: form.file_url || null,
      file_name: form.file_name || null,
      is_downloadable: form.is_downloadable,
      sort_order: Number(form.sort_order)
    };

    const result = form.id
      ? await supabase.from("ppt_materials").update(payload).eq("id", form.id)
      : await supabase.from("ppt_materials").insert(payload);

    setIsSaving(false);

    if (result.error) {
      console.error("Material save failed", result.error);
      if (result.error.code === "42703" && result.error.message.includes("age_groups")) {
        setMessage("연령 정보를 저장할 DB 컬럼이 없습니다. Supabase SQL Editor에서 supabase/add-age-groups.sql을 먼저 실행해주세요.");
        return;
      }
      setMessage("저장 중 오류가 발생했습니다. 입력값과 로그인 상태를 확인해주세요.");
      return;
    }

    const successMessage = form.id ? "자료가 수정되었습니다." : "자료가 등록되었습니다.";
    closeForm();
    setMessage(successMessage);
    await onChanged();
  }

  async function deleteMaterial(material: PptMaterialWithCategory) {
    if (!window.confirm("정말 이 PPT 자료를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;

    const { error } = await supabase.from("ppt_materials").delete().eq("id", material.id);
    if (error) {
      setMessage("삭제 중 오류가 발생했습니다.");
      return;
    }

    const storageDeleteErrors = await removeMaterialFiles(material.thumbnail_url, material.file_url);
    setMessage(storageDeleteErrors ? "자료가 삭제되었습니다. 일부 Storage 파일은 삭제하지 못했습니다." : "자료가 삭제되었습니다.");
    if (form.id === material.id) closeForm();
    await onChanged();
  }

  async function removeMaterialFiles(thumbnailUrl: string | null, fileUrl: string | null) {
    const targets = [
      getStorageObject("thumbnails", thumbnailUrl),
      getStorageObject("ppt-files", fileUrl)
    ].filter((target): target is { bucket: "ppt-files" | "thumbnails"; path: string } => Boolean(target));

    if (targets.length === 0) return false;

    const results = await Promise.all(targets.map((target) => supabase.storage.from(target.bucket).remove([target.path])));

    return results.some((result) => Boolean(result.error));
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">PPT 자료 관리</h2>
            <p className="mt-1 text-sm text-gray-500">자료를 검색하고, 카테고리와 다운로드 상태로 필터링할 수 있습니다.</p>
          </div>
          <button type="button" onClick={openCreateForm} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-bold text-white">
            새 자료 추가
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px_180px]">
          <label className="block">
            <span className="text-sm font-semibold">자료 검색</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="제목, 설명, 태그 검색"
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
              <option value="uncategorized">미분류</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">다운로드 여부</span>
            <select value={downloadFilter} onChange={(event) => setDownloadFilter(event.target.value)} className="mt-1 w-full rounded-md border px-3 py-2">
              <option value="all">전체</option>
              <option value="downloadable">다운로드 가능</option>
              <option value="not_downloadable">다운로드 불가</option>
            </select>
          </label>
        </div>
      </div>

      {isFormOpen ? (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">{form.id ? "PPT 자료 수정" : "PPT 자료 추가"}</h2>
              <p className="mt-1 text-sm text-gray-500">새 파일을 선택하지 않으면 기존 파일이 유지됩니다.</p>
            </div>
            <button type="button" onClick={closeForm} className="rounded-md border px-3 py-2 text-sm font-semibold">
              취소
            </button>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Input label="제목" value={form.title} onChange={(value) => updateField("title", value)} required />
            <label className="block">
              <span className="text-sm font-semibold">주제별 카테고리</span>
              <select
                value={form.category_id}
                onChange={(event) => updateField("category_id", event.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2"
              >
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
              <span className="text-sm font-semibold">월별 카테고리</span>
              <select
                value={form.secondary_category_id}
                onChange={(event) => updateField("secondary_category_id", event.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2"
              >
                <option value="">선택 안 함</option>
                {monthCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">카테고리 관리에서 “월별”로 체크된 카테고리만 표시됩니다.</p>
            </label>
            <Textarea label="설명" value={form.description} onChange={(value) => updateField("description", value)} />
            <div className="space-y-3">
              <Input label="태그" value={form.tags} onChange={(value) => updateField("tags", value)} placeholder="봄, 만들기, 초등" />
              <p className="text-xs text-gray-500">쉼표로 구분해서 입력해주세요. 예: 봄, 만들기, 초등</p>
              <Input
                label="정렬 순서"
                type="number"
                value={String(form.sort_order)}
                onChange={(value) => updateField("sort_order", Number(value))}
              />
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={form.is_downloadable}
                  onChange={(event) => updateField("is_downloadable", event.target.checked)}
                />
                다운로드 가능 여부
              </label>
            </div>
            <fieldset className="lg:col-span-2">
              <legend className="text-sm font-semibold">연령</legend>
              <p className="mt-1 text-xs text-gray-500">해당 자료에 맞는 연령을 여러 개 선택할 수 있습니다.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ageGroupOptions.map((ageGroup) => {
                  const isSelected = form.age_groups.includes(ageGroup);

                  return (
                    <label
                      key={ageGroup}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                        isSelected ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAgeGroup(ageGroup)}
                        className="h-4 w-4 accent-gray-900"
                      />
                      {ageGroup}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <FileField
              label="썸네일 이미지"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(event) => uploadFile(event, "thumbnails")}
              currentUrl={form.thumbnail_url}
              currentLabel="현재 썸네일"
            />
            <FileField
              label="PPT/PPTX 파일"
              accept=".ppt,.pptx"
              onChange={(event) => uploadFile(event, "ppt-files")}
              currentUrl={form.file_url}
              currentLabel={`현재 PPT 파일${form.file_name ? `: ${form.file_name}` : ""}`}
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {isSaving ? "저장 중..." : isUploading ? "파일 업로드 중..." : form.id ? "자료 수정" : "자료 등록"}
            </button>
            <button type="button" onClick={closeForm} className="rounded-md border px-4 py-2 text-sm font-semibold">
              취소
            </button>
          </div>
        </form>
      ) : null}

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">PPT 자료 목록</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="py-2">썸네일</th>
                <th>제목</th>
                <th>카테고리</th>
                <th>태그</th>
                <th>다운로드</th>
                <th>정렬</th>
                <th>등록일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map((material) => (
                <tr key={material.id} className="border-b align-top">
                  <td className="py-3">
                    {material.thumbnail_url ? (
                      <Image src={material.thumbnail_url} alt={`${material.title} 썸네일`} width={72} height={48} className="h-12 w-[72px] rounded object-cover" />
                    ) : (
                      <span className="text-xs text-gray-500">없음</span>
                    )}
                  </td>
                  <td className="max-w-[240px] py-3 font-semibold">{material.title}</td>
                  <td>{formatMaterialCategories(material, categories)}</td>
                  <td className="max-w-[220px]">{(material.tags ?? []).join(", ") || "-"}</td>
                  <td>{material.file_url ? (material.is_downloadable ? "가능" : "불가") : "파일 없음"}</td>
                  <td>{material.sort_order}</td>
                  <td>{formatDate(material.created_at)}</td>
                  <td>
                    <div className="flex min-w-[270px] flex-wrap gap-2">
                      <AdminDownloadButton
                        url={material.file_url}
                        fileName={material.file_name || createDownloadFileName(material.title, material.file_url || "", "pptx")}
                        label="PPT 다운로드"
                        setMessage={setMessage}
                        className="text-blue-700"
                      />
                      <AdminDownloadButton
                        url={material.thumbnail_url}
                        fileName={createDownloadFileName(`${material.title}-썸네일`, material.thumbnail_url || "", "jpg")}
                        label="이미지 다운로드"
                        setMessage={setMessage}
                        className="text-emerald-700"
                      />
                      <button type="button" onClick={() => editMaterial(material)} className="rounded-md border px-3 py-1">
                        수정
                      </button>
                      <button type="button" onClick={() => deleteMaterial(material)} className="rounded-md border px-3 py-1 text-red-700">
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {materials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-500">
                    등록된 PPT 자료가 없습니다. 새 자료를 추가해주세요.
                  </td>
                </tr>
              ) : null}
              {materials.length > 0 && filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-500">
                    조건에 맞는 자료가 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function isMaterialInCategory(material: PptMaterialWithCategory, categoryId: string) {
  return material.category_id === categoryId || material.secondary_category_id === categoryId;
}

function formatMaterialCategories(material: PptMaterialWithCategory, categories: Category[]) {
  const subjectName = material.category_id ? categories.find((category) => category.id === material.category_id)?.name : null;
  const monthName = material.secondary_category_id ? categories.find((category) => category.id === material.secondary_category_id)?.name : null;
  const names = [
    subjectName ? `주제별: ${subjectName}` : null,
    monthName ? `월별: ${monthName}` : null
  ].filter(Boolean);

  return names.length > 0 ? names.join(", ") : "미분류";
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

function validateFile(file: File, bucket: "ppt-files" | "thumbnails") {
  const extension = getFileExtension(file.name);
  const allowed = bucket === "ppt-files" ? isAllowedPptFile(file) : thumbnailExtensions.includes(extension);
  const label = bucket === "ppt-files" ? "PPT 파일은 PPT 또는 PPTX 파일만 업로드할 수 있습니다." : "썸네일은 JPG, PNG, WEBP 파일만 업로드할 수 있습니다.";

  return allowed ? { isValid: true, message: "" } : { isValid: false, message: label };
}

function getStorageObject(bucket: "ppt-files" | "thumbnails", publicUrl: string | null) {
  if (!publicUrl) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const [, path] = publicUrl.split(marker);
  if (!path) return null;

  return { bucket, path: decodeURIComponent(path) };
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR");
}

function FileField({
  label,
  accept,
  onChange,
  currentUrl,
  currentLabel
}: {
  label: string;
  accept: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  currentUrl: string;
  currentLabel: string;
}) {
  return (
    <label className="block rounded-lg border border-dashed p-4">
      <span className="text-sm font-semibold">{label}</span>
      <input type="file" accept={accept} onChange={onChange} className="mt-2 w-full text-sm" />
      {currentUrl ? (
        <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-sm font-semibold text-blue-700 underline">
          {currentLabel || "현재 파일"} 보기
        </a>
      ) : (
        <p className="mt-3 text-xs text-gray-500">아직 선택된 파일이 없습니다.</p>
      )}
    </label>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border px-3 py-2"
      />
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 min-h-28 w-full rounded-md border px-3 py-2" />
    </label>
  );
}
