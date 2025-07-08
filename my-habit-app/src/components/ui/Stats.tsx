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

export interface Routine {
  date: string;     // "2025-07-08"
  day: string;      // "월".."일"
  done: boolean;
  rating: number;   // 1–10
  isHabit?: boolean;
}

interface StatsProps {
  routines: Routine[];
  onDownloadCsv: () => void;
}

export function Stats({ routines, onDownloadCsv }: StatsProps) {
  // 이번 주 월요일–일요일만 필터
  const thisWeek = useMemo(() => {
    const today = new Date();
    const weekday = today.getDay();         // 일=0, 월=1…
    const monday = new Date(today);
    monday.setDate(today.getDate() - weekday + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return routines.filter(r => {
      const d = new Date(r.date);
      return d >= monday && d <= sunday;
    });
  }, [routines]);

  // 1) 달성률 계산 (전체 / 루틴 / 습관)
  const [allComp, rtComp, hbComp] = useMemo(() => {
    const total    = thisWeek.length;
    const doneAll  = thisWeek.filter(r => r.done).length;

    const routineItems   = thisWeek.filter(r => !r.isHabit);
    const doneRoutine    = routineItems.filter(r => r.done).length;

    const habitItems     = thisWeek.filter(r => r.isHabit);
    const doneHabit      = habitItems.filter(r => r.done).length;

    const pct = (a: number, b: number) => b ? Math.round(a / b * 100) : 0;
    return [
      pct(doneAll, total),
      pct(doneRoutine, routineItems.length),
      pct(doneHabit, habitItems.length),
    ];
  }, [thisWeek]);

  // 2) 만족도 계산 (전체 / 루틴 / 습관)
  const [allSat, rtSat, hbSat] = useMemo(() => {
    const doneAll    = thisWeek.filter(r => r.done);
    const avgAll     = doneAll.length
      ? Math.round(doneAll.reduce((s, r) => s + r.rating, 0) / doneAll.length)
      : 0;

    const doneRt     = thisWeek.filter(r => r.done && !r.isHabit);
    const avgRt      = doneRt.length
      ? Math.round(doneRt.reduce((s, r) => s + r.rating, 0) / doneRt.length)
      : 0;

    const doneHb     = thisWeek.filter(r => r.done && r.isHabit);
    const avgHb      = doneHb.length
      ? Math.round(doneHb.reduce((s, r) => s + r.rating, 0) / doneHb.length)
      : 0;

    return [avgAll, avgRt, avgHb];
  }, [thisWeek]);

  // 차트에 바로 넘겨줄 데이터 포맷
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

      {/* ── 1행: 달성률 3개 ── */}
      <div className="grid grid-cols-3 gap-4">
        {compData.map(({ name, value }) => (
          <div key={name}>
            <h4 className="text-center font-semibold mb-1">{name} (%)</h4>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={[{ name, value }]}>
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="value" fill="#0f172a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* ── 2행: 만족도 3개 ── */}
      <div className="grid grid-cols-3 gap-4">
        {satData.map(({ name, value }) => (
          <div key={name}>
            <h4 className="text-center font-semibold mb-1">{name} (1–10)</h4>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={[{ name, value }]}>
                <XAxis dataKey="name" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Bar dataKey="value" fill="#1e40af" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* CSV 다운로드 */}
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
