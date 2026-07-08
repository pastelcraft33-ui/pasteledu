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
    <div className="flex items-center justify-between gap-4 rounded-lg bg-white px-4 py-3 shadow-sm sm:px-6 sm:py-4">
      <Image
        src="/pastel-edu-logo.jpeg"
        alt="파스텔에듀 로고"
        width={360}
        height={116}
        priority
        className="h-auto w-[190px] max-w-[65vw] object-contain sm:w-[260px]"
      />
      <Link
        href={isLoggedIn ? "/admin" : "/login"}
        className="inline-flex shrink-0 items-center justify-center rounded-md px-4 py-2 text-sm font-bold text-white shadow-sm"
        style={{ backgroundColor: settings.button_color }}
      >
        {isLoggedIn ? "관리자" : "로그인"}
      </Link>
    </div>
  );
}
