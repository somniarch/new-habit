// new-habit/my-habit-app/src/app/openai/chat/route.ts

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { prevTask, nextTask } = await request.json();
    if (!prevTask && !nextTask) {
      return NextResponse.json(
        { error: "No context provided (prevTask or nextTask required)" },
        { status: 400 }
      );
    }

    // 서버에서 프롬프트 구성
    const context = [prevTask, nextTask].filter(Boolean).join(", ");
    const prompt = `사용자의 이전 행동과 다음 행동: ${context}
이 행동들 사이에 자연스럽게 연결할 수 있는 짧은 웰빙 습관을
1) 형식: N분(1~5분) + 활동 + 이모지
2) 공백 포함 12자 이내
3) 3개 이상 5개 이하
4) 리스트 기호, 설명 등 불필요한 요소 없음
예시: 3분 스트레칭💪`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "당신은 웰빙 습관 추천 전문가입니다." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const text = completion.choices[0]?.message?.content || "";
    const suggestions = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line);

    return NextResponse.json({ suggestions });
    } catch (error: unknown) {
    console.error("Habit recommendation error:", error);
    // narrow to Error
    const message =
      error instanceof Error
        ? error.message
        : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
