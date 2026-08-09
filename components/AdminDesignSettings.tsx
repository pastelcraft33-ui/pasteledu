"use client";

import { FormEvent, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { SiteSettings } from "@/lib/types";

type Props = {
  settings: SiteSettings | null;
  onChanged: () => Promise<void>;
  setMessage: (message: string) => void;
};

type DesignForm = {
  background_color: string;
  header_background_color: string;
  banner_background_color: string;
  banner_text_color: string;
  default_column_color: string;
  card_background_color: string;
  card_border_color: string;
  button_color: string;
  text_color: string;
  font_family: string;
  card_radius: number;
  use_card_shadow: boolean;
};

const defaultForm: DesignForm = {
  background_color: "#ffffff",
  header_background_color: "#ffffff",
  banner_background_color: "#fce7f3",
  banner_text_color: "#db3f72",
  default_column_color: "#ffffff",
  card_background_color: "#ffffff",
  card_border_color: "#e5e7eb",
  button_color: "#111827",
  text_color: "#111827",
  font_family: "system-ui",
  card_radius: 12,
  use_card_shadow: true
};

const fontOptions = ["system-ui", "sans-serif", "serif", "monospace", "Arial", "Pretendard", "Noto Sans KR"];

export default function AdminDesignSettings({ settings, onChanged, setMessage }: Props) {
  const supabase = createBrowserSupabaseClient();
  const [form, setForm] = useState<DesignForm>(defaultForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setForm({
      background_color: settings.background_color,
      header_background_color: settings.header_background_color,
      banner_background_color: settings.banner_background_color ?? "#fce7f3",
      banner_text_color: settings.banner_text_color ?? "#db3f72",
      default_column_color: settings.default_column_color,
      card_background_color: settings.card_background_color,
      card_border_color: settings.card_border_color,
      button_color: settings.button_color,
      text_color: settings.text_color,
      font_family: settings.font_family,
      card_radius: settings.card_radius,
      use_card_shadow: settings.use_card_shadow
    });
  }, [settings]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    const payload = {
      ...form,
      card_radius: Math.min(40, Math.max(0, Number(form.card_radius)))
    };
    const result = settings?.id
      ? await supabase.from("site_settings").update(payload).eq("id", settings.id)
      : await supabase.from("site_settings").insert(payload);
    setIsSaving(false);

    if (result.error) {
      console.error("Design settings save failed", result.error);
      if (result.error.code === "42703" && result.error.message.includes("banner_")) {
        setMessage("배너 색상을 저장할 DB 컬럼이 없습니다. Supabase SQL Editor에서 supabase/add-library-sections.sql을 먼저 실행해주세요.");
        return;
      }
      setMessage("저장 중 오류가 발생했습니다. 입력값과 로그인 상태를 확인해주세요.");
      return;
    }
    setMessage("디자인 설정이 저장되었습니다.");
    await onChanged();
  }

  const previewStyle = {
    backgroundColor: form.card_background_color,
    borderColor: form.card_border_color,
    color: form.text_color,
    borderRadius: `${form.card_radius}px`,
    fontFamily: form.font_family,
    boxShadow: form.use_card_shadow ? "0 10px 24px rgba(15, 23, 42, 0.14)" : "none"
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-bold">디자인 설정</h2>
        <p className="mt-1 text-sm text-gray-500">메인 화면에 반영되는 색상, 폰트, 카드 스타일을 관리합니다.</p>
      </div>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorInput label="전체 배경색" value={form.background_color} onChange={(value) => setForm({ ...form, background_color: value })} />
          <ColorInput
            label="상단 영역 배경색"
            value={form.header_background_color}
            onChange={(value) => setForm({ ...form, header_background_color: value })}
          />
          <ColorInput
            label="관 배너 배경색"
            value={form.banner_background_color}
            onChange={(value) => setForm({ ...form, banner_background_color: value })}
          />
          <ColorInput
            label="관 배너 글자색"
            value={form.banner_text_color}
            onChange={(value) => setForm({ ...form, banner_text_color: value })}
          />
          <ColorInput
            label="기본 컬럼 배경색"
            value={form.default_column_color}
            onChange={(value) => setForm({ ...form, default_column_color: value })}
          />
          <ColorInput
            label="카드 배경색"
            value={form.card_background_color}
            onChange={(value) => setForm({ ...form, card_background_color: value })}
          />
          <ColorInput
            label="카드 테두리 색상"
            value={form.card_border_color}
            onChange={(value) => setForm({ ...form, card_border_color: value })}
          />
          <ColorInput label="버튼 색상" value={form.button_color} onChange={(value) => setForm({ ...form, button_color: value })} />
          <ColorInput label="텍스트 색상" value={form.text_color} onChange={(value) => setForm({ ...form, text_color: value })} />
          <label className="block">
            <span className="text-sm font-semibold">폰트 종류</span>
            <select
              value={form.font_family}
              onChange={(event) => setForm({ ...form, font_family: event.target.value })}
              className="mt-1 w-full rounded-md border px-3 py-2"
            >
              {fontOptions.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="카드 둥근 정도"
            type="number"
            value={String(form.card_radius)}
            min={0}
            max={40}
            onChange={(value) => setForm({ ...form, card_radius: Math.min(40, Math.max(0, Number(value))) })}
          />
          <label className="flex items-center gap-2 self-end text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.use_card_shadow}
              onChange={(event) => setForm({ ...form, use_card_shadow: event.target.checked })}
            />
            카드 그림자 사용
          </label>
        </div>
        <aside className="rounded-lg border bg-gray-50 p-4">
          <h3 className="text-sm font-bold">디자인 미리보기</h3>
          <div className="mt-4 border p-4" style={{ backgroundColor: form.default_column_color }}>
            <div className="border p-4" style={previewStyle}>
              <div className="aspect-video rounded-md border bg-white/60" />
              <p className="mt-4 text-base font-bold">예시 PPT 자료 카드</p>
              <p className="mt-2 text-sm opacity-80">디자인 설정 미리보기</p>
              <button type="button" className="mt-4 rounded-md px-3 py-2 text-sm font-bold text-white" style={{ backgroundColor: form.button_color }}>
                PPT 다운로드
              </button>
            </div>
          </div>
        </aside>
      </div>
      <button type="submit" disabled={isSaving} className="mt-5 rounded-md bg-gray-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
        {isSaving ? "저장 중..." : "디자인 설정 저장"}
      </button>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  min,
  max
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border px-3 py-2"
      />
    </label>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const colorValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";

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
