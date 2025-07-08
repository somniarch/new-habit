import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Node.js 런타임에서 실행 (이미지 생성에 필요한 openai 패키지 지원)
export const runtime = "nodejs";

// CORS 설정
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
};

// CORS preflight 응답
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders
  });
}

// OpenAI 클라이언트 초기화
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST: 그림 생성
export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    if (!prompt) {
      return new NextResponse(JSON.stringify({ error: "No prompt provided" }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const response = await openai.images.generate({
      prompt,
      size: "256x256",
      n: 1,
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      return new NextResponse(JSON.stringify({ error: "No image URL returned from OpenAI" }), {
        status: 500,
        headers: corsHeaders
      });
    }

    return new NextResponse(JSON.stringify({ imageUrl }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8"
      }
    });
  } catch (error: unknown) {
    console.error("[Image API] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new NextResponse(JSON.stringify({ error: message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
