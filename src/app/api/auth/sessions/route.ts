import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getSessions } from '@/lib/sessiondb';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import logger from '@/lib/logger';

export async function GET() {
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

    const sessions = await getSessions(session.user.accountId);

    // Mark the current session
    const currentSessionId = session.user.sessionId;
    const sessionsWithCurrent = sessions.map(s => ({
      ...s,
      isCurrentSession: s.id === currentSessionId,
    }));

    return NextResponse.json({
      sessions: sessionsWithCurrent,
      success: true,
    });
  } catch (error) {
    logger.error('Error getting sessions:', { error });
    return NextResponse.json(
      {
        message: 'Failed to retrieve sessions',
        success: false,
      },
      { status: 500 }
    );
  }
}
