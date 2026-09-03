"use client";

import { pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export async function createWorksheetPdfPreview(source: File | string) {
  const loadingTask = source instanceof File
    ? pdfjs.getDocument({ data: new Uint8Array(await source.arrayBuffer()) })
    : pdfjs.getDocument({ url: source, disableAutoFetch: true, disableStream: true, rangeChunkSize: 65536 });
  const document = await loadingTask.promise;

  try {
    const page = await document.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(1.5, 640 / baseViewport.width) });
    const canvas = window.document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("미리보기 캔버스를 만들지 못했습니다.");

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: context, viewport }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => result ? resolve(result) : reject(new Error("미리보기 이미지 변환에 실패했습니다.")),
        "image/webp",
        0.76
      );
    });

    return { blob, pageCount: document.numPages };
  } finally {
    await document.destroy();
  }
}
