import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: 유저의 다이어리 리스트 조회
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const diaries = await prisma.diary.findMany({
    where: { userId },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(diaries);
}

// POST: 새로운 다이어리 작성
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await req.json();
  const { date, summary, imageUrl } = body;

  const diary = await prisma.diary.create({
    data: { userId, date, summary, imageUrl },
  });
  return NextResponse.json(diary, { status: 201 });
}
