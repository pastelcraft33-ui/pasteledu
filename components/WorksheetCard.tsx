"use client";

import Image from "next/image";
import { FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PptMaterial, SiteSettings } from "@/lib/types";

type BoardSettings = Omit<SiteSettings, "id" | "created_at" | "updated_at">;

type Props = {
  material: PptMaterial;
  settings: BoardSettings;
  onClick: () => void;
  onDownload: () => void;
};

export default function WorksheetCard({ material, settings, onClick, onDownload }: Props) {
  const worksheetUrl = material.worksheet_url ?? "";

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onClick();
      }}
      className="flex h-full min-h-0 flex-col overflow-hidden border text-left transition hover:-translate-y-0.5"
      style={{
        backgroundColor: settings.card_background_color,
        borderColor: settings.card_border_color,
        borderRadius: settings.card_radius,
        boxShadow: settings.use_card_shadow ? "0 8px 24px rgba(15, 23, 42, 0.10)" : "none"
      }}
    >
      <div className="relative mx-auto aspect-[210/297] w-full overflow-hidden bg-gray-100">
        {worksheetUrl ? (
          isWorksheetImage(worksheetUrl) ? (
            <Image
              src={worksheetUrl}
              alt={`${material.title} 활동지 미리보기`}
              fill
              unoptimized
              sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1023px) calc(50vw - 32px), 304px"
              className="object-contain"
            />
          ) : (
            <LazyWorksheetPdfPreview url={worksheetUrl} title={material.title} />
          )
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm font-semibold text-gray-500">활동지 파일이 없습니다.</div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-xs font-bold text-emerald-700">활동지</p>
          <h3 className="mt-1 line-clamp-2 min-h-12 break-keep text-lg font-extrabold leading-snug">{material.title}</h3>
        </div>
        {material.worksheet_file_name ? (
          <p className="line-clamp-1 text-xs text-gray-500">{material.worksheet_file_name}</p>
        ) : null}
        <a
          href={worksheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => {
            event.stopPropagation();
            onDownload();
          }}
          className="mt-auto rounded-md px-4 py-3 text-center text-sm font-bold text-white"
          style={{ backgroundColor: settings.button_color }}
        >
          활동지 다운로드
        </a>
      </div>
    </article>
  );
}

function isWorksheetImage(url: string) {
  const pathname = url.split("?")[0].toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp"].some((extension) => pathname.endsWith(extension));
}

function LazyWorksheetPdfPreview({ url, title }: { url: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || shouldLoad) return;

    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: "160px 0px" }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <div ref={containerRef} className="relative h-full w-full bg-white">
      {shouldLoad ? (
        <iframe
          src={`${url}#page=1&zoom=page-width&toolbar=0&navpanes=0&scrollbar=0`}
          title={`${title} 활동지 첫 페이지`}
          loading="lazy"
          tabIndex={-1}
          onLoad={() => setIsLoaded(true)}
          className="pointer-events-none h-full w-full border-0 bg-white"
        />
      ) : null}
      {!isLoaded ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-white to-emerald-50 text-center">
          <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <FileText className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="mt-3 text-xs font-bold text-gray-600">활동지 미리보기 불러오는 중</p>
        </div>
      ) : null}
    </div>
  );
}
