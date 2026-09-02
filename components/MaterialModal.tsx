"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import WorksheetPdfPage from "@/components/WorksheetPdfPage";
import type { PptMaterial, SiteSettings } from "@/lib/types";
import { getWorksheetFiles, isWorksheetImage } from "@/lib/worksheet-utils";

type BoardSettings = Omit<SiteSettings, "id" | "created_at" | "updated_at">;

type Props = {
  material: PptMaterial;
  categoryName: string;
  settings: BoardSettings;
  onClose: () => void;
  onDownload: () => void;
};

export default function MaterialModal({ material, categoryName, settings, onClose, onDownload }: Props) {
  const fileUrl = material.file_url ?? "";
  const worksheetFiles = getWorksheetFiles(material);
  const [worksheetFileIndex, setWorksheetFileIndex] = useState(0);
  const [worksheetPage, setWorksheetPage] = useState(1);
  const [worksheetPageCounts, setWorksheetPageCounts] = useState<Record<number, number>>({});
  const activeWorksheet = worksheetFiles[worksheetFileIndex] ?? null;
  const worksheetUrl = activeWorksheet?.url ?? "";
  const activeWorksheetPageCount = activeWorksheet
    ? isWorksheetImage(activeWorksheet.url)
      ? 1
      : worksheetPageCounts[worksheetFileIndex] ?? 1
    : 0;
  const worksheetSlideCounts = worksheetFiles.map((file, index) =>
    isWorksheetImage(file.url) ? 1 : worksheetPageCounts[index] ?? 1
  );
  const totalWorksheetSlides = worksheetSlideCounts.reduce((total, count) => total + count, 0);
  const currentWorksheetSlide =
    worksheetSlideCounts.slice(0, worksheetFileIndex).reduce((total, count) => total + count, 0) + worksheetPage;
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);
  const previewUrl = fileUrl ? createOfficePreviewUrl(fileUrl) : "";

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

  useEffect(() => {
    setIsPreviewLoaded(false);
    setWorksheetFileIndex(0);
    setWorksheetPage(1);
    setWorksheetPageCounts({});
  }, [material.id]);

  function moveWorksheet(direction: -1 | 1) {
    if (direction === 1 && worksheetPage < activeWorksheetPageCount) {
      setWorksheetPage((current) => current + 1);
      return;
    }
    if (direction === -1 && worksheetPage > 1) {
      setWorksheetPage((current) => current - 1);
      return;
    }

    const nextFileIndex = (worksheetFileIndex + direction + worksheetFiles.length) % worksheetFiles.length;
    setWorksheetFileIndex(nextFileIndex);
    setWorksheetPage(direction === -1 ? worksheetSlideCounts[nextFileIndex] : 1);
  }

  useEffect(() => {
    if (!previewUrl) return;

    setIsPreviewLoaded(false);
  }, [previewUrl]);

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
            <div className="relative h-full min-h-[62vh] w-full">
              <iframe
                key={previewUrl}
                src={previewUrl}
                title={`${material.title} PPT 미리보기`}
                className="h-full w-full border-0 bg-black"
                allowFullScreen
                loading="eager"
                onLoad={() => setIsPreviewLoaded(true)}
              />
              {!isPreviewLoaded ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center text-white">
                  <div className="max-w-md">
                    {material.thumbnail_url ? (
                      <Image
                        src={material.thumbnail_url}
                        alt={`${material.title} 썸네일`}
                        width={640}
                        height={360}
                        unoptimized
                        className="mx-auto mb-5 aspect-video w-full max-w-sm rounded-md object-cover opacity-80"
                      />
                    ) : null}
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-white/25 border-t-white" />
                    <p className="mt-4 text-sm font-semibold">PPT 미리보기를 불러오는 중입니다...</p>
                    <p className="mt-2 text-xs leading-5 text-white/70">
                      첫 미리보기는 외부 뷰어가 PPT를 변환하느라 시간이 걸릴 수 있습니다.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mx-4 flex w-full max-w-4xl flex-col items-center justify-center rounded-lg bg-white p-8 text-center">
              {material.thumbnail_url ? (
                <Image
                  src={material.thumbnail_url}
                  alt={`${material.title} 썸네일`}
                  width={1200}
                  height={675}
                  unoptimized
                  className="aspect-video w-full rounded-md object-cover"
                />
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
              <p className="text-xs font-semibold text-gray-500">카테고리</p>
              <p className="mt-1 text-sm font-bold">{categoryName}</p>
              <p className="mt-5 text-xs font-semibold text-gray-500">제목</p>
              <h2 className="mt-1 text-lg font-bold leading-6">{material.title}</h2>
            </div>
            <button type="button" onClick={onClose} className="rounded-full bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-600 lg:hidden">
              닫기
            </button>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold text-gray-500">설명</p>
            <p className="mt-1 whitespace-pre-line text-sm leading-6 text-gray-600">{material.description || "-"}</p>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold text-gray-500">태그</p>
            {material.tags?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {material.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-sm text-gray-600">-</p>
            )}
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold text-gray-500">연령</p>
            {material.age_groups?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {material.age_groups.map((ageGroup) => (
                  <span key={ageGroup} className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
                    {ageGroup}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-sm text-gray-600">-</p>
            )}
          </div>

          <dl className="mt-6 space-y-3 border-t pt-5 text-sm" style={{ borderColor: settings.card_border_color }}>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">파일명</dt>
              <dd className="max-w-[220px] truncate text-right font-semibold">{material.file_name || "-"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">다운로드 가능 여부</dt>
              <dd className="font-semibold">{material.is_downloadable && material.file_url ? "가능" : "불가"}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col gap-2">
            {material.is_downloadable && fileUrl ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onDownload}
                className="rounded-md px-4 py-3 text-center text-sm font-bold text-white"
                style={{ backgroundColor: settings.button_color }}
              >
                PPT 다운로드
              </a>
            ) : null}
          </div>

          {worksheetUrl ? (
            <section className="mt-7 border-t pt-6" style={{ borderColor: settings.card_border_color }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500">활동지</p>
                  <h3 className="mt-1 text-base font-bold">활동지 미리보기</h3>
                  {activeWorksheet?.fileName ? (
                    <p className="mt-1 break-all text-xs text-gray-500">{activeWorksheet.fileName}</p>
                  ) : null}
                </div>
                {totalWorksheetSlides > 1 ? (
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-black text-white shadow-lg"
                    aria-label={`활동지 ${totalWorksheetSlides}장`}
                  >
                    {totalWorksheetSlides}장
                  </span>
                ) : null}
              </div>

              <div className="relative mt-3 overflow-hidden rounded-md border bg-gray-50" style={{ borderColor: settings.card_border_color }}>
                {isWorksheetImage(worksheetUrl) ? (
                  <Image
                    src={worksheetUrl}
                    alt={`${material.title} 활동지 미리보기`}
                    width={900}
                    height={1200}
                    unoptimized
                    className="h-auto max-h-[520px] w-full object-contain"
                  />
                ) : (
                  <div className="h-[420px] w-full bg-white">
                    <WorksheetPdfPage
                      key={worksheetUrl}
                      url={worksheetUrl}
                      pageNumber={worksheetPage}
                      onPageCount={(count) =>
                        setWorksheetPageCounts((current) => ({ ...current, [worksheetFileIndex]: count }))
                      }
                    />
                  </div>
                )}
                {totalWorksheetSlides > 1 ? (
                  <>
                    <button
                      type="button"
                      aria-label="이전 활동지"
                      onClick={() => moveWorksheet(-1)}
                      className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-md"
                    >
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label="다음 활동지"
                      onClick={() => moveWorksheet(1)}
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-md"
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-gray-900/80 px-2.5 py-1 text-xs font-bold text-white">
                      {currentWorksheetSlide} / {totalWorksheetSlides}
                    </span>
                  </>
                ) : null}
              </div>

              <a
                href={worksheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onDownload}
                className="mt-3 block rounded-md px-4 py-3 text-center text-sm font-bold text-white"
                style={{ backgroundColor: settings.button_color }}
              >
                활동지 다운로드
              </a>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function createOfficePreviewUrl(fileUrl: string) {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
}
