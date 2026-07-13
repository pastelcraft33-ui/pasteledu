"use client";

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
      <div
        className="min-w-0 text-3xl font-black leading-none sm:text-4xl lg:text-5xl"
        style={{ color: settings.text_color, fontFamily: settings.font_family }}
        aria-label="PASTEL - EDU"
      >
        PASTEL - EDU
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
