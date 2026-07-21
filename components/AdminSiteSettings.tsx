"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { createSafeStorageFileName } from "@/lib/file-utils";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { SiteSettings } from "@/lib/types";

type Props = {
  settings: SiteSettings | null;
  onChanged: () => Promise<void>;
  setMessage: (message: string) => void;
};

type SiteForm = {
  site_name: string;
  header_title: string;
  header_description: string;
  logo_url: string;
  favicon_url: string;
};

const emptyForm: SiteForm = {
  site_name: "Pastel PPT Library",
  header_title: "파스텔에듀 수업자료실",
  header_description: "필요한 수업자료를 카테고리별로 확인하고 다운로드할 수 있습니다.",
  logo_url: "",
  favicon_url: ""
};
const imageExtensions = ["jpg", "jpeg", "png", "webp", "ico"];

export default function AdminSiteSettings({ settings, onChanged, setMessage }: Props) {
  const supabase = createBrowserSupabaseClient();
  const [form, setForm] = useState<SiteForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setForm({
      site_name: settings.site_name,
      header_title: settings.header_title,
      header_description: settings.header_description ?? "",
      logo_url: settings.logo_url ?? "",
      favicon_url: settings.favicon_url ?? ""
    });
  }, [settings]);

  async function uploadAsset(event: ChangeEvent<HTMLInputElement>, field: "logo_url" | "favicon_url") {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isAllowedImage(file)) {
      setMessage("로고와 파비콘은 jpg, jpeg, png, webp, ico 파일만 업로드할 수 있습니다.");
      event.target.value = "";
      return;
    }

    setIsUploading(true);
    const path = createSafeStorageFileName(file.name);
    const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: false });
    setIsUploading(false);
    if (error) {
      setMessage("파일 업로드에 실패했습니다. Storage 버킷과 권한을 확인해주세요.");
      return;
    }
    const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
    setForm((current) => ({ ...current, [field]: data.publicUrl }));
    setMessage("사이트 이미지 업로드가 완료되었습니다.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.site_name.trim() || !form.header_title.trim()) {
      setMessage("필수 항목을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    const payload = {
      site_name: form.site_name.trim(),
      header_title: form.header_title.trim(),
      header_description: form.header_description,
      logo_url: form.logo_url || null,
      favicon_url: form.favicon_url || null
    };

    const result = settings?.id
      ? await supabase.from("site_settings").update(payload).eq("id", settings.id)
      : await supabase.from("site_settings").insert(payload);
    setIsSaving(false);

    if (result.error) {
      setMessage("저장 중 오류가 발생했습니다. 입력값과 로그인 상태를 확인해주세요.");
      return;
    }
    setMessage("사이트 정보가 저장되었습니다.");
    await onChanged();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-bold">사이트 정보 설정</h2>
        <p className="mt-1 text-sm text-gray-500">메인 자료실 상단에 표시되는 사이트명, 문구, 이미지를 관리합니다.</p>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="grid gap-4 sm:grid-cols-2">
        <Input label="사이트명" value={form.site_name} onChange={(value) => setForm({ ...form, site_name: value })} required />
        <Input label="상단 제목" value={form.header_title} onChange={(value) => setForm({ ...form, header_title: value })} required />
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold">상단 설명 문구</span>
          <textarea
            value={form.header_description}
            onChange={(event) => setForm({ ...form, header_description: event.target.value })}
            className="mt-1 min-h-24 w-full rounded-md border px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">로고 이미지 업로드</span>
          <input type="file" accept=".jpg,.jpeg,.png,.webp,.ico" onChange={(event) => uploadAsset(event, "logo_url")} className="mt-1 w-full" />
          <p className="mt-1 text-xs text-gray-500">새 파일을 선택하지 않으면 기존 로고가 유지됩니다.</p>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">파비콘 이미지 업로드</span>
          <input type="file" accept=".jpg,.jpeg,.png,.webp,.ico" onChange={(event) => uploadAsset(event, "favicon_url")} className="mt-1 w-full" />
          <p className="mt-1 text-xs text-gray-500">새 파일을 선택하지 않으면 기존 파비콘이 유지됩니다.</p>
        </label>
        <Input label="로고 URL" value={form.logo_url} onChange={(value) => setForm({ ...form, logo_url: value })} />
        <Input label="파비콘 URL" value={form.favicon_url} onChange={(value) => setForm({ ...form, favicon_url: value })} />
        </div>

        <aside className="rounded-lg border bg-gray-50 p-4">
          <h3 className="text-sm font-bold">현재 이미지 미리보기</h3>
          <div className="mt-4 space-y-4">
            <PreviewImage label="현재 로고" url={form.logo_url} />
            <PreviewImage label="현재 파비콘" url={form.favicon_url} small />
          </div>
        </aside>
      </div>
      <button type="submit" disabled={isSaving || isUploading} className="mt-5 rounded-md bg-gray-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
        {isSaving ? "저장 중..." : isUploading ? "업로드 중..." : "사이트 정보 저장"}
      </button>
    </form>
  );
}

function isAllowedImage(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  return imageExtensions.includes(extension);
}

function Input({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input value={value} required={required} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
    </label>
  );
}

function PreviewImage({ label, url, small = false }: { label: string; url: string; small?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={label}
            className={`${small ? "h-12 w-12" : "h-24 w-full"} rounded-md border bg-white object-contain p-2`}
          />
        </a>
      ) : (
        <div className={`${small ? "h-12 w-12" : "h-24 w-full"} mt-2 flex items-center justify-center rounded-md border bg-white text-xs text-gray-400`}>
          이미지 없음
        </div>
      )}
    </div>
  );
}
