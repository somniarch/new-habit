// components/WeeklySummary.tsx
"use client";
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const BarChart = dynamic(
  () => import("recharts").then((m) => m.BarChart),
  { ssr: false }
);
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });

// x축 레이블: 월~일
const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"] as const;

interface Routine {
  date: string;    // "YYYY-MM-DD" 형식, 스케줄된 날짜
  done: boolean;
  rating: number;
  isHabit?: boolean;
}

interface Props {
  routines: Routine[];
  currentDate: string; // "YYYY-MM-DD"
}

export default function WeeklySummary({ routines, currentDate }: Props) {
  const weeklyData = useMemo(() => {
    // 1) currentDate를 로컬 기준 자정으로 파싱
    const [yy, mm, dd] = currentDate.split("-").map(Number);
    const today = new Date(yy, mm - 1, dd);
    
    // 2) 이번 주 월요일로 이동
    const jsDay = today.getDay();            // 0=일…6=토
    const monOffset = (jsDay + 6) % 7;        // 월=0…일=6
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - monOffset);

    // 3) 7일치(월→일) 배열 생성
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);

      // ISO 문자열과, x축에 표시할 레이블
      const Y = d.getFullYear();
      const M = String(d.getMonth() + 1).padStart(2, "0");
      const D = String(d.getDate()).padStart(2, "0");
      const isoDate = `${Y}-${M}-${D}`;       // "2025-07-07"
      const label = DAY_LABELS[i];            // "월","화",…

      // 이 날짜에 **설정된** 루틴/습관만 필터링
      const items = routines.filter((r) => r.date === isoDate);
      const total = items.length;
      const doneCount = items.filter((r) => r.done).length;
      const totalCompletion = total
        ? Math.round((doneCount / total) * 100)
        : 0;
      const totalSatisfaction = doneCount
        ? Math.round(
            items
              .filter((r) => r.done)
              .reduce((sum, r) => sum + r.rating, 0) /
              doneCount
          )
        : 0;

      const routinesOnly = items.filter((r) => !r.isHabit);
      const rCnt = routinesOnly.length;
      const rDone = routinesOnly.filter((r) => r.done).length;
      const routineCompletion = rCnt
        ? Math.round((rDone / rCnt) * 100)
        : 0;
      const routineSatisfaction = rDone
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
      const habitCompletion = hCnt
        ? Math.round((hDone / hCnt) * 100)
        : 0;
      const habitSatisfaction = hDone
        ? Math.round(
            habitsOnly
              .filter((r) => r.done)
              .reduce((s, r) => s + r.rating, 0) /
              hDone
          )
        : 0;

      return {
        name: label,                 // x축: "월" 등
        totalCompletion,
        totalSatisfaction,
        routineCompletion,
        routineSatisfaction,
        habitCompletion,
        habitSatisfaction,
      };
    });
  }, [routines, currentDate]);

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
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey={key} fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}
