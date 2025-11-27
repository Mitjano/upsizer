import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

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
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
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
    async signIn({ user, account, profile }) {
      // This callback runs AFTER Google OAuth but BEFORE creating session
      // We register/update user in database here
      if (user.email) {
        try {
          // Call internal registration endpoint
          const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
          const response = await fetch(`${baseUrl}/api/auth/register-user-internal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              image: user.image,
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
