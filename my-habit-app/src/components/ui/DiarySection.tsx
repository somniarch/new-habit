// src/components/DiarySection.tsx
"use client";

import React, { useState, useEffect } from "react";

interface DiarySectionProps {
  day: string;
  tasks: string[];
}

async function generateSummaryAI(_day: string, _tasks: string[]): Promise<string> {
  try {
    const prompt = `다음은 사용자의 오늘 달성한 습관 및 일과 목록입니다:\n${_tasks.join(", ")}\n이 내용을 바탕으로 따뜻하고 긍정적인 응원의 메시지와 함께 짧게 요약해 주세요.`;
    const res = await fetch("/openai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    return res.ok && data.result ? data.result : "";
  } catch {
    return "";
  }
}

export default function DiarySection({ day, tasks }: DiarySectionProps) {
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (tasks.length === 5) {
      setIsLoading(true);
      generateSummaryAI(day, tasks)
        .then((result) => setSummary(result))
        .finally(() => setIsLoading(false));
    }
  }, [day, tasks]);

  return (
    <div className="p-4">
      {isLoading ? (
        <p className="text-center text-gray-600">작성중입니다... 조금만 기다려주세요...🌱</p>
      ) : summary ? (
        <div className="whitespace-pre-wrap bg-white p-4 rounded shadow">
          {summary}
        </div>
      ) : (
        <p className="text-center text-sm text-gray-400">아직 달성된 항목이 5개 모이지 않았어요.</p>
      )}
    </div>
  );
}
