import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createUser, getUserByEmail, updateUserLogin } from "./db";

// Admin emails - add your admin emails here
const ADMIN_EMAILS = [
  "admin@pixelift.pl",
  "michalchmielarz00@gmail.com",
  // Add more admin emails as needed
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      // Get or create user in database
      let dbUser = getUserByEmail(user.email);

      if (!dbUser) {
        // Create new user
        const isAdmin = ADMIN_EMAILS.includes(user.email);
        dbUser = createUser({
          email: user.email,
          name: user.name || undefined,
          image: user.image || undefined,
          role: isAdmin ? 'admin' : 'user',
          status: 'active',
          credits: 10, // Free credits for new users
          totalUsage: 0,
          lastLoginAt: new Date().toISOString(),
        });
      } else {
        // Update last login
        updateUserLogin(user.email);
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;

        // Get user from database to include latest data
        if (session.user.email) {
          const dbUser = getUserByEmail(session.user.email);
          if (dbUser) {
            session.user.isAdmin = dbUser.role === 'admin';
            session.user.credits = dbUser.credits;
            session.user.role = dbUser.role;
          } else {
            session.user.isAdmin = ADMIN_EMAILS.includes(session.user.email);
          }
        }
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
