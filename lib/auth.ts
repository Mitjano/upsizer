import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createUser, getUserByEmail, updateUserLogin, createNotification } from "./db";
import { sendWelcomeEmail } from "./email";

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
      // Create or update user in database on sign in
      if (user.email) {
        try {
          let dbUser = getUserByEmail(user.email);
          const isNewUser = !dbUser;

          if (!dbUser) {
            // Create new user
            const isAdmin = ADMIN_EMAILS.includes(user.email);

            console.log(`Creating new user: ${user.email}`);
            dbUser = createUser({
              email: user.email,
              name: user.name || undefined,
              image: user.image || undefined,
              role: isAdmin ? 'admin' : 'user',
              status: 'active',
              credits: 3,
              totalUsage: 0,
              lastLoginAt: new Date().toISOString(),
            });
            console.log(`User created with ID: ${dbUser.id}`);

            // Create notification for new user registration
            createNotification({
              type: 'success',
              category: 'user',
              title: 'New User Registration',
              message: `${user.name || user.email} just registered for Pixelift`,
              metadata: { userId: dbUser.id, email: user.email, name: user.name },
            });

            // Send welcome email asynchronously (don't block sign in)
            // Only send if this is truly a new user
            if (isNewUser) {
              console.log(`Sending welcome email to: ${user.email}`);
              sendWelcomeEmail({
                userName: user.name || 'User',
                userEmail: user.email,
                freeCredits: 3,
              }).catch(err => console.error('Welcome email failed:', err));
            }
          } else {
            // Update last login
            updateUserLogin(user.email);
          }
        } catch (error) {
          console.error('Error in signIn callback:', error);
          // Don't block sign in even if there's an error
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
