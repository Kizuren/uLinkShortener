import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      accountId: string;
      isAdmin: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    accountId: string;
    isAdmin: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accountId: string;
    isAdmin: boolean;
  }
}
