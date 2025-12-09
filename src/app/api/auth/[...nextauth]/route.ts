import NextAuth, { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import logger from '@/lib/logger';
import { existsUser, isUserAdmin } from '@/lib/userdb';
import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';
import { createSession, updateSessionActivity, revokeSession } from '@/lib/sessiondb';
import { headers } from 'next/headers';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Account ID',
      credentials: {
        accountId: { label: 'Account ID', type: 'text', placeholder: 'Enter your Account ID' },
      },
      async authorize(credentials) {
        const { accountId } = credentials as { accountId: string };

        const exists = await existsUser(accountId);

        if (exists) {
          const isAdmin = await isUserAdmin(accountId);

          return {
            id: accountId,
            accountId,
            isAdmin,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }: { token: JWT; user: User; trigger?: string }) {
      if (user) {
        token.accountId = user.accountId;
        token.isAdmin = user.isAdmin;

        const headersList = await headers();
        const userAgent = headersList.get('user-agent') || 'Unknown';
        const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'Unknown';

        const { sessionId } = await createSession(user.accountId, userAgent, ip);

        token.sessionId = sessionId;
      }

      if (trigger === 'update' && token.sessionId) {
        await updateSessionActivity(token.sessionId as string);
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user = {
          ...session.user,
          accountId: token.accountId as string,
          isAdmin: token.isAdmin as boolean,
          sessionId: token.sessionId as string,
        };
      }
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.sessionId) {
        try {
          await revokeSession(token.sessionId as string, token.accountId as string);
        } catch (error) {
          logger.error('Error terminating session on signOut:', error);
        }
      }
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days (session lifetime)
  },
  jwt: {
    maxAge: 5 * 60, // 5 min (token lifetime)
  },
  secret: process.env.NEXTAUTH_SECRET || '/JZ9N+lqRtvspbAfs0HK41RkthPYuUdqxb+cuimYOXw=',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
