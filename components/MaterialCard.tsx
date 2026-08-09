"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { PptMaterial, SiteSettings } from "@/lib/types";

type BoardSettings = Omit<SiteSettings, "id" | "created_at" | "updated_at">;

type Props = {
  material: PptMaterial;
  settings: BoardSettings;
  onClick: () => void;
};

export default function MaterialCard({ material, settings, onClick }: Props) {
  const formattedDate = formatDate(material.created_at);
  const [thumbnailState, setThumbnailState] = useState<"loading" | "loaded" | "error">(
    material.thumbnail_url ? "loading" : "error"
  );

  useEffect(() => {
    setThumbnailState(material.thumbnail_url ? "loading" : "error");
  }, [material.thumbnail_url]);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onClick();
      }}
      className="flex h-full min-h-0 shrink-0 flex-col overflow-hidden border text-left transition hover:-translate-y-0.5"
      style={{
        backgroundColor: settings.card_background_color,
        borderColor: settings.card_border_color,
        borderRadius: settings.card_radius,
        boxShadow: settings.use_card_shadow ? "0 8px 24px rgba(15, 23, 42, 0.10)" : "none"
      }}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        {material.thumbnail_url && thumbnailState !== "error" ? (
          <Image
            key={material.thumbnail_url}
            src={material.thumbnail_url}
            alt={`${material.title} 썸네일`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
            unoptimized
            onLoad={() => setThumbnailState("loaded")}
            onError={() => setThumbnailState("error")}
            className={`object-cover transition-opacity duration-200 ${thumbnailState === "loaded" ? "opacity-100" : "opacity-0"}`}
          />
        ) : null}
        {thumbnailState !== "loaded" ? (
          <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-sm font-semibold text-gray-500 sm:text-base">
            {thumbnailState === "loading" ? "대표 이미지 불러오는 중..." : "썸네일 없음"}
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <div>
          <h3 className="line-clamp-2 min-h-11 break-keep text-base font-extrabold leading-snug sm:min-h-12 sm:text-lg">{material.title}</h3>
          {material.description ? <p className="mt-0.5 line-clamp-2 break-keep text-sm leading-5 opacity-70 sm:text-base sm:leading-5">{material.description}</p> : null}
        </div>
        {material.tags?.length ? (
          <div className="flex h-8 flex-wrap gap-1.5 overflow-hidden">
            {material.tags.map((tag) => (
              <span key={tag} className="h-fit rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 sm:px-2.5 sm:text-sm">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-auto flex min-h-10 flex-row items-end justify-between gap-2 text-sm opacity-70 sm:min-h-11 sm:gap-3">
          <time dateTime={material.created_at}>{formattedDate}</time>
          {material.is_downloadable && material.file_url ? (
            <a
              href={material.file_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="w-fit shrink-0 rounded-md px-3 py-2 text-sm font-bold text-white sm:px-3.5 sm:text-base"
              style={{ backgroundColor: settings.button_color }}
            >
              PPT 다운로드
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
}
