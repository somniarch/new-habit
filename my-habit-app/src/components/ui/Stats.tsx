// components/Stats.tsx
"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Routine = {
  day: string;
  done: boolean;
  rating: number;
};

type StatsProps = {
  routines: Routine[];
  onDownloadCsv: () => void;
  selectedDay: string;
};

export interface Routine {
  date: string;
  day: string;
  start: string;
  end: string;
  task: string;
  done: boolean;
  rating: number;
  isHabit?: boolean;
}

interface StatsProps {
  routines: Routine[];
  selectedDay: string;
  onDownloadCsv: () => void;
}

export function Stats({ routines, selectedDay, onDownloadCsv }: StatsProps) {
  // 주간 통계 (선택된 요일)
  const weekData = useMemo(() => {
    const fullDays = ["월", "화", "수", "목", "금", "토", "일"];
    const done = routines.filter((r) => r.day === selectedDay && r.done).length;
    const total = routines.filter((r) => r.day === selectedDay).length;
    return [
      {
        name: selectedDay,
        Completion: total ? Math.round((done / total) * 100) : 0,
        Satisfaction: done
          ? Math.round(
              routines
                .filter((r) => r.day === selectedDay && r.done)
                .reduce((acc, cur) => acc + cur.rating, 0) / done
            )
          : 0,
      },
    ];
  }, [routines, selectedDay]);

  // 월간 통계 (선택된 요일)
  const monthData = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr: { name: string; Completion: number; Satisfaction: number }[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      // fullDays 인덱스(+1) 와 getDay() 맞추기
      if (dt.getDay() === fullDays.indexOf(selectedDay) + 1) {
        const iso = dt.toISOString().split("T")[0];
        const dayRoutines = routines.filter((r) => (r as any).date === iso);
        const doneCount = dayRoutines.filter((r) => r.done).length;
        const sat = doneCount
          ? Math.round(
              dayRoutines.filter((r) => r.done).reduce((sum, r) => sum + r.rating, 0) /
                doneCount
            )
          : 0;
        arr.push({
          name: `${d}일`,
          Completion: dayRoutines.length
            ? Math.round((doneCount / dayRoutines.length) * 100)
            : 0,
          Satisfaction: sat,
        });
      }
    }
    return arr;
  }, [routines, selectedDay]);

  return (
    <div className="mt-4 space-y-6">
      <h2 className="font-semibold text-center">습관 통계 — {selectedDay}</h2>

      {/* 주간 */}
      <div>
        <h3 className="mb-2 font-semibold text-sm">이번 주 ({selectedDay})</h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={weekData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="Completion" fill="#0f172a" />
            <Bar dataKey="Satisfaction" fill="#1e40af" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 월간 */}
      <div>
        <h3 className="mb-2 font-semibold text-sm">이번 달 ({selectedDay})</h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={monthData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="Completion" fill="#0f172a" />
            <Bar dataKey="Satisfaction" fill="#1e40af" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* CSV 다운로드 */}
      <div className="text-center mt-4">
        <button
          onClick={onDownloadCsv}
          className="rounded-full bg-black text-white px-6 py-2 font-semibold hover:bg-gray-800 transition"
        >
          전체 로그 CSV 다운로드
        </button>
      </div>
    </div>
  );
}

// fullDays는 Page.tsx에서 import하거나 다시 정의하세요
const fullDays = ["월", "화", "수", "목", "금", "토", "일"];
