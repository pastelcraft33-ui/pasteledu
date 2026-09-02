"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

type Props = {
  url: string;
  pageNumber: number;
  onPageCount: (pageCount: number) => void;
  loadingLabel?: string;
};

export default function WorksheetPdfPage({ url, pageNumber, onPageCount, loadingLabel = "활동지 미리보기 불러오는 중" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => setWidth(Math.max(1, Math.floor(container.clientWidth)));
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="flex h-full w-full items-start justify-center overflow-hidden bg-white">
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => onPageCount(numPages)}
        loading={<PreviewStatus label={loadingLabel} />}
        error={<PreviewStatus label="활동지 미리보기를 불러오지 못했습니다." />}
        className="flex w-full justify-center"
      >
        <Page
          pageNumber={pageNumber}
          width={width}
          renderAnnotationLayer={false}
          renderTextLayer={false}
          loading={<PreviewStatus label={loadingLabel} />}
          className="max-w-full"
        />
      </Document>
    </div>
  );
}

function PreviewStatus({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-48 w-full items-center justify-center bg-emerald-50 px-4 text-center text-xs font-bold text-gray-600">
      {label}
    </div>
  );
}
