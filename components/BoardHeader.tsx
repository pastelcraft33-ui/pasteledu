"use client";

import Image from "next/image";
import Link from "next/link";

export default function BoardHeader() {
  return (
    <div className="flex items-center">
      <Link
        href="/login"
        className="inline-flex min-w-0 items-center focus-visible:rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gray-900"
        aria-label="관리자 로그인"
      >
        <Image
          src="/pastel-edu-color-logo.png"
          alt="파스텔에듀"
          width={1632}
          height={403}
          priority
          className="h-auto w-[270px] max-w-full object-contain sm:w-[360px] lg:w-[430px]"
        />
      </Link>
    </div>
  );
}
