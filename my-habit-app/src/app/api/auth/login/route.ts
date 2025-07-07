import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const { userId, password } = await request.json();

  const user = await prisma.user.findUnique({ where: { userId } });
  if (!user || user.password !== password) {
    return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
  }

  return NextResponse.json({ success: true, userId: user.userId });
}
