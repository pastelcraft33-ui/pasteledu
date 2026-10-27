"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Trash2, Save } from "lucide-react";
import { getHomeBanners, isBannerUrl } from "@/lib/home-banners";
import { createSafeStorageFileName, isAllowedImageFile } from "@/lib/file-utils";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import HomeBanner from "@/components/HomeBanner";
import type { HomeBanner as Banner, SiteSettings } from "@/lib/types";

type Props = { settings: SiteSettings | null; onChanged: () => Promise<void>; setMessage: (message: string) => void };

export default function AdminHomeBanners({ settings, onChanged, setMessage }: Props) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [banners, setBanners] = useState<Banner[]>(() => getHomeBanners(settings?.home_banners));
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const busy = uploading !== null || saving;

  useEffect(() => { setBanners(getHomeBanners(settings?.home_banners)); }, [settings]);

  function change(id: string, patch: Partial<Banner>) {
    setBanners((current) => current.map((banner) => banner.id === id ? { ...banner, ...patch } : banner));
  }

  function move(index: number, offset: number) {
    setBanners((current) => {
      const next = [...current];
      const target = index + offset;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function upload(event: ChangeEvent<HTMLInputElement>, id?: string) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!isAllowedImageFile(file)) { setMessage("메인 배너는 JPG, PNG, WEBP 이미지만 등록할 수 있습니다."); return; }
    if (file.size > 15 * 1024 * 1024) { setMessage("배너 이미지는 15MB 이하로 등록해주세요."); return; }
    const bannerId = id ?? crypto.randomUUID();
    setUploading(bannerId);
    setMessage("");
    try {
      // 대형 원본도 화면에 필요한 크기로 저장해 첫 배너의 로딩을 줄입니다.
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 2400 / bitmap.width, 2400 / bitmap.height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) { bitmap.close(); throw new Error("이미지 변환 실패"); }
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("이미지 변환 실패")), "image/webp", 0.88));
      const path = "home-banners/" + createSafeStorageFileName("banner.webp");
      const { error } = await supabase.storage.from("site-assets").upload(path, blob, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
      if (error) throw error;
      const url = supabase.storage.from("site-assets").getPublicUrl(path).data.publicUrl;
      if (id) change(id, { image_url: url });
      else setBanners((current) => [...current, { id: bannerId, image_url: url, alt: "", link_url: "", enabled: true }]);
      setMessage("이미지를 업로드했습니다. 메인 배너 저장을 누르면 사이트에 반영됩니다.");
    } catch (error) {
      console.error("메인 배너 업로드 실패", error);
      setMessage("이미지를 업로드하지 못했습니다. 파일과 인터넷 연결, Storage 권한을 확인해주세요.");
    } finally { setUploading(null); }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!settings?.id) { setMessage("사이트 정보를 먼저 저장한 뒤 메인 배너를 등록해주세요."); return; }
    const payload = banners.map((banner) => ({ ...banner, alt: banner.alt.trim(), link_url: banner.link_url.trim() }));
    if (payload.some((banner) => banner.link_url && !isBannerUrl(banner.link_url))) {
      setMessage("연결 주소는 https://로 시작하는 주소 또는 /로 시작하는 사이트 내부 경로를 입력해주세요."); return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.from("site_settings").update({ home_banners: payload }).eq("id", settings.id).select("id").single();
      if (error) {
        if (error.code === "42703" || error.code === "PGRST204") {
          setMessage("메인 배너 저장 항목을 먼저 추가해야 합니다. Supabase SQL Editor에서 supabase/add-home-banners.sql 파일 내용을 실행해주세요.");
          return;
        }
        throw error;
      }
      if (!data) throw new Error("저장된 설정 없음");
      await onChanged();
      setMessage("메인 배너를 저장했습니다.");
    } catch (error) {
      console.error("메인 배너 저장 실패", error);
      setMessage("메인 배너를 저장하지 못했습니다. 로그인 상태와 인터넷 연결을 확인해주세요.");
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div><h2 className="text-lg font-bold">메인 배너 관리</h2><p className="mt-1 text-sm text-gray-500">권장 크기 1200 × 440px · JPG, PNG, WEBP · 최대 15MB. 이미지 한 장만으로 등록할 수 있습니다.</p></div>
        <label className={"inline-flex items-center gap-2 rounded-md border bg-white px-4 py-2 text-sm font-bold " + (busy ? "opacity-50" : "cursor-pointer")}><ImagePlus className="h-4 w-4" />{uploading ? "이미지 업로드 중..." : "배너 이미지 추가"}<input type="file" accept=".jpg,.jpeg,.png,.webp" disabled={busy} onChange={(event) => upload(event)} className="sr-only" /></label>
      </div>
      {banners.length === 0 ? <p className="border border-dashed p-8 text-center text-sm text-gray-500">등록된 메인 배너가 없습니다.</p> : null}
      {banners.map((banner, index) => (
        <fieldset key={banner.id} disabled={busy} className="rounded-lg border bg-white p-4 disabled:opacity-60">
          <legend className="px-1 font-bold">배너 {index + 1}</legend>
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={banner.image_url} alt={banner.alt || "배너 " + (index + 1) + " 미리보기"} width={1200} height={440} className="aspect-[30/11] w-full rounded-md bg-gray-50 object-contain" />
              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold"><ImagePlus className="h-4 w-4" />이미지 교체<input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(event) => upload(event, banner.id)} className="sr-only" /></label>
            </div>
            <div className="min-w-0 space-y-3">
              <label className="block text-sm font-semibold">이미지 설명 (선택)<input value={banner.alt} onChange={(event) => change(banner.id, { alt: event.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 font-normal" /></label>
              <label className="block text-sm font-semibold">클릭 시 연결 주소 (선택)<input value={banner.link_url} placeholder="https://" onChange={(event) => change(banner.id, { link_url: event.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 font-normal" /></label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="mr-auto flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={banner.enabled} onChange={(event) => change(banner.id, { enabled: event.target.checked })} />메인 화면에 표시</label>
                <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={(index + 1) + "번 배너 앞으로 이동"} title="앞으로 이동" className="rounded-md border p-2 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" disabled={index === banners.length - 1} onClick={() => move(index, 1)} aria-label={(index + 1) + "번 배너 뒤로 이동"} title="뒤로 이동" className="rounded-md border p-2 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => setBanners((current) => current.filter((item) => item.id !== banner.id))} aria-label={(index + 1) + "번 배너 목록에서 제거"} title="목록에서 제거" className="rounded-md border p-2 text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        </fieldset>
      ))}
      <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "저장 중..." : "메인 배너 저장"}</button>
      {banners.some((banner) => banner.enabled) ? <div className="border-t pt-5"><h3 className="font-bold">메인 배너 미리보기</h3><HomeBanner banners={banners} /></div> : null}
    </form>
  );
}
