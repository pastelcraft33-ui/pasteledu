"use client";

import Image from "next/image";
import { FileText, Presentation } from "lucide-react";
import { useEffect, useState } from "react";
import type { PptMaterial, SiteSettings } from "@/lib/types";

type BoardSettings = Omit<SiteSettings, "id" | "created_at" | "updated_at">;

type Props = {
  material: PptMaterial;
  settings: BoardSettings;
  onClose: () => void;
  onDownload: () => void;
  onOpenPpt: () => void;
};

export default function WorksheetModal({ material, settings, onClose, onDownload, onOpenPpt }: Props) {
  const worksheetUrl = material.worksheet_url ?? "";
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);

  useEffect(() => {
    setIsPreviewLoaded(false);
  }, [worksheetUrl]);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${material.title} 활동지 미리보기`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden border bg-white lg:flex-row"
        style={{ borderColor: settings.card_border_color, borderRadius: settings.card_radius, color: settings.text_color }}
      >
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-gray-100 p-3 sm:p-5">
          <div className="relative aspect-[210/297] h-[72vh] max-h-[900px] max-w-full overflow-hidden bg-white shadow-lg">
            {isWorksheetImage(worksheetUrl) ? (
              <Image
                src={worksheetUrl}
                alt={`${material.title} 활동지 미리보기`}
                fill
                unoptimized
                sizes="(max-width: 1023px) 90vw, 640px"
                className="object-contain"
                onLoad={() => setIsPreviewLoaded(true)}
              />
            ) : (
              <iframe
                src={`${worksheetUrl}#page=1&toolbar=0&navpanes=0`}
                title={`${material.title} 활동지 미리보기`}
                className="h-full w-full border-0 bg-white"
                onLoad={() => setIsPreviewLoaded(true)}
              />
            )}
            {!isPreviewLoaded ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white text-center">
                <span className="flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <FileText className="h-7 w-7" aria-hidden="true" />
                </span>
                <p className="mt-4 text-sm font-bold text-gray-700">활동지를 불러오고 있습니다.</p>
              </div>
            ) : null}
          </div>
        </div>

        <aside
          className="flex max-h-[44vh] w-full shrink-0 flex-col overflow-y-auto border-t p-5 lg:max-h-none lg:w-[340px] lg:border-l lg:border-t-0"
          style={{ borderColor: settings.card_border_color }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-emerald-700">활동지</p>
              <h2 className="mt-2 break-keep text-xl font-extrabold leading-snug">{material.title}</h2>
            </div>
            <button type="button" onClick={onClose} className="shrink-0 rounded-md border px-3 py-2 text-sm font-bold" autoFocus>
              닫기
            </button>
          </div>

          {material.description ? <p className="mt-4 whitespace-pre-line text-sm leading-6 text-gray-600">{material.description}</p> : null}
          {material.worksheet_file_name ? (
            <div className="mt-5 border-t pt-4 text-sm" style={{ borderColor: settings.card_border_color }}>
              <p className="text-xs font-semibold text-gray-500">활동지 파일명</p>
              <p className="mt-1 break-all font-semibold">{material.worksheet_file_name}</p>
            </div>
          ) : null}

          <a
            href={worksheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onDownload}
            className="mt-6 block rounded-md px-4 py-3 text-center text-sm font-bold text-white"
            style={{ backgroundColor: settings.button_color }}
          >
            활동지 다운로드
          </a>

          <div className="mt-6 border-t pt-5 lg:mt-auto" style={{ borderColor: settings.card_border_color }}>
            <div className="flex items-center gap-2">
              <Presentation className="h-4 w-4" aria-hidden="true" />
              <p className="text-sm font-extrabold">연결된 PPT 미리보기</p>
            </div>
            <div className="relative mt-3 aspect-video overflow-hidden rounded-md bg-gray-100">
              {material.thumbnail_url ? (
                <Image
                  src={material.thumbnail_url}
                  alt={`${material.title} PPT 미리보기`}
                  fill
                  sizes="300px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-gray-500">
                  <Presentation className="h-7 w-7" aria-hidden="true" />
                  <p className="mt-2 text-xs font-semibold">PPT 대표 이미지가 없습니다.</p>
                </div>
              )}
            </div>
            {material.file_url ? (
              <button
                type="button"
                onClick={onOpenPpt}
                className="mt-3 w-full rounded-md border px-4 py-3 text-sm font-extrabold transition hover:bg-gray-50"
                style={{ borderColor: settings.button_color, color: settings.button_color }}
              >
                PPT 바로가기
              </button>
            ) : (
              <p className="mt-3 text-center text-xs font-semibold text-gray-500">연결된 PPT 파일이 없습니다.</p>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}

function isWorksheetImage(url: string) {
  const pathname = url.split("?")[0].toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp"].some((extension) => pathname.endsWith(extension));
}
