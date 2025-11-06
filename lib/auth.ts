import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow specific GitHub username
      const allowedUsers = ["Coneja-Chibi"]; // Add more usernames here if needed

      if (account?.provider === "github") {
        const githubProfile = profile as any;
        const username = githubProfile?.login;

        if (allowedUsers.includes(username)) {
          return true;
        }
        return false; // Deny access
      }

      return true;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
