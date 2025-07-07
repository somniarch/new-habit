import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 웰빙 습관 추천 전문가입니다."
        },
        {
          role: "user",
          content: `사용자의 앞뒤 활동 사이에 자연스럽게 실천할 수 있는 짧은 웰빙 습관을
    다음 조건에 맞춰 3개 이상 5개 이하로 추천해 주세요.
    
    1. 형식: N분 + 활동 + 이모지 (예: “3분 스트레칭💪”)
       - N은 1~5 사이의 정수
       - 끝에 해당 활동을 잘 나타내는 이모지를 반드시 붙일 것
    2. 각 항목 공백 포함 최대 12자 이내
    3. 총 아이템 수는 3개 이상 5개 이하
    4. 리스트 기호, 마크다운, ‘*’ 문자, 설명 문구 등 불필요한 문법요소 절대 사용 금지
    
    —
    예시 출력:
    3분 스트레칭💪
    2분 호흡하기🌬️
    5분 걷기🚶‍♀️`
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });


    const result = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ result });
  } catch (error: unknown) {
    console.error("Habit recommendation error:", error);
    let message = "Unknown error";
    if (error && typeof error === "object" && "message" in error) {
      message = String((error as { message?: unknown }).message);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
