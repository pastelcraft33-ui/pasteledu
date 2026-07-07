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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-4">
        {settings.logo_url ? (
          <Image
            src={settings.logo_url}
            alt={`${settings.site_name} 로고`}
            width={56}
            height={56}
            className="h-14 w-14 rounded-md object-contain"
          />
        ) : null}
        <div className="min-w-0">
          <p className="text-sm font-semibold opacity-70">{settings.site_name}</p>
          <h1 className="text-2xl font-bold sm:text-3xl">{settings.header_title}</h1>
          {settings.header_description ? (
            <p className="mt-2 max-w-3xl text-sm opacity-75 sm:text-base">{settings.header_description}</p>
          ) : null}
        </div>
      </div>
      <Link
        href={isLoggedIn ? "/admin" : "/login"}
        className="inline-flex w-fit shrink-0 items-center justify-center rounded-md px-4 py-2 text-sm font-bold text-white"
        style={{ backgroundColor: settings.button_color }}
      >
        {isLoggedIn ? "관리자" : "로그인"}
      </Link>
    </div>
  );
}
