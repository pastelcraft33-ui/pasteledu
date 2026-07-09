"use client";

import { FormEvent, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Category, CategoryFormState, CategoryGroup, PptMaterialWithCategory } from "@/lib/types";

type Props = {
  categories: Category[];
  materials: PptMaterialWithCategory[];
  onChanged: () => Promise<void>;
  setMessage: (message: string) => void;
};

const emptyForm: CategoryFormState = {
  name: "",
  description: "",
  column_color: "",
  category_groups: ["subject"],
  sort_order: 0
};

export default function AdminCategories({ categories, materials, onChanged, setMessage }: Props) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const materialCounts = useMemo(() => {
    return materials.reduce<Record<string, number>>((acc, material) => {
      const categoryIds = [material.category_id, material.secondary_category_id].filter((id): id is string => Boolean(id));
      categoryIds.forEach((id) => {
        acc[id] = (acc[id] ?? 0) + 1;
      });
      return acc;
    }, {});
  }, [materials]);

  function openCreateForm() {
    setForm(emptyForm);
    setIsFormOpen(true);
    setMessage("");
  }

  function closeForm() {
    setForm(emptyForm);
    setIsFormOpen(false);
  }

  function editCategory(category: Category) {
    setForm({
      id: category.id,
      name: category.name,
      description: category.description ?? "",
      column_color: category.column_color ?? "",
      category_groups: getCategoryGroups(category),
      sort_order: category.sort_order
    });
    setIsFormOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) {
      setMessage("필수 항목을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      column_color: form.column_color.trim() || null,
      category_groups: form.category_groups.length > 0 ? form.category_groups : ["subject"],
      sort_order: Number(form.sort_order)
    };
    const result = form.id
      ? await supabase.from("categories").update(payload).eq("id", form.id)
      : await supabase.from("categories").insert(payload);
    setIsSaving(false);

    if (result.error) {
      setMessage("저장 중 오류가 발생했습니다. 입력값과 로그인 상태를 확인해주세요.");
      return;
    }
    const successMessage = form.id ? "카테고리가 수정되었습니다." : "카테고리가 추가되었습니다.";
    closeForm();
    setMessage(successMessage);
    await onChanged();
  }

  async function deleteCategory(id: string) {
    if (!window.confirm("정말 이 카테고리를 삭제하시겠습니까? 이 카테고리에 속한 자료는 미분류 상태가 됩니다.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      setMessage("삭제 중 오류가 발생했습니다.");
      return;
    }
    setMessage("카테고리가 삭제되었습니다.");
    if (form.id === id) closeForm();
    await onChanged();
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">카테고리 관리</h2>
            <p className="mt-1 text-sm text-gray-500">카테고리 컬럼 이름, 보기 그룹, 설명, 색상, 정렬 순서를 관리합니다.</p>
          </div>
          <button type="button" onClick={openCreateForm} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-bold text-white">
            새 카테고리 추가
          </button>
        </div>
      </div>

      {isFormOpen ? (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{form.id ? "카테고리 수정" : "카테고리 추가"}</h2>
            <button type="button" onClick={closeForm} className="rounded-md border px-3 py-2 text-sm font-semibold">
              취소
            </button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input label="카테고리명" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
            <ColorInput label="컬럼 색상" value={form.column_color} onChange={(value) => setForm({ ...form, column_color: value })} />
            <CategoryGroupCheckboxes
              value={form.category_groups}
              onChange={(value) => setForm({ ...form, category_groups: value })}
            />
            <Textarea label="설명" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
            <Input
              label="정렬 순서"
              type="number"
              value={String(form.sort_order)}
              onChange={(value) => setForm({ ...form, sort_order: Number(value) })}
            />
          </div>
          <div className="mt-5 flex gap-2">
            <button type="submit" disabled={isSaving} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
              {isSaving ? "저장 중..." : form.id ? "카테고리 수정" : "카테고리 추가"}
            </button>
            <button type="button" onClick={closeForm} className="rounded-md border px-4 py-2 text-sm font-semibold">
              취소
            </button>
          </div>
        </form>
      ) : null}

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">카테고리 목록</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="py-2">카테고리명</th>
                <th>보기 그룹</th>
                <th>설명</th>
                <th>컬럼 색상</th>
                <th>정렬 순서</th>
                <th>포함 자료 수</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b">
                  <td className="py-3 font-semibold">{category.name}</td>
                  <td>{formatCategoryGroups(category)}</td>
                  <td className="max-w-[260px]">{category.description || "-"}</td>
                  <td>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-5 w-5 rounded border" style={{ backgroundColor: category.column_color ?? "#ffffff" }} />
                      {category.column_color || "기본값"}
                    </span>
                  </td>
                  <td>{category.sort_order}</td>
                  <td>{materialCounts[category.id] ?? 0}개</td>
                  <td className="space-x-2 whitespace-nowrap">
                    <button type="button" onClick={() => editCategory(category)} className="rounded-md border px-3 py-1">
                      수정
                    </button>
                    <button type="button" onClick={() => deleteCategory(category.id)} className="rounded-md border px-3 py-1 text-red-700">
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500">
                    등록된 카테고리가 없습니다. 새 카테고리를 추가해주세요.
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

const categoryGroupOptions: Array<{ id: CategoryGroup; label: string }> = [
  { id: "subject", label: "주제별" },
  { id: "month", label: "월별" }
];

function getCategoryGroups(category: Category) {
  return category.category_groups?.length ? category.category_groups : (["subject"] as CategoryGroup[]);
}

function formatCategoryGroups(category: Category) {
  const groups = getCategoryGroups(category);
  return groups.map((group) => categoryGroupOptions.find((item) => item.id === group)?.label ?? group).join(", ");
}

function CategoryGroupCheckboxes({ value, onChange }: { value: CategoryGroup[]; onChange: (value: CategoryGroup[]) => void }) {
  function toggle(group: CategoryGroup, checked: boolean) {
    const nextValue = checked ? (value.includes(group) ? value : [...value, group]) : value.filter((item) => item !== group);
    onChange(nextValue.length > 0 ? nextValue : ["subject"]);
  }

  return (
    <fieldset className="rounded-lg border p-3">
      <legend className="px-1 text-sm font-semibold">보기 그룹</legend>
      <p className="mb-2 text-xs text-gray-500">주제별과 월별을 동시에 선택할 수 있습니다.</p>
      <div className="flex flex-wrap gap-3">
        {categoryGroupOptions.map((option) => (
          <label key={option.id} className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={value.includes(option.id)}
              onChange={(event) => toggle(option.id, event.target.checked)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>
      <input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
    </label>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const colorValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#ffffff";

  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <div className="mt-1 flex gap-2">
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="#ffffff" className="w-full rounded-md border px-3 py-2" />
        <input
          type="color"
          value={colorValue}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-12 rounded-md border bg-white p-1"
          aria-label={`${label} 색상 선택`}
        />
      </div>
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block sm:col-span-2">
      <span className="text-sm font-semibold">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 min-h-24 w-full rounded-md border px-3 py-2" />
    </label>
  );
}
