import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma, verifyUserLogin } from "@esolang-battle/db";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        name: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.name || !credentials?.password) return null;
        
        try {
          const user = await verifyUserLogin(prisma, credentials.name, credentials.password);
          if (user) {
            return {
              id: user.id.toString(),
              name: user.name,
              isAdmin: user.isAdmin,
              teams: user.teams,
            };
          }
        } catch (error) {
          console.error("Auth error:", error);
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as any).isAdmin;
        token.teams = (user as any).teams;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).isAdmin = token.isAdmin;
        (session.user as any).teams = token.teams;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
