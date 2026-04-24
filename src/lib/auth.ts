import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";

const cloudBookmarksEnabled = Boolean(process.env.TURSO_DATABASE_URL);
const githubEnabled = Boolean(
  cloudBookmarksEnabled &&
    process.env.AUTH_GITHUB_ID &&
    process.env.AUTH_GITHUB_SECRET
);
const demoLoginEnabled =
  process.env.AUTH_ENABLE_DEMO_LOGIN === "true" ||
  process.env.NODE_ENV !== "production";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: cloudBookmarksEnabled ? PrismaAdapter(prisma) : undefined,
  providers: [
    ...(githubEnabled
      ? [
          GitHub({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
          }),
        ]
      : []),
    ...(demoLoginEnabled
      ? [
          Credentials({
            name: "Guest Mode",
            credentials: {
              username: { label: "Username", type: "text", placeholder: "demo" },
              password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
              if (credentials?.username === "demo" && credentials?.password === "demo") {
                return { id: "demo-user-id", name: "Demo User", email: "demo@example.com" };
              }

              return null;
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async session({ session, token, user }) {
      if (session.user) {
        // Use user.id if using adapter, or token.sub if using JWT (Credentials)
        session.user.id = user?.id || (token?.sub as string);
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt" // Required for Credentials provider
  }
});
