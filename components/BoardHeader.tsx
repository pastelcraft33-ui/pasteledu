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
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-5">
        <Image
          src="/pastel-edu-logo.jpeg"
          alt="파스텔에듀 로고"
          width={360}
          height={116}
          priority
          className="h-auto w-[180px] max-w-[46vw] object-contain sm:w-[260px] lg:w-[300px]"
        />
        <span className="translate-y-[-1px] text-4xl font-black leading-none text-gray-900 sm:text-5xl" aria-hidden="true">
          ×
        </span>
        <Image
          src="/pastel-clay-logo.png"
          alt="파스텔클레이 로고"
          width={821}
          height={194}
          priority
          className="h-auto w-[160px] max-w-[42vw] object-contain sm:w-[230px] lg:w-[270px]"
        />
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link
          href="https://www.pastelclay.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-[#f7a8bd] px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#f28ca8] sm:px-5 sm:text-base"
        >
          파스텔클레이
        </Link>
        <Link
          href={isLoggedIn ? "/admin" : "/login"}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-bold text-white shadow-sm sm:px-5 sm:text-base"
          style={{ backgroundColor: settings.button_color }}
        >
          {isLoggedIn ? "관리자" : "로그인"}
        </Link>
      </div>
    </div>
  );
}
