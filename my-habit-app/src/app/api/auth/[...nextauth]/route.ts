import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

// Supabase client 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const handler = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "관리자 로그인",
      credentials: {
        email: { label: "이메일", type: "email", required: true },
        password: { label: "비밀번호", type: "password", required: true },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Supabase에서 admins 테이블에서 유저 조회
        const { data: user, error } = await supabase
          .from("admins")
          .select("*")
          .eq("email", credentials.email)
          .single();

        if (error || !user) return null;

        // bcrypt 해시 비교
        const isValid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!isValid) return null;

        // 반환 객체에 원하는 정보 추가 가능 (ex: role 등)
        return { id: user.id, email: user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.sub && session.user) {
        session.user.id = token.sub as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
