"use client";

import Image from "next/image";
import Link from "next/link";
import type { SiteSettings } from "@/lib/types";

type BoardSettings = Omit<SiteSettings, "id" | "created_at" | "updated_at">;

type Props = {
  settings: BoardSettings;
  isLoggedIn: boolean;
};

export default function BoardHeader({ settings, isLoggedIn }: Props) {
  const displayTitle = settings.header_title === "파스텔크래프트 수업용 PPT 자료실" ? "파스텔에듀 수업자료실" : settings.header_title;

  return (
    <div className="rounded-lg border-[10px] border-[#8b5e34] bg-[#173f32] p-4 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.08),0_14px_30px_rgba(15,23,42,0.18)] sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-4 text-white">
          {settings.logo_url ? (
            <Image
              src={settings.logo_url}
              alt={`${settings.site_name} 로고`}
              width={64}
              height={64}
              className="h-16 w-16 rounded-md bg-white/95 object-contain p-1"
            />
          ) : null}
          <div className="min-w-0">
            <h1 className="text-3xl font-black leading-tight tracking-normal sm:text-4xl">{displayTitle}</h1>
            {settings.header_description ? (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/85 sm:text-base">{settings.header_description}</p>
            ) : null}
          </div>
        </div>
        <Link
          href={isLoggedIn ? "/admin" : "/login"}
          className="inline-flex w-fit shrink-0 items-center justify-center rounded-md border border-white/20 bg-white px-4 py-2 text-sm font-bold text-[#173f32] shadow-sm"
        >
          {isLoggedIn ? "관리자" : "로그인"}
        </Link>
      </div>
    </div>
  );
}
