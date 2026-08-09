"use client";

import Image from "next/image";

type Props = {
  onHome: () => void;
};

export default function BoardHeader({ onHome }: Props) {
  return (
    <button
      type="button"
      onClick={onHome}
      className="flex shrink-0 items-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
      aria-label="메인 화면으로 이동"
    >
      <Image
        src="/pastel-edu-color-logo.png"
        alt="파스텔에듀"
        width={1632}
        height={403}
        priority
        className="h-auto w-[190px] max-w-full object-contain sm:w-[250px] lg:w-[300px]"
      />
    </button>
  );
}
