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

    const response = await openai.images.generate({
      prompt,
      size: "256x256",
      n: 1,
    });

    const imageUrl = response.data?.[0]?.url;

    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL returned from OpenAI" }, { status: 500 });
    }

    return NextResponse.json({ imageUrl });
  } catch (error: unknown) {
    console.error("Image generation error:", error);
    let message = "Unknown error";
    if (error && typeof error === "object" && "message" in error) {
      message = String((error as { message: unknown }).message);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
