import { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma, verifyUserLogin } from "@esolang-battle/db";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      isAdmin: boolean;
      teams: any[];
    } & DefaultSession["user"]
  }
}

export const authOptions: NextAuthOptions = {
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
        session.user.id = token.id as number;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.teams = (token.teams as any[]) || [];
      }
      return session;
    }
  },
  pages: {
    signIn: "/user",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
