"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { categoryHref } from "@/lib/library-navigation";

type Subject = { category_id: string; category_name: string };

export default function PopularSubjects() {
  const [items, setItems] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (expanded || items.length < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActiveIndex(index => (index + 1) % items.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [expanded, items.length]);
  useEffect(() => {
    let active = true;
    supabase.rpc("popular_subjects").then(({ data, error }) => {
      if (!active) return;
      setItems(error ? [] : data ?? []);
      setFailed(Boolean(error));
      setLoading(false);
    });
    return () => { active = false; };
  }, []);
  return <div className="relative w-full md:w-64 md:shrink-0">
    <details className="group rounded-lg bg-gray-50" onToggle={event => setExpanded(event.currentTarget.open)}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="shrink-0 text-xs font-semibold text-gray-500">인기 주제</span>
        <span className="min-w-0 flex-1 truncate text-sm font-bold">
          {loading ? "불러오는 중" : failed ? "순위 조회 불가" : items[activeIndex] ? `${activeIndex + 1}위 ${items[activeIndex].category_name}` : "집계 중"}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="absolute right-0 z-40 mt-2 w-full rounded-lg border bg-white p-3 shadow-lg">
        <p className="mb-2 text-xs text-gray-500">최근 15일 · PPT 조회수 기준</p>
        <ol>
          {items.map((item, i) => <li key={item.category_id}>
            <Link href={categoryHref("subject", item.category_id)} className="flex gap-3 rounded px-2 py-2 text-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2">
              <span className="w-5 shrink-0 font-bold text-rose-700">{i + 1}</span>
              <span className="break-words">{item.category_name}</span>
            </Link>
          </li>)}
        </ol>
        {!loading && !items.length && <p className="text-sm">{failed ? "잠시 후 다시 확인해주세요." : "최근 조회 기록이 없습니다."}</p>}
      </div>
    </details>
  </div>;
}
