import { createClient } from "@supabase/supabase-js";

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

export function createServerSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false
    },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: "no-store"
        })
    }
  });
}
