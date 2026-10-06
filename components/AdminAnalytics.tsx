"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { PptMaterialEvent, PptMaterialWithCategory } from "@/lib/types";

type Props = {
  materials: PptMaterialWithCategory[];
  setMessage: (message: string) => void;
};

type MaterialStats = {
  material: PptMaterialWithCategory;
  clickCount: number;
  downloadCount: number;
  totalDurationSeconds: number;
  averageDurationSeconds: number;
};

type PeriodFilter = "all" | "7days" | "30days" | "thisMonth" | "custom";

const chartColors = ["#f28ca8", "#82b6e8", "#79c7b2", "#efc767", "#aa98d6"];
const chartWidth = 720;
const chartHeight = 300;
const chartLeft = 56;
const chartRight = 700;
const chartTop = 24;
const chartBottom = 222;

export default function AdminAnalytics({ materials, setMessage }: Props) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [events, setEvents] = useState<PptMaterialEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    const pageSize = 1000;
    const allEvents: PptMaterialEvent[] = [];
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from("ppt_material_events")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error("Analytics load failed", error);
        setMessage("방문 통계를 불러오지 못했습니다. Supabase SQL이 최신인지 확인해주세요.");
        setIsLoading(false);
        return;
      }

      const page = (data ?? []) as PptMaterialEvent[];
      allEvents.push(...page);
      if (page.length < pageSize) break;
      from += pageSize;
    }

    setEvents(allEvents);
    setIsLoading(false);
  }, [setMessage, supabase]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const periodRange = useMemo(
    () => getPeriodRange(period, customFrom, customTo),
    [customFrom, customTo, period]
  );
  const filteredEvents = useMemo(() => {
    if (!periodRange) return events;
    if (!periodRange.valid) return [];

    return events.filter((event) => {
      const timestamp = new Date(event.created_at).getTime();
      return (!periodRange.from || timestamp >= periodRange.from) && (!periodRange.to || timestamp < periodRange.to);
    });
  }, [events, periodRange]);
  const stats = useMemo(() => buildStats(materials, filteredEvents), [filteredEvents, materials]);
  const topClickedMaterials = stats.filter((item) => item.clickCount > 0).slice(0, 5);
  const topClickCount = topClickedMaterials[0]?.clickCount ?? 0;
  const totalClicks = stats.reduce((sum, item) => sum + item.clickCount, 0);
  const totalDownloads = stats.reduce((sum, item) => sum + item.downloadCount, 0);
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
              메인 자료실에서 PPT 자료를 클릭하고 다운로드한 횟수와 미리보기 모달 체류시간을 확인합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={loadEvents}
            disabled={isLoading}
            className="rounded-md border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "불러오는 중..." : "통계 새로고침"}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3 border-t pt-4">
          <label className="flex min-w-44 flex-col gap-1 text-sm font-semibold text-gray-700">
            조회 기간
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value as PeriodFilter)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 font-normal text-gray-900"
            >
              <option value="all">전체 기간</option>
              <option value="7days">최근 7일</option>
              <option value="30days">최근 30일</option>
              <option value="thisMonth">이번 달</option>
              <option value="custom">직접 선택</option>
            </select>
          </label>
          {period === "custom" ? (
            <>
              <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                시작일
                <input
                  type="date"
                  value={customFrom}
                  onChange={(event) => setCustomFrom(event.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 font-normal text-gray-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                종료일
                <input
                  type="date"
                  value={customTo}
                  onChange={(event) => setCustomTo(event.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 font-normal text-gray-900"
                />
              </label>
            </>
          ) : null}
          {periodRange && !periodRange.valid ? (
            <p role="alert" className="pb-2 text-sm font-medium text-red-600">
              시작일은 종료일보다 늦을 수 없습니다.
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold">클릭 TOP 5</h3>
            <p className="mt-1 text-sm text-gray-500">선택한 기간의 자료별 클릭 횟수</p>
          </div>
          <span className="text-sm text-gray-500">{getPeriodLabel(period, customFrom, customTo)}</span>
        </div>
        {isLoading ? <p className="mt-4 text-sm text-gray-500">통계를 불러오는 중...</p> : null}
        {!isLoading && topClickedMaterials.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed p-6 text-center text-sm text-gray-500">
            선택한 기간에 클릭 기록이 없습니다.
          </p>
        ) : null}
        {!isLoading && topClickedMaterials.length > 0 ? (
          <div className="mt-5">
            <ClickLineChart items={topClickedMaterials} maxValue={topClickCount} />
            <ol className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {topClickedMaterials.map((item, index) => (
                <li key={item.material.id} className="flex min-w-0 items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: chartColors[index] }} />
                  <span className="shrink-0 font-bold text-gray-500">{index + 1}위</span>
                  <span className="truncate font-medium text-gray-800" title={item.material.title}>
                    {item.material.title}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard label="전체 클릭" value={`${totalClicks}회`} />
        <SummaryCard label="전체 다운로드" value={`${totalDownloads}회`} />
        <SummaryCard label="클릭된 자료" value={`${clickedMaterialCount}개`} />
        <SummaryCard label="총 체류시간" value={formatDuration(totalDurationSeconds)} />
        <SummaryCard label="평균 체류시간" value={formatDuration(averageDurationSeconds)} />
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold">자료별 통계</h3>
        {isLoading ? <p className="mt-4 text-sm text-gray-500">통계를 불러오는 중...</p> : null}
        {!isLoading && stats.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed p-6 text-center text-sm text-gray-500">
            해당 기간에 통계가 있는 PPT 자료가 없습니다.
          </p>
        ) : null}
        {!isLoading && stats.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="border-b text-gray-600">
                  <th className="py-2">자료명</th>
                  <th>파일명</th>
                  <th>클릭횟수</th>
                  <th>다운로드횟수</th>
                  <th>총 체류시간</th>
                  <th>평균 체류시간</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((item) => (
                  <tr key={item.material.id} className="border-b align-top">
                    <td className="max-w-[260px] py-3 font-semibold">{item.material.title}</td>
                    <td className="max-w-[240px] truncate">{item.material.file_name || "-"}</td>
                    <td>{item.clickCount}회</td>
                    <td>{item.downloadCount}회</td>
                    <td>{formatDuration(item.totalDurationSeconds)}</td>
                    <td>{formatDuration(item.averageDurationSeconds)}</td>
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
      const downloadEvents = materialEvents.filter((event) => event.event_type === "download");
      const durationEvents = materialEvents.filter((event) => event.event_type === "duration");
      const totalDurationSeconds = durationEvents.reduce((sum, event) => sum + (event.duration_seconds ?? 0), 0);
      const averageDurationSeconds = clickEvents.length > 0 ? Math.round(totalDurationSeconds / clickEvents.length) : 0;

      return {
        material,
        clickCount: clickEvents.length,
        downloadCount: downloadEvents.length,
        totalDurationSeconds,
        averageDurationSeconds
      } satisfies MaterialStats;
    })
    .sort(
      (a, b) =>
        b.clickCount - a.clickCount ||
        b.downloadCount - a.downloadCount ||
        b.totalDurationSeconds - a.totalDurationSeconds ||
        a.material.title.localeCompare(b.material.title)
    );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-950">{value}</p>
    </div>
  );
}

function ClickLineChart({ items, maxValue }: { items: MaterialStats[]; maxValue: number }) {
  const plotWidth = chartRight - chartLeft;
  const plotHeight = chartBottom - chartTop;
  const points = items.map((item, index) => {
    const x = items.length === 1 ? chartLeft + plotWidth / 2 : chartLeft + (plotWidth * index) / (items.length - 1);
    const y = chartBottom - (item.clickCount / maxValue) * plotHeight;
    return { item, index, x, y };
  });
  const linePoints = points.map(({ x, y }) => `${x},${y}`).join(" ");
  const tickValues = Array.from({ length: 5 }, (_, index) => Math.round((maxValue * (4 - index)) / 4));

  return (
    <div className="w-full overflow-hidden" role="img" aria-label="클릭 횟수 상위 자료 5개의 선 그래프">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-auto w-full" preserveAspectRatio="xMinYMin meet">
        {tickValues.map((value, index) => {
          const y = chartTop + (plotHeight * index) / 4;
          return (
            <g key={`${value}-${index}`}>
              <line x1={chartLeft} x2={chartRight} y1={y} y2={y} stroke="#e5e7eb" strokeDasharray="4 5" />
              <text x={chartLeft - 10} y={y + 4} textAnchor="end" fill="#6b7280" fontSize="12">
                {value}
              </text>
            </g>
          );
        })}
        <line x1={chartLeft} x2={chartLeft} y1={chartTop} y2={chartBottom} stroke="#d1d5db" />
        <line x1={chartLeft} x2={chartRight} y1={chartBottom} y2={chartBottom} stroke="#d1d5db" />
        {points.length > 1 ? (
          <polyline points={linePoints} fill="none" stroke="#6d7fbd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
        {points.map(({ item, index, x, y }) => (
          <g key={item.material.id}>
            <circle cx={x} cy={y} r="7" fill={chartColors[index]} stroke="white" strokeWidth="2" />
            <text x={x} y={y - 13} textAnchor="middle" fill="#374151" fontSize="12" fontWeight="700">
              {item.clickCount}회
            </text>
            <text x={x} y={chartBottom + 25} textAnchor="middle" fill="#6b7280" fontSize="12">
              {index + 1}위
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function getPeriodRange(period: PeriodFilter, customFrom: string, customTo: string) {
  if (period === "all") return null;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let fromDate: Date | null = null;
  let toDate: Date | null = null;

  if (period === "7days") {
    fromDate = new Date(startOfToday);
    fromDate.setDate(fromDate.getDate() - 6);
    toDate = new Date(startOfToday);
    toDate.setDate(toDate.getDate() + 1);
  } else if (period === "30days") {
    fromDate = new Date(startOfToday);
    fromDate.setDate(fromDate.getDate() - 29);
    toDate = new Date(startOfToday);
    toDate.setDate(toDate.getDate() + 1);
  } else if (period === "thisMonth") {
    fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    toDate = new Date(startOfToday);
    toDate.setDate(toDate.getDate() + 1);
  } else {
    fromDate = customFrom ? new Date(`${customFrom}T00:00:00`) : null;
    toDate = customTo ? new Date(`${customTo}T00:00:00`) : null;
    if (toDate) toDate.setDate(toDate.getDate() + 1);
  }

  const from = fromDate?.getTime() ?? null;
  const to = toDate?.getTime() ?? null;

  return {
    from,
    to,
    valid: from === null || to === null || from < to
  };
}

function getPeriodLabel(period: PeriodFilter, customFrom: string, customTo: string) {
  if (period === "all") return "전체 기간";
  if (period === "7days") return "최근 7일";
  if (period === "30days") return "최근 30일";
  if (period === "thisMonth") return "이번 달";
  return `${customFrom || "시작일 미선택"} ~ ${customTo || "종료일 미선택"}`;
}

function formatDuration(seconds: number) {
  if (!seconds) return "0초";
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;

  if (minutes === 0) return `${restSeconds}초`;
  if (restSeconds === 0) return `${minutes}분`;
  return `${minutes}분 ${restSeconds}초`;
}
