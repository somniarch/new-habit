import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

export async function GET() {
  const msg = "Welcome to Habit Recommendation API. Please use POST with JSON body: { prevTask, nextTask }."
  return new NextResponse(msg, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("[Habit API] Missing OPENAI_API_KEY")
      return NextResponse.json({ error: "API configuration error" }, { status: 500, headers: corsHeaders })
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("[Habit API] JSON parse error:", parseError)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400, headers: corsHeaders })
    }

    const { prevTask, nextTask } = body

    if (!prevTask && !nextTask) {
      return NextResponse.json(
        { error: "No context provided (prevTask or nextTask required)" },
        { status: 400, headers: corsHeaders },
      )
    }

    // Create context
    const context = [prevTask, nextTask].filter(Boolean).join(", ")
    const prompt = `사용자의 이전 행동과 다음 행동: ${context}\n
이 행동들 사이에 자연스럽게 연결할 수 있는 짧은 웰빙 습관을
1) 형식: N분(1~5분) + 활동 + 이모지
2) 공백 포함 12자 이내
3) 3개 이상 5개 이하
4) 리스트 기호, 설명 등 불필요한 요소 없음
5) 활동은 모두 한국어 명사형으로만 작성

예시: 3분 스트레칭💪`

    console.log("[Habit API] Making request to OpenAI with context:", context)

    // Use AI SDK for better error handling
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: "당신은 웰빙 습관 추천 전문가입니다.",
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 200,
    })

    console.log("[Habit API] OpenAI response:", text)

    // Process response
    const suggestions = text
      .split(/\r?\n+/)
      .map((line) => line.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean)
      .filter((line) => /^\d+분\s[가-힣].+/u.test(line))
      .slice(0, 5) // Limit to max 5 suggestions

    if (suggestions.length === 0) {
      console.warn("[Habit API] No valid suggestions generated from response:", text)
      return NextResponse.json(
        {
          error: "No valid suggestions generated",
          debug: process.env.NODE_ENV === "development" ? text : undefined,
        },
        { status: 502, headers: corsHeaders },
      )
    }

    return NextResponse.json({ result: suggestions }, { status: 200, headers: corsHeaders })
  } catch (error: unknown) {
    console.error("[Habit API] Error occurred:", error)

    // Handle different types of errors
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()

      // API key issues
      if (errorMessage.includes("api key") || errorMessage.includes("unauthorized")) {
        return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401, headers: corsHeaders })
      }

      // Rate limiting
      if (errorMessage.includes("rate limit") || errorMessage.includes("quota")) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429, headers: corsHeaders },
        )
      }

      // Network/timeout issues
      if (errorMessage.includes("timeout") || errorMessage.includes("network")) {
        return NextResponse.json({ error: "Network timeout. Please try again." }, { status: 504, headers: corsHeaders })
      }

      // Model/service issues
      if (errorMessage.includes("model") || errorMessage.includes("service")) {
        return NextResponse.json({ error: "AI service temporarily unavailable" }, { status: 503, headers: corsHeaders })
      }

      return NextResponse.json({ error: `Request failed: ${error.message}` }, { status: 500, headers: corsHeaders })
    }

    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500, headers: corsHeaders })
  }
}
