import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getSupabaseEnv(): { supabaseUrl: string; supabaseAnonKey: string } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const missingKeys: string[] = [];

  if (!supabaseUrl) missingKeys.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseAnonKey) missingKeys.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (missingKeys.length > 0) {
    throw new Error(`Supabase 환경변수가 설정되지 않았습니다. .env.local 또는 Vercel Environment Variables를 확인해주세요. 누락: ${missingKeys.join(", ")}`);
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다. .env.local을 확인해주세요.");
  }

  return { supabaseUrl, supabaseAnonKey };
}

const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

const globalForSupabase = globalThis as typeof globalThis & {
  __pastelSupabaseClient?: SupabaseClient;
};

export const supabase =
  globalForSupabase.__pastelSupabaseClient ?? createClient(supabaseUrl, supabaseAnonKey);

globalForSupabase.__pastelSupabaseClient = supabase;

export function createBrowserSupabaseClient() {
  // 모든 클라이언트 컴포넌트가 동일한 Auth 저장소를 사용하는 하나의
  // Supabase 인스턴스를 공유해야 세션 확인 충돌과 중복 이벤트가 생기지 않는다.
  return supabase;
}
