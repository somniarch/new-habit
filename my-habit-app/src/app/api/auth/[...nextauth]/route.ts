import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma"; // 본인 경로에 맞게!
import bcrypt from "bcrypt";

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;
        return { id: user.id, email: user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      // 타입 확장(global.d.ts or next-auth.d.ts) 했다면 any 없이 아래처럼!
      if (token.sub && session.user) session.user.id = token.sub as string;
      return session;
    },
  },
  pages: {
    signIn: "/login", // 커스텀 로그인 페이지 (옵션)
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
