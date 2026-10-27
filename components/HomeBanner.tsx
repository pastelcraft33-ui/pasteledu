"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { HomeBanner as Banner } from "@/lib/types";

export default function HomeBanner({ banners }: { banners: Banner[] }) {
  const slides = banners.filter((banner) => banner.enabled);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const currentIndex = index % Math.max(1, slides.length);
  const current = slides[currentIndex];
  const nextImageUrl = slides[(currentIndex + 1) % Math.max(1, slides.length)]?.image_url;

  useEffect(() => {
    if (slides.length < 2 || !nextImageUrl) return;
    const image = new window.Image();
    image.src = nextImageUrl;
  }, [nextImageUrl, slides.length]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (slides.length < 2 || paused || hovered || focused || reducedMotion) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [slides.length, paused, hovered, focused, reducedMotion]);

  if (!current) return null;
  const move = (offset: number) => setIndex((currentIndex + offset + slides.length) % slides.length);

  return (
    <section aria-label="메인 배너" aria-roledescription="슬라이드" className="w-full px-4 pt-5 sm:px-8 sm:pt-6">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4">
      <div
        className="relative overflow-hidden rounded-2xl bg-gray-50"
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
        onTouchStart={(event) => { touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
        onTouchEnd={(event) => {
          if (touchStart.current === null) return;
          const delta = event.changedTouches[0].clientX - touchStart.current.x;
          const vertical = event.changedTouches[0].clientY - touchStart.current.y;
          if (Math.abs(delta) > 50 && Math.abs(delta) > Math.abs(vertical)) move(delta < 0 ? 1 : -1);
          touchStart.current = null;
        }}
        onTouchCancel={() => { touchStart.current = null; }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1);
          }
        }}
      >
        <div className="relative aspect-[30/11] w-full" aria-live={paused || focused ? "polite" : "off"}>
          <div className="absolute inset-0 flex transition-transform duration-500 ease-in-out motion-reduce:transition-none" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
          {slides.map((banner, slideIndex) => (
            <div key={banner.id} aria-hidden={slideIndex !== currentIndex} className="relative h-full w-full shrink-0" role="group" aria-roledescription="슬라이드" aria-label={(slideIndex + 1) + " / " + slides.length}>
              {banner.link_url ? (
                <a href={banner.link_url} tabIndex={slideIndex === currentIndex ? 0 : -1} className="block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={banner.image_url} alt={banner.alt || "메인 배너 " + (slideIndex + 1)} width={1200} height={440} loading={slideIndex === 0 ? "eager" : "lazy"} fetchPriority={slideIndex === 0 ? "high" : "auto"} className="h-full w-full object-contain" />
                </a>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={banner.image_url} alt={banner.alt || "메인 배너 " + (slideIndex + 1)} width={1200} height={440} loading={slideIndex === 0 ? "eager" : "lazy"} fetchPriority={slideIndex === 0 ? "high" : "auto"} className="h-full w-full object-contain" />
              )}
            </div>
          ))}
          </div>
        </div>
        {slides.length > 1 ? <>
          <button type="button" onClick={() => move(-1)} aria-label="이전 배너" title="이전 배너" className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-gray-800 shadow-sm sm:left-5 sm:h-11 sm:w-11"><ChevronLeft className="h-5 w-5 sm:h-7 sm:w-7" /></button>
          <button type="button" onClick={() => move(1)} aria-label="다음 배너" title="다음 배너" className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-gray-800 shadow-sm sm:right-5 sm:h-11 sm:w-11"><ChevronRight className="h-5 w-5 sm:h-7 sm:w-7" /></button>
        </> : null}
      </div>
      {slides.length > 1 ? (
        <div className="mt-3 flex min-h-8 flex-wrap items-center justify-center gap-1.5">
          {slides.map((banner, slideIndex) => <button key={banner.id} type="button" onClick={() => setIndex(slideIndex)} aria-label={(slideIndex + 1) + "번 배너 보기"} aria-current={slideIndex === currentIndex ? "true" : undefined} className="flex h-8 w-8 items-center justify-center"><span className={"h-2.5 w-2.5 rounded-full " + (slideIndex === currentIndex ? "bg-gray-800" : "bg-gray-300")} /></button>)}
          <button type="button" onClick={() => setPaused(!paused)} aria-label={paused ? "배너 자동 재생" : "배너 자동 재생 일시정지"} title={paused ? "자동 재생" : "일시정지"} className="ml-2 flex h-8 w-8 items-center justify-center rounded-full border text-gray-600">{paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}</button>
        </div>
      ) : null}
      </div>
    </section>
  );
}
