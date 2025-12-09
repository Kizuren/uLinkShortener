import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { revokeSession } from '@/lib/sessiondb';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { signOut } from 'next-auth/react';
import logger from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.accountId) {
      return NextResponse.json(
        {
          message: 'Unauthorized',
          success: false,
        },
        { status: 401 }
      );
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        {
          message: 'Session ID is required',
          success: false,
        },
        { status: 400 }
      );
    }

    const result = await revokeSession(sessionId, session.user.accountId);

    const isCurrentSession = sessionId === session.user.sessionId;
    if (isCurrentSession) {
      signOut({ redirect: false });
    }

    return NextResponse.json({
      ...result,
      isCurrentSession,
    });
  } catch (error) {
    logger.error('Error revoking session:', { error });
    return NextResponse.json(
      {
        message: 'Failed to revoking session',
        success: false,
      },
      { status: 500 }
    );
  }
}
