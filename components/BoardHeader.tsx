"use client";

import Image from "next/image";

export default function BoardHeader() {
  return (
    <div className="flex items-center">
      <Image
        src="/pastel-edu-color-logo.png"
        alt="파스텔에듀"
        width={1632}
        height={403}
        priority
        className="h-auto w-[190px] max-w-full object-contain sm:w-[250px] lg:w-[300px]"
      />
    </div>
  );
}
