"use client";

import Image from "next/image";
import { useEffect } from "react";
import type { PptMaterial, SiteSettings } from "@/lib/types";

type BoardSettings = Omit<SiteSettings, "id" | "created_at" | "updated_at">;

type Props = {
  material: PptMaterial;
  categoryName: string;
  settings: BoardSettings;
  onClose: () => void;
};

export default function MaterialModal({ material, categoryName, settings, onClose }: Props) {
  const formattedDate = formatDate(material.created_at);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <section
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto border"
        onClick={(event) => event.stopPropagation()}
        style={{
          backgroundColor: settings.card_background_color,
          color: settings.text_color,
          borderColor: settings.card_border_color,
          borderRadius: settings.card_radius
        }}
      >
        {material.thumbnail_url ? (
          <Image src={material.thumbnail_url} alt={`${material.title} 썸네일`} width={1200} height={675} className="max-h-[420px] w-full object-cover" />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-gray-100 text-sm text-gray-500">썸네일 없음</div>
        )}
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold opacity-65">{categoryName}</p>
              <h2 className="mt-1 text-2xl font-bold">{material.title}</h2>
            </div>
            <button type="button" onClick={onClose} className="rounded-md border px-3 py-2 text-sm" autoFocus>
              닫기
            </button>
          </div>
          {material.description ? <p className="whitespace-pre-line text-sm leading-6 opacity-80">{material.description}</p> : null}
          {material.tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {material.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          <div className="text-sm opacity-70">
            등록일: <time dateTime={material.created_at}>{formattedDate}</time>
          </div>
          {material.is_downloadable && material.file_url ? (
            <a
              href={material.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-md px-4 py-3 text-sm font-bold text-white"
              style={{ backgroundColor: settings.button_color }}
            >
              PPT 다운로드
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
}
