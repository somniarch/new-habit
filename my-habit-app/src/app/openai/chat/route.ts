// new-habit/my-habit-app/src/app/openai/chat/route.ts

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    // 조합된 컨텍스트 생성
    const context = [prevTask, nextTask].filter(Boolean).join(", ");
    const prompt = `사용자의 이전 행동과 다음 행동: ${context}
이 행동들 사이에 자연스럽게 연결할 수 있는 짧은 웰빙 습관을
1) 형식: N분(1~5분) + 활동 + 이모지
2) 공백 포함 12자 이내
3) 3개 이상 5개 이하
4) 리스트 기호, 설명 등 불필요한 요소 없음
5) 활동은 모두 한국어 명사형으로만 작성
예시: 3분 스트레칭💪`;

    // OpenAI 호출
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "당신은 웰빙 습관 추천 전문가입니다." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    // 응답 텍스트 추출
    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    console.log("[Habit API] OpenAI raw response:", text);

    // 줄 단위로 분할, 불필요한 접두사 제거
    const suggestions = text
      .split(/\r?\n+/)
      .map((line) => line.replace(/^[-*]\s*/, "").trim())
      .filter((line) => line)
      // 명사형 형태만 필터링 (끝이 '기' 또는 명사형 활동) – 필요 시 확장
      .filter((line) => /\d+분\s[가-힣]+기?\p{Emoji}/u.test(line));

    // 빈 배열일 경우 명확한 에러 반환
    if (suggestions.length === 0) {
      return NextResponse.json(
        { error: "No suggestions generated" },
        { status: 502 }
      );
    }

    // JSON 배열 형태로 바로 반환
    return NextResponse.json(suggestions);
  } catch (error: unknown) {
    console.error("[Habit API] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
