// pages/api/routines.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  if (!session?.user?.id) return res.status(401).end();

  const userId = session.user.id as string;

  if (req.method === "GET") {
    const routines = await prisma.routine.findMany({
      where: { userId },
      orderBy: { date: "asc" },
    });
    return res.status(200).json(routines);
  }

  if (req.method === "POST") {
    const { date, day, start, end, task, done, rating, isHabit } = req.body;
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
    return res.status(201).json(created);
  }

  // PATCH, DELETE 등 필요 시 추가 구현
  return res.status(405).end();
}
