// my-habit-app/src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const { id, password } = await request.json();

  // DB에서 해당 유저 찾기
  const user = await prisma.user.findUnique({ where: { id } });

  // 유저 없거나 비밀번호 다르면 실패
  const isValid = user ? await bcrypt.compare(password, user.password) : false;
  if (!user || !isValid) {
    return NextResponse.json(
      { success: false, message: "Invalid credentials" },
      { status: 401 }
    );
  }

  // 성공 응답
  return NextResponse.json({ success: true, id: user.id });
}
