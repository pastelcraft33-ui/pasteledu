"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import AdminDownloadButton from "@/components/AdminDownloadButton";
import { createDownloadFileName } from "@/lib/download-utils";
import { createSafeStorageFileName } from "@/lib/file-utils";
import { libraryBannerDefaults, resolveLibraryBannerImage, resolveLibraryBannerTitle } from "@/lib/library-banners";
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
  kindergarten_banner_title: string;
  kindergarten_banner_description: string;
  kindergarten_banner_image_url: string;
  elementary_banner_title: string;
  elementary_banner_description: string;
  elementary_banner_image_url: string;
  senior_banner_title: string;
  senior_banner_description: string;
  senior_banner_image_url: string;
};

type ImageField = "logo_url" | "favicon_url" | "kindergarten_banner_image_url" | "elementary_banner_image_url" | "senior_banner_image_url";

const emptyForm: SiteForm = {
  site_name: "Pastel PPT Library",
  header_title: "파스텔에듀 수업자료실",
  header_description: "필요한 수업자료를 카테고리별로 확인하고 다운로드할 수 있습니다.",
  logo_url: "",
  favicon_url: "",
  kindergarten_banner_title: libraryBannerDefaults.kindergarten.title,
  kindergarten_banner_description: "유아 눈높이에 맞춘 즐거운 수업자료를 확인해보세요.",
  kindergarten_banner_image_url: libraryBannerDefaults.kindergarten.imageUrl,
  elementary_banner_title: libraryBannerDefaults.elementary.title,
  elementary_banner_description: "초등 수업에 바로 활용할 수 있는 자료를 모았습니다.",
  elementary_banner_image_url: libraryBannerDefaults.elementary.imageUrl,
  senior_banner_title: libraryBannerDefaults.senior.title,
  senior_banner_description: "시니어 학습과 활동을 위한 자료를 만나보세요.",
  senior_banner_image_url: libraryBannerDefaults.senior.imageUrl
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
      favicon_url: settings.favicon_url ?? "",
      kindergarten_banner_title: resolveLibraryBannerTitle("kindergarten", settings.kindergarten_banner_title),
      kindergarten_banner_description: settings.kindergarten_banner_description ?? emptyForm.kindergarten_banner_description,
      kindergarten_banner_image_url: resolveLibraryBannerImage("kindergarten", settings.kindergarten_banner_image_url),
      elementary_banner_title: resolveLibraryBannerTitle("elementary", settings.elementary_banner_title),
      elementary_banner_description: settings.elementary_banner_description ?? emptyForm.elementary_banner_description,
      elementary_banner_image_url: resolveLibraryBannerImage("elementary", settings.elementary_banner_image_url),
      senior_banner_title: resolveLibraryBannerTitle("senior", settings.senior_banner_title),
      senior_banner_description: settings.senior_banner_description ?? emptyForm.senior_banner_description,
      senior_banner_image_url: resolveLibraryBannerImage("senior", settings.senior_banner_image_url)
    });
  }, [settings]);

  function updateField<K extends keyof SiteForm>(field: K, value: SiteForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function uploadAsset(event: ChangeEvent<HTMLInputElement>, field: ImageField) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isAllowedImage(file)) {
      setMessage("사이트 이미지는 JPG, PNG, WEBP 또는 ICO 파일만 업로드할 수 있습니다.");
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
    if (
      !form.site_name.trim() ||
      !form.header_title.trim() ||
      !form.kindergarten_banner_title.trim() ||
      !form.elementary_banner_title.trim() ||
      !form.senior_banner_title.trim()
    ) {
      setMessage("필수 항목을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    const payload = {
      site_name: form.site_name.trim(),
      header_title: form.header_title.trim(),
      header_description: form.header_description,
      logo_url: form.logo_url || null,
      favicon_url: form.favicon_url || null,
      kindergarten_banner_title: form.kindergarten_banner_title.trim(),
      kindergarten_banner_description: form.kindergarten_banner_description.trim() || null,
      kindergarten_banner_image_url: form.kindergarten_banner_image_url || null,
      elementary_banner_title: form.elementary_banner_title.trim(),
      elementary_banner_description: form.elementary_banner_description.trim() || null,
      elementary_banner_image_url: form.elementary_banner_image_url || null,
      senior_banner_title: form.senior_banner_title.trim(),
      senior_banner_description: form.senior_banner_description.trim() || null,
      senior_banner_image_url: form.senior_banner_image_url || null
    };

    const result = settings?.id
      ? await supabase.from("site_settings").update(payload).eq("id", settings.id)
      : await supabase.from("site_settings").insert(payload);
    setIsSaving(false);

    if (result.error) {
      console.error("Site settings save failed", result.error);
      if (result.error.code === "42703" && result.error.message.includes("banner_")) {
        setMessage("관별 배너를 저장할 DB 컬럼이 없습니다. Supabase SQL Editor에서 supabase/add-library-banners.sql을 먼저 실행해주세요.");
        return;
      }
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
            <PreviewImage label="현재 로고" url={form.logo_url} fileName={createDownloadFileName("사이트-로고", form.logo_url, "png")} setMessage={setMessage} />
            <PreviewImage
              label="현재 파비콘"
              url={form.favicon_url}
              fileName={createDownloadFileName("사이트-파비콘", form.favicon_url, "ico")}
              setMessage={setMessage}
              small
            />
          </div>
        </aside>
      </div>

      <section className="mt-8 border-t pt-6">
        <div>
          <h3 className="text-base font-bold">관별 배너 설정</h3>
          <p className="mt-1 text-sm text-gray-500">각 관을 선택했을 때 메인 화면에 표시되는 제목, 설명과 배너 이미지를 관리합니다.</p>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <BannerEditor
            label="유치원관"
            title={form.kindergarten_banner_title}
            description={form.kindergarten_banner_description}
            imageUrl={form.kindergarten_banner_image_url}
            onTitleChange={(value) => updateField("kindergarten_banner_title", value)}
            onDescriptionChange={(value) => updateField("kindergarten_banner_description", value)}
            onImageChange={(event) => uploadAsset(event, "kindergarten_banner_image_url")}
            onImageUrlChange={(value) => updateField("kindergarten_banner_image_url", value)}
            onImageRemove={() => updateField("kindergarten_banner_image_url", "")}
          />
          <BannerEditor
            label="초등관"
            title={form.elementary_banner_title}
            description={form.elementary_banner_description}
            imageUrl={form.elementary_banner_image_url}
            onTitleChange={(value) => updateField("elementary_banner_title", value)}
            onDescriptionChange={(value) => updateField("elementary_banner_description", value)}
            onImageChange={(event) => uploadAsset(event, "elementary_banner_image_url")}
            onImageUrlChange={(value) => updateField("elementary_banner_image_url", value)}
            onImageRemove={() => updateField("elementary_banner_image_url", "")}
          />
          <BannerEditor
            label="시니어관"
            title={form.senior_banner_title}
            description={form.senior_banner_description}
            imageUrl={form.senior_banner_image_url}
            onTitleChange={(value) => updateField("senior_banner_title", value)}
            onDescriptionChange={(value) => updateField("senior_banner_description", value)}
            onImageChange={(event) => uploadAsset(event, "senior_banner_image_url")}
            onImageUrlChange={(value) => updateField("senior_banner_image_url", value)}
            onImageRemove={() => updateField("senior_banner_image_url", "")}
          />
        </div>
      </section>
      <button type="submit" disabled={isSaving || isUploading} className="mt-5 rounded-md bg-gray-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
        {isSaving ? "저장 중..." : isUploading ? "업로드 중..." : "사이트 정보 저장"}
      </button>
    </form>
  );
}

function BannerEditor({
  label,
  title,
  description,
  imageUrl,
  onTitleChange,
  onDescriptionChange,
  onImageChange,
  onImageUrlChange,
  onImageRemove
}: {
  label: string;
  title: string;
  description: string;
  imageUrl: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onImageUrlChange: (value: string) => void;
  onImageRemove: () => void;
}) {
  return (
    <fieldset className="rounded-lg border p-4">
      <legend className="px-1 text-sm font-bold">{label} 배너</legend>
      <div className="space-y-4">
        <Input label="배너 제목" value={title} onChange={onTitleChange} required />
        <label className="block">
          <span className="text-sm font-semibold">배너 설명</span>
          <textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} className="mt-1 min-h-24 w-full rounded-md border px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">배너 이미지 업로드</span>
          <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={onImageChange} className="mt-1 w-full text-sm" />
          <p className="mt-1 text-xs text-gray-500">권장 비율은 가로형 5:1입니다. 새 파일을 선택하지 않으면 기존 이미지가 유지됩니다.</p>
        </label>
        <Input label="배너 이미지 URL" value={imageUrl} onChange={onImageUrlChange} />
        {imageUrl ? (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={`${label} 배너 미리보기`} className="aspect-[5/1] w-full rounded-md border bg-gray-50 object-cover" />
            <button type="button" onClick={onImageRemove} className="mt-2 rounded-md border px-3 py-2 text-sm font-semibold text-red-700">
              배너 이미지 삭제
            </button>
          </div>
        ) : (
          <div className="flex aspect-[5/1] items-center justify-center rounded-md border border-dashed bg-gray-50 text-xs text-gray-400">배너 이미지 없음</div>
        )}
      </div>
    </fieldset>
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

function PreviewImage({
  label,
  url,
  fileName,
  setMessage,
  small = false
}: {
  label: string;
  url: string;
  fileName: string;
  setMessage: (message: string) => void;
  small?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      {url ? (
        <>
          <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={label}
              className={`${small ? "h-12 w-12" : "h-24 w-full"} rounded-md border bg-white object-contain p-2`}
            />
          </a>
          <AdminDownloadButton
            url={url}
            fileName={fileName}
            label="이미지 다운로드"
            setMessage={setMessage}
            className="mt-2 py-2 text-emerald-700"
          />
        </>
      ) : (
        <div className={`${small ? "h-12 w-12" : "h-24 w-full"} mt-2 flex items-center justify-center rounded-md border bg-white text-xs text-gray-400`}>
          이미지 없음
        </div>
      )}
    </div>
  );
}
