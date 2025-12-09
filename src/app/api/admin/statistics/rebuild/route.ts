import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { updateStats } from '@/lib/statisticsdb';
import logger from '@/lib/logger';

export async function POST() {
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

    const result = await updateStats();

    return NextResponse.json({
      message: result.status,
      success: result.success,
    });
  } catch (error) {
    logger.error('Error rebuilding statistics:', { error });
    return NextResponse.json(
      {
        message: 'Failed to rebuild statistics',
        success: false,
      },
      { status: 500 }
    );
  }
}
