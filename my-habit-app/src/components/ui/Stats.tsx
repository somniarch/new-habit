// src/components/ui/Stats.tsx
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

// Routine 타입 정의
export interface Routine {
  date: string;     // "YYYY-MM-DD" 형식
  day: string;      // "월".."일"
  done: boolean;    // 완료 여부
  rating: number;   // 만족도 (1–10)
  isHabit?: boolean;// true면 습관, false면 루틴
}

interface StatsProps {
  routines: Routine[];
  onDownloadCsv: () => void;
}

export function Stats({ routines, onDownloadCsv }: StatsProps) {
  // ── 1. 이번 주(월요일~일요일) 데이터만 필터
  const thisWeek = useMemo(() => {
    const today = new Date();
    const weekday = today.getDay();       // 일=0, 월=1, ... 토=6
    const monday = new Date(today);
    monday.setDate(today.getDate() - weekday + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return routines.filter((r) => {
      const d = new Date(r.date);
      return d >= monday && d <= sunday;
    });
  }, [routines]);

  // ── 2. 달성률 계산: 전체 / 루틴 / 습관
  const [allComp, rtComp, hbComp] = useMemo(() => {
    const totalCount = thisWeek.length;
    const doneAll = thisWeek.filter((r) => r.done).length;

    const routinesOnly = thisWeek.filter((r) => !r.isHabit);
    const doneRt = routinesOnly.filter((r) => r.done).length;

    const habitsOnly = thisWeek.filter((r) => r.isHabit);
    const doneHb = habitsOnly.filter((r) => r.done).length;

    const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

    return [
      pct(doneAll, totalCount),
      pct(doneRt, routinesOnly.length),
      pct(doneHb, habitsOnly.length),
    ];
  }, [thisWeek]);

  // ── 3. 만족도 계산: 전체 / 루틴 / 습관
  const [allSat, rtSat, hbSat] = useMemo(() => {
    const doneAllArr = thisWeek.filter((r) => r.done);
    const avgAll =
      doneAllArr.length > 0
        ? Math.round(doneAllArr.reduce((s, r) => s + r.rating, 0) / doneAllArr.length)
        : 0;

    const doneRtArr = thisWeek.filter((r) => r.done && !r.isHabit);
    const avgRt =
      doneRtArr.length > 0
        ? Math.round(doneRtArr.reduce((s, r) => s + r.rating, 0) / doneRtArr.length)
        : 0;

    const doneHbArr = thisWeek.filter((r) => r.done && r.isHabit);
    const avgHb =
      doneHbArr.length > 0
        ? Math.round(doneHbArr.reduce((s, r) => s + r.rating, 0) / doneHbArr.length)
        : 0;

    return [avgAll, avgRt, avgHb];
  }, [thisWeek]);

  // ── 4. Chart 데이터 포맷
  const compData = [
    { name: "전체 달성률", value: allComp },
    { name: "루틴 달성률", value: rtComp },
    { name: "습관 달성률", value: hbComp },
  ];

  const satData = [
    { name: "전체 만족도", value: allSat },
    { name: "루틴 만족도", value: rtSat },
    { name: "습관 만족도", value: hbSat },
  ];

  return (
    <div className="space-y-8">
      {/* 1행: 달성률 3개 */}
      <div className="grid grid-cols-3 gap-4">
        {compData.map(({ name, value }) => (
          <div key={name} className="p-2 border rounded">
            <h4 className="text-center font-semibold mb-1">{name} (%)</h4>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={[{ name, value }]}>
                <XAxis dataKey="name" hide />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="value" fill="#0f172a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* 2행: 만족도 3개 */}
      <div className="grid grid-cols-3 gap-4">
        {satData.map(({ name, value }) => (
          <div key={name} className="p-2 border rounded">
            <h4 className="text-center font-semibold mb-1">{name} (1–10)</h4>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={[{ name, value }]}>
                <XAxis dataKey="name" hide />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Bar dataKey="value" fill="#1e40af" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* CSV 다운로드 버튼 */}
      <div className="text-center">
        <button
          onClick={onDownloadCsv}
          className="bg-black text-white px-6 py-2 rounded-full font-semibold hover:bg-gray-800 transition"
        >
          전체 로그 CSV 다운로드
        </button>
      </div>
    </div>
  );
}
