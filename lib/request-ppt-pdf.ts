import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export async function requestPptPdf(materialId: string, force = false): Promise<void> {
  const { data, error } = await createBrowserSupabaseClient().auth.getSession();
  if (error || !data.session) throw new Error("다시 로그인한 뒤 PDF 변환을 실행해주세요.");
  const response = await fetch("/api/ppt-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify({ materialId, force }),
    signal: AbortSignal.timeout(270000)
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || "PDF 변환에 실패했습니다. 관리자 PDF 미리보기 메뉴에서 다시 시도해주세요.");
}
