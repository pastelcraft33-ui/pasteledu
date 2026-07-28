"use client";

import { useState } from "react";
import { downloadPublicFile } from "@/lib/download-utils";

type Props = {
  url: string | null | undefined;
  fileName: string;
  label: string;
  setMessage: (message: string) => void;
  className?: string;
};

export default function AdminDownloadButton({ url, fileName, label, setMessage, className = "" }: Props) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    if (!url || isDownloading) return;

    setIsDownloading(true);
    try {
      await downloadPublicFile(url, fileName);
      setMessage("파일 다운로드를 시작했습니다.");
    } catch (error) {
      console.error("Admin file download failed", error);
      setMessage("파일을 다운로드하지 못했습니다. Storage 파일과 권한을 확인해주세요.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={!url || isDownloading}
      className={`rounded-md border px-3 py-1 font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {isDownloading ? "받는 중..." : label}
    </button>
  );
}
