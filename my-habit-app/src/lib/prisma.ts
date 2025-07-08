// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // Next.js 핫 리로드 시 중복 생성 방지
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
