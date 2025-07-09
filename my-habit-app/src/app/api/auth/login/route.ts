// my-habit-app/src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const { userId, password } = await request.json();

  // DB에서 해당 유저 찾기
  const user = await prisma.user.findUnique({ where: { id: userId } });

  // 유저 없거나 비밀번호 다르면 실패
  if (!user || user.password !== password) {
    return NextResponse.json(
      { success: false, message: "Invalid credentials" },
      { status: 401 }
    );
  }

  // 성공 응답
  return NextResponse.json({ success: true, userId: user.id });
}
