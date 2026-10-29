"use client";

import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
const options = { disableAutoFetch: true, disableStream: true, rangeChunkSize: 65536, isEvalSupported: false };

export default function PptPdfViewer({ url, title }: { url: string; title: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 450 });
  const [ratio, setRatio] = useState(16 / 9);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const touch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const resize = () => setSize({ width: element.clientWidth, height: element.clientHeight });
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function move(direction: number) { setPage((value) => Math.max(1, Math.min(count || 1, value + direction))); }
  function labelLinks() {
    container.current?.querySelectorAll<HTMLAnchorElement>(".annotationLayer a[href]").forEach((link) => {
      if (!link.getAttribute("aria-label")) link.setAttribute("aria-label", link.target === "_blank" ? `외부 링크 열기: ${link.href} (새 창)` : "연결된 슬라이드로 이동");
    });
  }
  const loading = <p className="p-6 text-center text-sm text-white" role="status">PDF 미리보기를 불러오는 중입니다.</p>;
  const error = <div className="p-6 text-center text-sm text-white"><p>PDF 미리보기를 불러오지 못했습니다.</p><button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-3 inline-flex items-center gap-2 rounded-md border border-white/50 px-3 py-2"><RotateCw size={16} />다시 시도</button></div>;

  return (
    <section className="flex h-full min-h-0 w-full flex-col" aria-label={`${title} PDF 미리보기`}>
      <div
        ref={container}
        className="flex min-h-0 flex-1 items-center justify-center overflow-hidden"
        onTouchStart={(event) => { const point = event.touches[0]; touch.current = { x: point.clientX, y: point.clientY }; }}
        onTouchEnd={(event) => {
          const start = touch.current;
          touch.current = null;
          if (!start) return;
          const point = event.changedTouches[0];
          if (Math.abs(point.clientX - start.x) > 60 && Math.abs(point.clientX - start.x) > Math.abs(point.clientY - start.y)) move(point.clientX < start.x ? 1 : -1);
        }}
        onTouchCancel={() => { touch.current = null; }}
      >
        <Document key={`${url}:${attempt}`} file={url} options={options} onLoadSuccess={({ numPages }) => { setCount(numPages); setPage((value) => Math.min(value, numPages)); }} loading={loading} error={error} externalLinkTarget="_blank" externalLinkRel="noopener noreferrer" onItemClick={({ pageNumber }) => { if (pageNumber) setPage(pageNumber); }}>
          <Page pageNumber={page} width={Math.max(1, Math.floor(Math.min(size.width, size.height * ratio)))} onLoadSuccess={(loaded) => { const viewport = loaded.getViewport({ scale: 1 }); setRatio(viewport.width / viewport.height); }} onRenderAnnotationLayerSuccess={labelLinks} renderAnnotationLayer renderTextLayer={false} loading={loading} error={error} className="ppt-pdf-page" />
        </Document>
      </div>
      <nav className="flex h-12 shrink-0 items-center justify-center gap-5 border-t border-white/20 text-sm text-white" aria-label="슬라이드 이동">
        <button type="button" aria-label="이전 슬라이드" title="이전 슬라이드" onClick={() => move(-1)} disabled={page <= 1} className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/10 disabled:opacity-30"><ChevronLeft size={22} /></button>
        <label className="flex items-center gap-2 tabular-nums">슬라이드<select aria-label="슬라이드 선택" value={page} disabled={!count} onChange={(event) => setPage(Number(event.target.value))} className="h-8 w-16 rounded border border-white/30 bg-black px-1 text-white">{Array.from({ length: count || 1 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select><span aria-live="polite">/ {count || "-"}</span></label>
        <button type="button" aria-label="다음 슬라이드" title="다음 슬라이드" onClick={() => move(1)} disabled={!count || page >= count} className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/10 disabled:opacity-30"><ChevronRight size={22} /></button>
      </nav>
    </section>
  );
}
