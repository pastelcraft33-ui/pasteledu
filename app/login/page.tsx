"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ADMIN_AUTH_EMAIL, ADMIN_LOGIN_ID, isAllowedAdminEmail } from "@/lib/admin";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && isAllowedAdminEmail(data.session.user.email)) {
        router.replace("/admin");
      }
    });
  }, [router, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    if (loginId.trim().toLowerCase() !== ADMIN_LOGIN_ID) {
      setMessage("허용된 관리자 이메일이 아닙니다.");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: ADMIN_AUTH_EMAIL, password });
    setIsLoading(false);

    if (error) {
      setMessage(getLoginErrorMessage(error.message));
      return;
    }

    router.replace("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">관리자 로그인</h1>
        <p className="mt-2 text-sm text-gray-600">관리자 이메일과 비밀번호로 로그인하세요.</p>
        <p className="mt-2 rounded-md bg-gray-50 p-3 text-xs leading-5 text-gray-600">
          관리자 이메일은 <span className="font-semibold">pastelcraft3@naver.com</span>만 사용할 수 있습니다.
          Supabase Authentication에도 같은 이메일 계정이 생성되어 있어야 합니다.
        </p>
        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold">이메일</span>
            <input
              type="email"
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              required
              autoComplete="username"
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </label>
        </div>
        {message ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{message}</p> : null}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 w-full rounded-md bg-gray-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {isLoading ? "로그인 중..." : "로그인"}
        </button>
        <Link href="/" className="mt-4 block text-center text-sm font-semibold text-gray-700 underline underline-offset-4">
          자료실로 돌아가기
        </Link>
      </form>
    </main>
  );
}

function getLoginErrorMessage(errorMessage: string) {
  const normalized = errorMessage.toLowerCase();

  if (normalized.includes("email not confirmed")) {
    return "관리자 계정의 이메일 인증이 완료되지 않았습니다. Supabase Authentication에서 해당 사용자를 Confirm 처리해주세요.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "로그인에 실패했습니다. Supabase Authentication에 pastelcraft3@naver.com 계정이 있는지, 비밀번호가 맞는지 확인해주세요.";
  }

  return "로그인 중 오류가 발생했습니다. Supabase 관리자 계정 설정을 확인해주세요.";
}
