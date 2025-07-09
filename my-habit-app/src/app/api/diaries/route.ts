// pages/api/diaries.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  if (!session?.user?.id) return res.status(401).end();

  const userId = session.user.id as string;

  if (req.method === "GET") {
    const diaries = await prisma.diary.findMany({
      where: { userId },
      orderBy: { date: "asc" },
    });
    return res.status(200).json(diaries);
  }

  if (req.method === "POST") {
    const { date, summary, imageUrl } = req.body;
    const diary = await prisma.diary.create({
      data: { userId, date, summary, imageUrl },
    });
    return res.status(201).json(diary);
  }

  // PUT, DELETE 등 필요 시 추가 구현
  return res.status(405).end();
}
