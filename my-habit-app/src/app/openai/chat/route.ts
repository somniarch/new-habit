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
  const msg = "Welcome to Habit Recommendation API. Please use POST with JSON body: { prevTask, nextTask }.";
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

// POST handler: 실제 추천 로직
export async function POST(request: NextRequest) {
  try {
    console.log("[Habit API] POST request received");
    
    // Content-Type 확인
    const contentType = request.headers.get("content-type");
    console.log("[Habit API] Content-Type:", contentType);
    
    if (!contentType || !contentType.includes("application/json")) {
      return new NextResponse(
        JSON.stringify({ error: "Content-Type must be application/json" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    // 요청 본문 파싱
    let body;
    try {
      body = await request.json();
      console.log("[Habit API] Request body:", body);
    } catch (parseError) {
      console.error("[Habit API] JSON parse error:", parseError);
      return new NextResponse(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    const { prevTask, nextTask } = body;

    if (!prevTask && !nextTask) {
      return new NextResponse(
        JSON.stringify({ error: "No context provided (prevTask or nextTask required)" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    // OpenAI API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      console.error("[Habit API] OPENAI_API_KEY is not set");
      return new NextResponse(
        JSON.stringify({ error: "API configuration error" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json; charset=utf-8"
          }
        }
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

    console.log("[Habit API] Making OpenAI request with context:", context);

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

    // 줄 단위 분할 및 필터링
    const suggestions = text
      .split(/\r?\n+/)
      .map(line => line.replace(/^[-*]\s*/, "").trim())
      .filter(line => line)
      .filter(line => /\d+분\s[가-힣]+기?\p{Emoji}/u.test(line));

    console.log("[Habit API] Filtered suggestions:", suggestions);

    if (suggestions.length === 0) {
      return new NextResponse(
        JSON.stringify({ 
          error: "No suggestions generated", 
          rawResponse: text,
          debug: "OpenAI response did not match expected format"
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    // JSON 형태로 반환
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
    console.error("[Habit API] Error:", error);
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
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json; charset=utf-8"
        }
      }
    );
  }
}
