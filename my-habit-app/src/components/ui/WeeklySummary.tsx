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

// 컴포넌트 밖에 두면 useMemo 의 deps 경고가 사라집니다.
const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"] as const;

interface Routine {
  date: string;       // "YYYY-MM-DD"
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
    const today = new Date(`${currentDate}T00:00:00`);
    const dayIdx = (today.getDay() + 6) % 7;  // Mon=0…Sun=6
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayIdx);

    // 7일치 { date, label } 배열 만들기
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return {
        date: d.toISOString().slice(0, 10),
        label: DAY_LABELS[i],
      };
    });

    // 각 날짜별로 필터링해서 통계 계산
    return dates.map(({ date, label }) => {
      const items = routines.filter((r) => r.date === date);
      const totalCnt = items.length;
      const totalDone = items.filter((r) => r.done).length;
      const totalCompletion = totalCnt
        ? Math.round((totalDone / totalCnt) * 100)
        : 0;
      const totalSatisfaction = totalDone
        ? Math.round(
            items
              .filter((r) => r.done)
              .reduce((sum, r) => sum + r.rating, 0) / totalDone
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
              .reduce((s, r) => s + r.rating, 0) / rDone
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
              .reduce((s, r) => s + r.rating, 0) / hDone
          )
        : 0;

      return {
        name: label,
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
                {/* annotation: formatter의 타입 애너테이션을 제거했습니다 */}
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey={key} fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}
