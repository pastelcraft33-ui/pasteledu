"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Category, PptMaterialWithCategory } from "@/lib/types";

type Props = {
  categories: Category[];
  materials: PptMaterialWithCategory[];
  onChanged: () => Promise<void>;
  setMessage: (message: string) => void;
  onDirtyChange: (isDirty: boolean) => void;
};

const uncategorizedValue = "__uncategorized__";

export default function AdminOrderManager({ categories, materials, onChanged, setMessage, onDirtyChange }: Props) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [categoryItems, setCategoryItems] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [materialItems, setMaterialItems] = useState<PptMaterialWithCategory[]>([]);
  const [isCategoryDirty, setIsCategoryDirty] = useState(false);
  const [isMaterialDirty, setIsMaterialDirty] = useState(false);
  const [isSavingCategories, setIsSavingCategories] = useState(false);
  const [isSavingMaterials, setIsSavingMaterials] = useState(false);

  const materialCounts = useMemo(() => {
    return materials.reduce<Record<string, number>>((acc, material) => {
      if (!material.category_id) return acc;
      acc[material.category_id] = (acc[material.category_id] ?? 0) + 1;
      return acc;
    }, {});
  }, [materials]);

  useEffect(() => {
    setCategoryItems(sortCategories(categories));
    setIsCategoryDirty(false);
  }, [categories]);

  useEffect(() => {
    if (!selectedCategoryId && categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
      return;
    }

    if (!selectedCategoryId && categories.length === 0) {
      setSelectedCategoryId(uncategorizedValue);
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    setMaterialItems(getMaterialsByCategory(materials, selectedCategoryId));
    setIsMaterialDirty(false);
  }, [materials, selectedCategoryId]);

  useEffect(() => {
    onDirtyChange(isCategoryDirty || isMaterialDirty);
  }, [isCategoryDirty, isMaterialDirty, onDirtyChange]);

  function moveCategory(index: number, direction: -1 | 1) {
    setCategoryItems((current) => moveItem(current, index, direction));
    setIsCategoryDirty(true);
  }

  function moveMaterial(index: number, direction: -1 | 1) {
    setMaterialItems((current) => moveItem(current, index, direction));
    setIsMaterialDirty(true);
  }

  async function saveCategoryOrder() {
    setIsSavingCategories(true);
    const results = await Promise.all(
      categoryItems.map((category, index) => supabase.from("categories").update({ sort_order: index + 1 }).eq("id", category.id))
    );
    setIsSavingCategories(false);

    if (results.some((result) => result.error)) {
      setMessage("카테고리 순서 저장 중 오류가 발생했습니다.");
      return;
    }

    setIsCategoryDirty(false);
    setMessage("카테고리 순서가 저장되었습니다.");
    await onChanged();
  }

  async function saveMaterialOrder() {
    setIsSavingMaterials(true);
    const results = await Promise.all(
      materialItems.map((material, index) => supabase.from("ppt_materials").update({ sort_order: index + 1 }).eq("id", material.id))
    );
    setIsSavingMaterials(false);

    if (results.some((result) => result.error)) {
      setMessage("PPT 자료 순서 저장 중 오류가 발생했습니다.");
      return;
    }

    setIsMaterialDirty(false);
    setMessage("PPT 자료 순서가 저장되었습니다.");
    await onChanged();
  }

  const selectedLabel = selectedCategoryId === uncategorizedValue ? "미분류" : categories.find((category) => category.id === selectedCategoryId)?.name ?? "카테고리";

  return (
    <div className="space-y-5">
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">순서 관리</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          위/아래 버튼으로 순서를 먼저 바꾼 뒤, 변경사항 저장 버튼을 눌러야 실제 메인 화면에 반영됩니다.
        </p>
        {(isCategoryDirty || isMaterialDirty) ? (
          <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm font-semibold text-amber-800">저장되지 않은 변경사항이 있습니다.</p>
        ) : null}
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">카테고리 순서 관리</h3>
            <p className="mt-1 text-sm text-gray-500">메인 화면의 컬럼 순서를 변경합니다.</p>
          </div>
          <button
            type="button"
            onClick={saveCategoryOrder}
            disabled={!isCategoryDirty || isSavingCategories || categoryItems.length === 0}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {isSavingCategories ? "저장 중..." : "변경사항 저장"}
          </button>
        </div>
        {isCategoryDirty ? <p className="mt-3 text-sm font-semibold text-amber-700">저장되지 않은 변경사항이 있습니다.</p> : null}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="py-2">순서</th>
                <th>카테고리명</th>
                <th>설명</th>
                <th>컬럼 색상</th>
                <th>포함 자료 수</th>
                <th>이동</th>
              </tr>
            </thead>
            <tbody>
              {categoryItems.map((category, index) => (
                <tr key={category.id} className="border-b">
                  <td className="py-3 font-semibold">{index + 1}</td>
                  <td className="font-semibold">{category.name}</td>
                  <td className="max-w-[280px]">{category.description || "-"}</td>
                  <td>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-5 w-5 rounded border" style={{ backgroundColor: category.column_color ?? "#ffffff" }} />
                      {category.column_color || "기본값"}
                    </span>
                  </td>
                  <td>{materialCounts[category.id] ?? 0}개</td>
                  <td className="space-x-2 whitespace-nowrap">
                    <button type="button" disabled={index === 0} onClick={() => moveCategory(index, -1)} className="rounded-md border px-3 py-1 disabled:opacity-40">
                      위로
                    </button>
                    <button
                      type="button"
                      disabled={index === categoryItems.length - 1}
                      onClick={() => moveCategory(index, 1)}
                      className="rounded-md border px-3 py-1 disabled:opacity-40"
                    >
                      아래로
                    </button>
                  </td>
                </tr>
              ))}
              {categoryItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    등록된 카테고리가 없습니다. 먼저 카테고리를 추가해주세요.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">PPT 자료 순서 관리</h3>
            <p className="mt-1 text-sm text-gray-500">선택한 카테고리 안의 자료 카드 순서를 변경합니다.</p>
          </div>
          <label className="block min-w-[240px]">
            <span className="text-sm font-semibold">카테고리 선택</span>
            <select
              value={selectedCategoryId}
              onChange={(event) => setSelectedCategoryId(event.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
              <option value={uncategorizedValue}>미분류</option>
            </select>
          </label>
          <button
            type="button"
            onClick={saveMaterialOrder}
            disabled={!isMaterialDirty || isSavingMaterials || materialItems.length === 0}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {isSavingMaterials ? "저장 중..." : "변경사항 저장"}
          </button>
        </div>
        {isMaterialDirty ? <p className="mt-3 text-sm font-semibold text-amber-700">저장되지 않은 변경사항이 있습니다.</p> : null}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="py-2">순서</th>
                <th>썸네일</th>
                <th>제목</th>
                <th>파일명</th>
                <th>다운로드</th>
                <th>현재 sort_order</th>
                <th>이동</th>
              </tr>
            </thead>
            <tbody>
              {materialItems.map((material, index) => (
                <tr key={material.id} className="border-b align-top">
                  <td className="py-3 font-semibold">{index + 1}</td>
                  <td>
                    {material.thumbnail_url ? (
                      <Image src={material.thumbnail_url} alt={`${material.title} 썸네일`} width={72} height={48} className="h-12 w-[72px] rounded object-cover" />
                    ) : (
                      <span className="text-xs text-gray-500">없음</span>
                    )}
                  </td>
                  <td className="max-w-[260px] font-semibold">{material.title}</td>
                  <td className="max-w-[240px]">{material.file_name || "-"}</td>
                  <td>{material.is_downloadable ? "가능" : "불가"}</td>
                  <td>{material.sort_order}</td>
                  <td className="space-x-2 whitespace-nowrap">
                    <button type="button" disabled={index === 0} onClick={() => moveMaterial(index, -1)} className="rounded-md border px-3 py-1 disabled:opacity-40">
                      위로
                    </button>
                    <button
                      type="button"
                      disabled={index === materialItems.length - 1}
                      onClick={() => moveMaterial(index, 1)}
                      className="rounded-md border px-3 py-1 disabled:opacity-40"
                    >
                      아래로
                    </button>
                  </td>
                </tr>
              ))}
              {materialItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500">
                    {selectedCategoryId === uncategorizedValue ? "미분류 자료가 없습니다." : `이 카테고리에 등록된 PPT 자료가 없습니다. (${selectedLabel})`}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function sortCategories(categories: Category[]) {
  return [...categories].sort((a, b) => a.sort_order - b.sort_order || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

function getMaterialsByCategory(materials: PptMaterialWithCategory[], selectedCategoryId: string) {
  return [...materials]
    .filter((material) => {
      if (selectedCategoryId === uncategorizedValue) return !material.category_id;
      return material.category_id === selectedCategoryId;
    })
    .sort((a, b) => a.sort_order - b.sort_order || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= items.length) return items;

  const nextItems = [...items];
  const current = nextItems[index];
  nextItems[index] = nextItems[targetIndex];
  nextItems[targetIndex] = current;
  return nextItems;
}
