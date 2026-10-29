import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAllowedAdminEmail } from "@/lib/admin";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: "Supabase 연결 설정이 없습니다." }, { status: 503 });
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.getUser(authorization.slice(7));
  if (error || !isAllowedAdminEmail(data.user?.email)) return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.materialId !== "string" || !/^[a-f0-9-]{36}$/i.test(body.materialId)) {
    return NextResponse.json({ error: "올바른 자료를 선택해주세요." }, { status: 400 });
  }
  const endpoint = process.env.PPT_CONVERTER_URL;
  const token = process.env.PPT_CONVERTER_TOKEN;
  if (!endpoint || !token) return NextResponse.json({ error: "PDF 변환기가 연결되지 않았습니다. 서버 환경변수 PPT_CONVERTER_URL과 PPT_CONVERTER_TOKEN을 설정해주세요." }, { status: 503 });
  try {
    const target = new URL("convert", `${endpoint.replace(/\/+$/, "")}/`);
    if (target.protocol !== "https:" && !(process.env.NODE_ENV === "development" && target.hostname === "127.0.0.1")) {
      throw new Error("변환기 주소 설정을 확인해주세요.");
    }
    const response = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "X-Supabase-Authorization": authorization },
      body: JSON.stringify({ materialId: body.materialId, force: body.force === true }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(250000)
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) return NextResponse.json({ error: result?.error || "PDF 변환기가 응답하지 않습니다." }, { status: response.status });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "PDF 변환기에 연결하지 못했거나 처리 시간이 초과되었습니다. 잠시 후 다시 시도해주세요." }, { status: 502 });
  }
}
