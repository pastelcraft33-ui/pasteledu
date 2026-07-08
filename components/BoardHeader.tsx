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
    <div className="flex flex-col gap-1.5 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
      <div className="flex h-[76px] w-full min-w-0 items-start justify-start overflow-hidden sm:h-[96px] lg:h-[132px] lg:w-auto">
        <Image
          src="/pastel-main-logo-original.png"
          alt="파스텔에듀 로고"
          width={800}
          height={500}
          priority
          className="h-auto w-[310px] max-w-full shrink-0 -translate-x-[31px] -translate-y-[55px] object-contain sm:w-[460px] sm:-translate-x-[46px] sm:-translate-y-[84px] lg:w-[640px] lg:-translate-x-[64px] lg:-translate-y-[116px]"
        />
      </div>
      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:items-center sm:justify-end sm:gap-3 lg:w-auto">
        <Link
          href="https://www.pastelclay.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-[#e97599] px-3 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#dc5f86] sm:px-5 sm:text-base"
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
