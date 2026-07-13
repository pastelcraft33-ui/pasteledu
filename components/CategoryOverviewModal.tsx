"use client";

import { useEffect } from "react";
import MaterialCard from "@/components/MaterialCard";
import type { Category, PptMaterial, SiteSettings } from "@/lib/types";

type BoardSettings = Omit<SiteSettings, "id" | "created_at" | "updated_at">;

type Props = {
  category: Category | null;
  materials: PptMaterial[];
  settings: BoardSettings;
  onSelectMaterial: (material: PptMaterial) => void;
  onClose: () => void;
};

export default function CategoryOverviewModal({ category, materials, settings, onSelectMaterial, onClose }: Props) {
  const title = category?.name ?? "미분류";
  const description = category?.description || (category ? "" : "카테고리가 지정되지 않은 자료입니다.");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} 전체 자료`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden border"
        style={{
          backgroundColor: settings.background_color,
          borderColor: settings.card_border_color,
          borderRadius: settings.card_radius,
          color: settings.text_color,
          fontFamily: settings.font_family
        }}
      >
        <header
          className="flex items-start justify-between gap-4 border-b p-4 sm:p-6"
          style={{ backgroundColor: category?.column_color || settings.default_column_color, borderColor: settings.card_border_color }}
        >
          <div className="min-w-0">
            <h2 className="break-keep text-xl font-extrabold sm:text-2xl">{title}</h2>
            {description ? <p className="mt-1 break-keep text-sm opacity-70 sm:text-base">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md border px-3 py-2 text-sm font-bold"
            style={{ backgroundColor: settings.card_background_color, borderColor: settings.card_border_color }}
            aria-label={`${title} 전체보기 닫기`}
            autoFocus
          >
            닫기
          </button>
        </header>

        <div className="overflow-y-auto p-4 sm:p-6">
          <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {materials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                settings={settings}
                onClick={() => onSelectMaterial(material)}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
