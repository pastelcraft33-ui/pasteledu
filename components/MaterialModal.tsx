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
  const previewUrl = material.file_url ? createOfficePreviewUrl(material.file_url) : "";

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
    <div className="fixed inset-0 z-50 bg-black text-gray-950" role="dialog" aria-modal="true" aria-label={`${material.title} PPT 미리보기`}>
      <button
        type="button"
        onClick={onClose}
        className="absolute left-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-2xl leading-none text-gray-500 shadow"
        aria-label="닫기"
        autoFocus
      >
        ×
      </button>

      <div className="flex h-full flex-col lg:flex-row">
        <div className="flex min-h-0 flex-1 items-center justify-center bg-black pt-14 lg:pt-0">
          {previewUrl ? (
            <iframe
              src={previewUrl}
              title={`${material.title} PPT 미리보기`}
              className="h-full min-h-[62vh] w-full border-0 bg-black"
              allowFullScreen
            />
          ) : (
            <div className="mx-4 flex w-full max-w-4xl flex-col items-center justify-center rounded-lg bg-white p-8 text-center">
              {material.thumbnail_url ? (
                <Image src={material.thumbnail_url} alt={`${material.title} 썸네일`} width={1200} height={675} className="aspect-video w-full rounded-md object-cover" />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center rounded-md bg-gray-100 text-sm text-gray-500">PPT 파일이 없습니다.</div>
              )}
              <p className="mt-5 text-sm text-gray-600">미리볼 PPT 파일 URL이 등록되어 있지 않습니다.</p>
            </div>
          )}
        </div>

        <aside
          className="max-h-[38vh] w-full overflow-y-auto border-t bg-white p-5 lg:max-h-none lg:w-[360px] lg:border-l lg:border-t-0 xl:w-[420px]"
          style={{ borderColor: settings.card_border_color }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500">{categoryName}</p>
              <h2 className="mt-1 text-lg font-bold leading-6">{material.title}</h2>
            </div>
            <button type="button" onClick={onClose} className="rounded-full bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-600 lg:hidden">
              닫기
            </button>
          </div>

          {material.description ? <p className="mt-5 whitespace-pre-line text-sm leading-6 text-gray-600">{material.description}</p> : null}

          {material.tags?.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {material.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <dl className="mt-6 space-y-3 border-t pt-5 text-sm" style={{ borderColor: settings.card_border_color }}>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">등록일</dt>
              <dd className="font-semibold">
                <time dateTime={material.created_at}>{formattedDate}</time>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">파일명</dt>
              <dd className="max-w-[220px] truncate text-right font-semibold">{material.file_name || "-"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">다운로드</dt>
              <dd className="font-semibold">{material.is_downloadable && material.file_url ? "가능" : "불가"}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col gap-2">
            {material.file_url ? (
              <a
                href={material.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border px-4 py-3 text-center text-sm font-bold"
                style={{ borderColor: settings.card_border_color }}
              >
                원본 파일 새 창에서 열기
              </a>
            ) : null}
            {material.is_downloadable && material.file_url ? (
              <a
                href={material.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md px-4 py-3 text-center text-sm font-bold text-white"
                style={{ backgroundColor: settings.button_color }}
              >
                PPT 다운로드
              </a>
            ) : null}
          </div>

          <p className="mt-5 text-xs leading-5 text-gray-500">
            미리보기가 표시되지 않으면 원본 파일을 새 창에서 열어 확인해주세요.
          </p>
        </aside>
      </div>
    </div>
  );
}

function createOfficePreviewUrl(fileUrl: string) {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
}
