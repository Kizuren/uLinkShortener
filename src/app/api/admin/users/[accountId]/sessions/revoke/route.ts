import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revokeSession } from '@/lib/sessiondb';
import logger from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        {
          message: 'Unauthorized',
          success: false,
        },
        { status: 401 }
      );
    }

    const { sessionId, accountId } = await req.json();

    if (!sessionId || !accountId) {
      return NextResponse.json(
        {
          message: 'Session ID and Account ID are required',
          success: false,
        },
        { status: 400 }
      );
    }

    const result = await revokeSession(sessionId, accountId);

    return NextResponse.json({
      ...result,
    });
  } catch (error) {
    logger.error('Error revoking session:', { error });
    return NextResponse.json(
      {
        message: 'Failed to revoke session',
        success: false,
      },
      { status: 500 }
    );
  }
}
