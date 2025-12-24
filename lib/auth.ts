import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/db";

// Admin emails from environment variable (comma-separated)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
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
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // Get user from database
        const user = await getUserByEmail(email);

        if (!user) {
          throw new Error("Invalid email or password");
        }

        // Check if user has a password (registered with email)
        if (!user.password) {
          throw new Error("Please sign in with Google or Facebook");
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          throw new Error("Invalid email or password");
        }

        // Check if email is verified
        if (!user.emailVerified) {
          throw new Error("Please verify your email address first");
        }

        // Check if user is banned/suspended
        if (user.status === "banned" || user.status === "suspended") {
          throw new Error("Your account has been suspended");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      }
    }),
  ],
  trustHost: true,
  basePath: "/api/auth",
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (security best practice)
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days (security best practice)
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // This callback runs AFTER OAuth/Credentials but BEFORE creating session
      // For OAuth providers (Google, Facebook), we register/update user in database
      // For credentials provider, user is already registered
      if (user.email && account?.provider !== 'credentials') {
        try {
          // Call internal registration endpoint for OAuth providers
          const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
          const response = await fetch(`${baseUrl}/api/auth/register-user-internal`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Internal-Auth': process.env.NEXTAUTH_SECRET || '',
            },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              image: user.image,
              authProvider: account?.provider,
            }),
          });

          if (!response.ok) {
            console.error('[auth] Failed to register user:', await response.text());
            // Don't block login if registration fails
          } else {
            const data = await response.json();
          }
        } catch (error) {
          console.error('[auth] Error during user registration:', error);
          // Don't block login if registration fails
        }
      }
      return true; // Allow sign in
    },
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
});

// Helper function to check if user is admin
export async function isAdmin() {
  const session = await auth();
  return session?.user?.isAdmin === true;
}
