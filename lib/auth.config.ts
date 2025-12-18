/**
 * Auth configuration for Edge Runtime (middleware)
 * This file contains only the providers configuration without Node.js modules
 */
import type { NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";

// Admin emails from environment variable (comma-separated)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);

export const authConfig: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    // Facebook OAuth Provider - only include if credentials are configured
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET ? [
      FacebookProvider({
        clientId: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        authorization: {
          params: {
            scope: "email,public_profile"
          }
        }
      }),
    ] : []),
    // Email/Password Credentials Provider
    // Note: The actual password verification happens in auth.ts
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      // This authorize function is a placeholder for Edge Runtime
      // The actual implementation with bcrypt is in auth.ts
      authorize: async () => null,
    }),
  ],
  trustHost: true,
  basePath: "/api/auth",
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        // Add isAdmin property to session
        session.user.isAdmin = ADMIN_EMAILS.includes(session.user.email || "");
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        // Add isAdmin to token
        token.isAdmin = ADMIN_EMAILS.includes(user.email || "");
      }
      return token;
    },
  },
};
