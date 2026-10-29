"use client";

import { FileCheck2, LoaderCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { getPptPdfUrl } from "@/lib/ppt-pdf";
import { requestPptPdf } from "@/lib/request-ppt-pdf";
import type { PptMaterialWithCategory } from "@/lib/types";

export default function AdminPdfPreviews({ materials, onChanged }: { materials: PptMaterialWithCategory[]; onChanged: () => Promise<void> }) {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<Record<string, string>>({});
  const files = materials.filter((item) => item.file_url);
  async function convert(items: PptMaterialWithCategory[], force = false) {
    setRunning(true);
    let success = 0;
    let failed = 0;
    for (let i = 0; i < items.length; i++) {
      const material = items[i];
      setMessage(`${i + 1} / ${items.length} 변환 중: ${material.title}`);
      setResults((current) => ({ ...current, [material.id]: "변환 중" }));
      try {
        await requestPptPdf(material.id, force);
        success++;
        setResults((current) => ({ ...current, [material.id]: "완료" }));
      } catch (error) {
        failed++;
        const text = error instanceof Error ? error.message : "변환 실패";
        setResults((current) => ({ ...current, [material.id]: text }));
        if (text.includes("변환기가 연결되지") || text.includes("로그인") || text.includes("SQL")) break;
      }
    }
    setMessage(`처리 완료: 성공 ${success}개, 실패 ${failed}개. 처리하지 못한 자료는 다시 실행할 수 있습니다.`);
    setRunning(false);
    await onChanged();
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">PDF 미리보기 관리</h2>
        <button type="button" disabled={running} onClick={() => convert(files.filter((item) => !getPptPdfUrl(item)))} className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{running ? <LoaderCircle size={18} className="animate-spin" /> : <FileCheck2 size={18} />}미생성 자료 일괄 변환</button>
      </div>
      {message ? <p className="rounded-md bg-blue-50 p-3 text-sm text-blue-900" role="status">{message}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead><tr className="border-b"><th className="py-3">자료명</th><th>PDF 상태</th><th>처리</th></tr></thead>
          <tbody>{files.map((material) => <tr key={material.id} className="border-b"><td className="max-w-xs py-3 pr-3">{material.title}</td><td className="max-w-sm break-words py-3 pr-3">{results[material.id] || (getPptPdfUrl(material) ? "준비 완료" : "변환 필요")}</td><td><button type="button" disabled={running} onClick={() => convert([material], true)} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 disabled:opacity-50"><RefreshCw size={16} />{getPptPdfUrl(material) ? "다시 생성" : "생성"}</button></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
