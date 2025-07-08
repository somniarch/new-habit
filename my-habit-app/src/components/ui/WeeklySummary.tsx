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
  date: string;
  done: boolean;
  rating: number;
  isHabit?: boolean;
}

interface Props {
  routines: Routine[];
  currentDate: string;
}

export default function WeeklySummary({ routines, currentDate }: Props) {
  const {
    totalCompletion,
    totalSatisfaction,
    routineCompletion,
    routineSatisfaction,
    habitCompletion,
    habitSatisfaction,
  } = useMemo(() => {
    // 오늘을 기준으로 해당 주의 월요일~일요일 범위 계산
    const today = new Date(`${currentDate}T00:00:00+09:00`);
    const dayIdx = (today.getDay() + 6) % 7; // Mon=0…Sun=6
    const start = new Date(today);
    start.setDate(today.getDate() - dayIdx);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const weekData = routines.filter((r) => {
      const d = new Date(`${r.date}T00:00:00+09:00`);
      return d >= start && d <= end;
    });

    const total = weekData.length;
    const totalDone = weekData.filter((r) => r.done).length;
    const totalRate = total ? Math.round((totalDone / total) * 100) : 0;
    const totalSat = totalDone
      ? Math.round(
          weekData.filter((r) => r.done).reduce((sum, r) => sum + r.rating, 0) /
            totalDone
        )
      : 0;

    const routinesOnly = weekData.filter((r) => !r.isHabit);
    const rCnt = routinesOnly.length;
    const rDone = routinesOnly.filter((r) => r.done).length;
    const rRate = rCnt ? Math.round((rDone / rCnt) * 100) : 0;
    const rSat = rDone
      ? Math.round(
          routinesOnly
            .filter((r) => r.done)
            .reduce((sum, r) => sum + r.rating, 0) / rDone
        )
      : 0;

    const habitsOnly = weekData.filter((r) => r.isHabit);
    const hCnt = habitsOnly.length;
    const hDone = habitsOnly.filter((r) => r.done).length;
    const hRate = hCnt ? Math.round((hDone / hCnt) * 100) : 0;
    const hSat = hDone
      ? Math.round(
          habitsOnly
            .filter((r) => r.done)
            .reduce((sum, r) => sum + r.rating, 0) / hDone
        )
      : 0;

    return {
      totalCompletion: totalRate,
      totalSatisfaction: totalSat,
      routineCompletion: rRate,
      routineSatisfaction: rSat,
      habitCompletion: hRate,
      habitSatisfaction: hSat,
    };
  }, [routines, currentDate]);

  const charts = [
    ["전체 달성률", totalCompletion],
    ["루틴 달성률", routineCompletion],
    ["습관 달성률", habitCompletion],
    ["전체 만족도", totalSatisfaction],
    ["루틴 만족도", routineSatisfaction],
    ["습관 만족도", habitSatisfaction],
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-4">
      {charts.map(([label, value]) => (
        <div key={label} className="space-y-1">
          <h4 className="text-center font-medium">{`주간 ${label}`}</h4>
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: "", value }]}>
                <XAxis dataKey="name" hide />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}
