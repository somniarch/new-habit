import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Vercel에서 Node.js runtime 사용
export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
};

// OPTIONS handler: CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders
  });
}

// GET handler: 안내 메시지 반환
export async function GET() {
  const msg = "Welcome to Habit Recommendation & Diary Summary API. Use POST with JSON body.";
  return new NextResponse(
    JSON.stringify({ message: msg }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8"
      }
    }
  );
}

// POST handler: 습관 추천 or 일기 요약 분기
export async function POST(request: NextRequest) {
  try {
    console.log("[API] POST request received");

    // Content-Type 확인
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return new NextResponse(
        JSON.stringify({ error: "Content-Type must be application/json" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
        }
      );
    }

    // 요청 본문 파싱
    let body: { prevTask?: string; nextTask?: string; prompt?: string };
    try {
      body = await request.json();
      console.log("[API] Request body:", body);
    } catch (parseError) {
      console.error("[API] JSON parse error:", parseError);
      return new NextResponse(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
        }
      );
    }

    // body에서 필요한 값들 구조분해
    const { prevTask, nextTask, prompt } = body;

    // 일기 요약 분기: prompt만 있을 때
    if (prompt && !prevTask && !nextTask) {
      console.log("[API] Diary summary mode");
      const diaryPrompt = `다음은 사용자의 오늘 달성한 습관 및 일과 목록입니다:
${prompt}

이 중 특히 의미 있었던 순간과 그때 느낀 감정을 간결하게 담아,
사용자의 노력을 진심으로 칭찬하며 따뜻하고 생동감 있는 일기 형식으로 짧게 요약해 주세요.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "따뜻하고 구체적인 일기 요약을 작성하는 전문가입니다." },
          { role: "user", content: diaryPrompt }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      const summary = completion.choices[0]?.message?.content?.trim() ?? "";
      console.log("[API] Diary summary response:", summary);

      return new NextResponse(
        JSON.stringify({ result: summary }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    // POST handler 안
if (prompt && !prevTask && !nextTask) {
  console.log("[API] Diary summary mode");
  const diaryPrompt = `다음은 사용자의 오늘 달성한 습관 및 일과 목록입니다:
${prompt}

이 중 특히 의미 있었던 순간과 그때 느낀 감정을 간결하게 담아,
사용자의 노력을 진심으로 칭찬하며 따뜻하고 생동감 있는 일기 형식으로 짧게 요약해 주세요.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "따뜻하고 구체적인 일기 요약을 작성하는 전문가입니다." },
      { role: "user", content: diaryPrompt }
    ],
    temperature: 0.7,
    max_tokens: 200
  });

  const summary = completion.choices[0]?.message?.content?.trim() ?? "";
  console.log("[API] Diary summary response:", summary);

  return new NextResponse(
    JSON.stringify({ result: summary }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8"
      }
    }
  );
}

    // 2) 습관 추천 분기: prevTask 또는 nextTask 있을 때
    if (!prevTask && !nextTask) {
      return new NextResponse(
        JSON.stringify({ error: "No context provided (prevTask or nextTask required)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
        }
      );
    }

    console.log("[API] Habit recommendation mode. Context:", prevTask, nextTask);

    // 조합된 컨텍스트 생성
    const context = [prevTask, nextTask].filter(Boolean).join(", ");
    const habitPrompt = `사용자의 이전 행동과 다음 행동: ${context}
이 행동들 사이에 자연스럽게 연결할 수 있는 짧은 웰빙 습관을
1) 형식: N분(1~5분) + 활동 + 이모지
2) 공백 포함 12자 이내
3) 3개 이상 5개 이하
4) 리스트 기호, 설명 등 불필요한 요소 없음
5) 활동은 모두 한국어 명사형으로만 작성
예시: 3분 스트레칭💪`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "당신은 웰빙 습관 추천 전문가입니다." },
        { role: "user", content: habitPrompt }
      ],
      temperature: 0.7,
      max_tokens: 200
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    console.log("[API] OpenAI raw response:", text);

    const suggestions = text
      .split(/\r?\n+/)
      .map(line => line.replace(/^[-*]\s*/, "").trim())
      .filter(line => line)
      .filter(line => /\d+분\s[가-힣]+기?\p{Emoji}/u.test(line));

    console.log("[API] Filtered suggestions:", suggestions);

    if (suggestions.length === 0) {
      return new NextResponse(
        JSON.stringify({
          error: "No suggestions generated",
          rawResponse: text,
          debug: "OpenAI response did not match expected format"
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
        }
      );
    }

    return new NextResponse(
      JSON.stringify({ result: suggestions }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json; charset=utf-8"
        }
      }
    );

  } catch (error: unknown) {
    console.error("[API] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : undefined;

    return new NextResponse(
      JSON.stringify({
        error: message,
        details: stack,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
      }
    );
  }
}
