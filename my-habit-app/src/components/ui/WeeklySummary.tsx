// components/WeeklySummary.tsx
"use client";
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const BarChart = dynamic(
  () => import("recharts").then((mod) => mod.BarChart),
  { ssr: false }
);
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });

interface Routine {
  date: string;       // "2025-07-08" 형식
  done: boolean;
  rating: number;
  isHabit?: boolean;
}

interface Props {
  routines: Routine[];
  currentDate: string; // "2025-07-08" 형식
}

export default function WeeklySummary({ routines, currentDate }: Props) {
  // 요일 한글 레이블
  const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

  // 주간별(월~일) 통계 데이터 계산
  const weeklyData = useMemo(() => {
    const today = new Date(`${currentDate}T00:00:00`);
    // JS: 일요일(0)~토요일(6) → 월(1)~일(0) 매핑
    const dayIdx = (today.getDay() + 6) % 7; 
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayIdx);
    
    // 7일치 날짜 배열 생성
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const iso = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
      return { date: iso, label: DAY_LABELS[i] };
    });

    // 날짜별로 루틴 필터링해 모으기
    const grouped = dates.map(({ date, label }) => {
      const items = routines.filter((r) => r.date === date);
      const totalCnt = items.length;
      const totalDone = items.filter((r) => r.done).length;
      const totalRate = totalCnt ? Math.round((totalDone / totalCnt) * 100) : 0;
      const totalSat =
        totalDone > 0
          ? Math.round(
              items.filter((r) => r.done).reduce((s, r) => s + r.rating, 0) /
                totalDone
            )
          : 0;

      const routinesOnly = items.filter((r) => !r.isHabit);
      const rCnt = routinesOnly.length;
      const rDone = routinesOnly.filter((r) => r.done).length;
      const rRate = rCnt ? Math.round((rDone / rCnt) * 100) : 0;
      const rSat =
        rDone > 0
          ? Math.round(
              routinesOnly
                .filter((r) => r.done)
                .reduce((s, r) => s + r.rating, 0) /
                rDone
            )
          : 0;

      const habitsOnly = items.filter((r) => r.isHabit);
      const hCnt = habitsOnly.length;
      const hDone = habitsOnly.filter((r) => r.done).length;
      const hRate = hCnt ? Math.round((hDone / hCnt) * 100) : 0;
      const hSat =
        hDone > 0
          ? Math.round(
              habitsOnly
                .filter((r) => r.done)
                .reduce((s, r) => s + r.rating, 0) /
                hDone
            )
          : 0;

      return {
        name: label,
        totalCompletion: totalRate,
        totalSatisfaction: totalSat,
        routineCompletion: rRate,
        routineSatisfaction: rSat,
        habitCompletion: hRate,
        habitSatisfaction: hSat,
      };
    });

    return grouped;
  }, [routines, currentDate]);

  // 렌더링할 차트 정의: [표시라벨, 데이터 키]
  const charts = [
    ["전체 달성률", "totalCompletion"],
    ["루틴 달성률", "routineCompletion"],
    ["습관 달성률", "habitCompletion"],
    ["전체 만족도", "totalSatisfaction"],
    ["루틴 만족도", "routineSatisfaction"],
    ["습관 만족도", "habitSatisfaction"],
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-4">
      {charts.map(([label, key]) => (
        <div key={key} className="space-y-1">
          <h4 className="text-center font-medium">{`주간 ${label}`}</h4>
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="name" />          {/* 월~일 레이블 */}
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey={key} fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}
