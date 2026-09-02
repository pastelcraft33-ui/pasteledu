"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import WorksheetPdfPage from "@/components/WorksheetPdfPage";
import type { PptMaterial, SiteSettings } from "@/lib/types";
import { getWorksheetFiles, isWorksheetImage } from "@/lib/worksheet-utils";

type BoardSettings = Omit<SiteSettings, "id" | "created_at" | "updated_at">;

type Props = {
  material: PptMaterial;
  settings: BoardSettings;
  onClick: () => void;
  onDownload: () => void;
};

export default function WorksheetCard({ material, settings, onClick, onDownload }: Props) {
  const worksheetFiles = getWorksheetFiles(material);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [pageCounts, setPageCounts] = useState<Record<number, number>>({});
  const touchStartX = useRef<number | null>(null);
  const didSwipe = useRef(false);
  const activeWorksheet = worksheetFiles[activeFileIndex] ?? null;
  const activePageCount = activeWorksheet
    ? isWorksheetImage(activeWorksheet.url)
      ? 1
      : pageCounts[activeFileIndex] ?? 1
    : 0;
  const slideCounts = worksheetFiles.map((file, index) => isWorksheetImage(file.url) ? 1 : pageCounts[index] ?? 1);
  const totalSlideCount = slideCounts.reduce((total, count) => total + count, 0);
  const currentSlideNumber = slideCounts.slice(0, activeFileIndex).reduce((total, count) => total + count, 0) + activePage;

  function moveSlide(direction: -1 | 1) {
    if (direction === 1 && activePage < activePageCount) {
      setActivePage((current) => current + 1);
      return;
    }
    if (direction === -1 && activePage > 1) {
      setActivePage((current) => current - 1);
      return;
    }

    const nextFileIndex = (activeFileIndex + direction + worksheetFiles.length) % worksheetFiles.length;
    setActiveFileIndex(nextFileIndex);
    setActivePage(direction === -1 ? slideCounts[nextFileIndex] : 1);
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => {
        if (didSwipe.current) {
          didSwipe.current = false;
          return;
        }
        onClick();
      }}
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
      <div
        className="relative mx-auto aspect-[210/297] w-full overflow-hidden bg-gray-100"
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const startX = touchStartX.current;
          const endX = event.changedTouches[0]?.clientX;
          touchStartX.current = null;
          if (startX === null || endX === undefined || worksheetFiles.length < 2) return;
          const distance = endX - startX;
          if (Math.abs(distance) >= 45) {
            didSwipe.current = true;
            moveSlide(distance > 0 ? -1 : 1);
          }
        }}
      >
        {activeWorksheet ? (
          isWorksheetImage(activeWorksheet.url) ? (
            <Image
              key={activeWorksheet.url}
              src={activeWorksheet.url}
              alt={`${material.title} 활동지 ${currentSlideNumber} 미리보기`}
              fill
              unoptimized
              sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1023px) calc(50vw - 32px), 304px"
              className="object-contain"
            />
          ) : (
            <LazyWorksheetPdfPreview
              key={activeWorksheet.url}
              url={activeWorksheet.url}
              title={`${material.title} 활동지 ${currentSlideNumber}`}
              pageNumber={activePage}
              onPageCount={(count) => setPageCounts((current) => ({ ...current, [activeFileIndex]: count }))}
            />
          )
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm font-semibold text-gray-500">활동지 파일이 없습니다.</div>
        )}
        {totalSlideCount > 0 ? (
          <span
            className="absolute right-3 top-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-xs font-black text-white shadow-lg"
            aria-label={`활동지 ${totalSlideCount}장`}
          >
            {totalSlideCount}장
          </span>
        ) : null}
        {totalSlideCount > 1 ? (
          <>
            <button
              type="button"
              aria-label="이전 활동지"
              onClick={(event) => {
                event.stopPropagation();
                moveSlide(-1);
              }}
              className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-md transition hover:bg-white"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="다음 활동지"
              onClick={(event) => {
                event.stopPropagation();
                moveSlide(1);
              }}
              className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-md transition hover:bg-white"
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </button>
            <span className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-gray-900/80 px-3 py-1 text-xs font-bold text-white">
              {currentSlideNumber} / {totalSlideCount}
            </span>
          </>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-xs font-bold text-emerald-700">활동지</p>
          <h3 className="mt-1 line-clamp-2 min-h-12 break-keep text-lg font-extrabold leading-snug">{material.title}</h3>
        </div>
        {activeWorksheet?.fileName ? (
          <p className="line-clamp-1 text-xs text-gray-500">{activeWorksheet.fileName}</p>
        ) : null}
        <a
          href={activeWorksheet?.url ?? "#"}
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

function LazyWorksheetPdfPreview({
  url,
  title,
  pageNumber,
  onPageCount
}: {
  url: string;
  title: string;
  pageNumber: number;
  onPageCount: (pageCount: number) => void;
}) {
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
        <div className="pointer-events-none h-full w-full" title={`${title} 미리보기`}>
          <WorksheetPdfPage
            url={url}
            pageNumber={pageNumber}
            onPageCount={(count) => {
              onPageCount(count);
              setIsLoaded(true);
            }}
          />
        </div>
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
