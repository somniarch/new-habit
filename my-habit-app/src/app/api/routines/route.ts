import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });
  const userId = session.user.id;
  const routines = await prisma.routine.findMany({
    where: { userId },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(routines);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });
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

