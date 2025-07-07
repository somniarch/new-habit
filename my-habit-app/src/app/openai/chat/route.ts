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
        { role: "system", content: "You are a helpful assistant that recommends short wellness habits." },
        { role: "user", content: prompt },
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
