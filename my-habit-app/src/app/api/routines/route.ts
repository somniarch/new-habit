import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: 유저의 루틴(습관) 목록 조회
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const routines = await prisma.routine.findMany({
    where: { userId },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(routines);
}

// POST: 새로운 루틴(습관) 추가
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await req.json();
  const { date, day, start, end, task, done, rating, isHabit } = body;

  const created = await prisma.routine.create({
    data: {
      userId,
      date,
      day,
      start,
      end,
      task,
      done: Boolean(done),
      rating: Number(rating),
      isHabit: Boolean(isHabit),
    },
  });
  return NextResponse.json(created, { status: 201 });
}
