"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { PptMaterialEvent, PptMaterialWithCategory } from "@/lib/types";

type Props = {
  materials: PptMaterialWithCategory[];
  setMessage: (message: string) => void;
};

type MaterialStats = {
  material: PptMaterialWithCategory;
  clickCount: number;
  totalDurationSeconds: number;
  averageDurationSeconds: number;
  lastClickedAt: string | null;
};

export default function AdminAnalytics({ materials, setMessage }: Props) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [events, setEvents] = useState<PptMaterialEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadEvents() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("ppt_material_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000);

      if (!isMounted) return;

      if (error) {
        console.error("Analytics load failed", error);
        setMessage("방문 통계를 불러오지 못했습니다. Supabase SQL이 최신인지 확인해주세요.");
        setIsLoading(false);
        return;
      }

      setEvents((data ?? []) as PptMaterialEvent[]);
      setIsLoading(false);
    }

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, [setMessage, supabase]);

  const stats = useMemo(() => buildStats(materials, events), [events, materials]);
  const totalClicks = stats.reduce((sum, item) => sum + item.clickCount, 0);
  const totalDurationSeconds = stats.reduce((sum, item) => sum + item.totalDurationSeconds, 0);
  const clickedMaterialCount = stats.filter((item) => item.clickCount > 0).length;
  const averageDurationSeconds = totalClicks > 0 ? Math.round(totalDurationSeconds / totalClicks) : 0;

  return (
    <div className="space-y-5">
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">방문 통계</h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              메인 자료실에서 PPT 자료를 클릭한 횟수와 미리보기 모달 체류시간을 확인합니다.
            </p>
          </div>
          <button type="button" onClick={() => window.location.reload()} className="rounded-md border px-3 py-2 text-sm font-semibold">
            새로고침
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="전체 클릭" value={`${totalClicks}회`} />
        <SummaryCard label="클릭된 자료" value={`${clickedMaterialCount}개`} />
        <SummaryCard label="총 체류시간" value={formatDuration(totalDurationSeconds)} />
        <SummaryCard label="평균 체류시간" value={formatDuration(averageDurationSeconds)} />
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold">자료별 통계</h3>
        {isLoading ? <p className="mt-4 text-sm text-gray-500">통계를 불러오는 중...</p> : null}
        {!isLoading && stats.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed p-6 text-center text-sm text-gray-500">
            등록된 PPT 자료가 없습니다.
          </p>
        ) : null}
        {!isLoading && stats.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b text-gray-600">
                  <th className="py-2">자료명</th>
                  <th>파일명</th>
                  <th>클릭횟수</th>
                  <th>총 체류시간</th>
                  <th>평균 체류시간</th>
                  <th>최근 클릭</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((item) => (
                  <tr key={item.material.id} className="border-b align-top">
                    <td className="max-w-[260px] py-3 font-semibold">{item.material.title}</td>
                    <td className="max-w-[240px] truncate">{item.material.file_name || "-"}</td>
                    <td>{item.clickCount}회</td>
                    <td>{formatDuration(item.totalDurationSeconds)}</td>
                    <td>{formatDuration(item.averageDurationSeconds)}</td>
                    <td>{item.lastClickedAt ? formatDateTime(item.lastClickedAt) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function buildStats(materials: PptMaterialWithCategory[], events: PptMaterialEvent[]) {
  const grouped = new Map<string, PptMaterialEvent[]>();
  events.forEach((event) => {
    if (!event.material_id) return;
    const current = grouped.get(event.material_id) ?? [];
    current.push(event);
    grouped.set(event.material_id, current);
  });

  return materials
    .map((material) => {
      const materialEvents = grouped.get(material.id) ?? [];
      const clickEvents = materialEvents.filter((event) => event.event_type === "click");
      const durationEvents = materialEvents.filter((event) => event.event_type === "duration");
      const totalDurationSeconds = durationEvents.reduce((sum, event) => sum + (event.duration_seconds ?? 0), 0);
      const averageDurationSeconds = clickEvents.length > 0 ? Math.round(totalDurationSeconds / clickEvents.length) : 0;
      const lastClickedAt = clickEvents[0]?.created_at ?? null;

      return {
        material,
        clickCount: clickEvents.length,
        totalDurationSeconds,
        averageDurationSeconds,
        lastClickedAt
      } satisfies MaterialStats;
    })
    .sort((a, b) => b.clickCount - a.clickCount || b.totalDurationSeconds - a.totalDurationSeconds || a.material.title.localeCompare(b.material.title));
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-950">{value}</p>
    </div>
  );
}

function formatDuration(seconds: number) {
  if (!seconds) return "0초";
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;

  if (minutes === 0) return `${restSeconds}초`;
  if (restSeconds === 0) return `${minutes}분`;
  return `${minutes}분 ${restSeconds}초`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
