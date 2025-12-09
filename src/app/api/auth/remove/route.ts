import { NextRequest, NextResponse } from 'next/server';
import { removeUser, isUserAdmin } from '@/lib/userdb';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function DELETE(req: NextRequest) {
  try {
    let account_id;
    logger.info('Account removal request', { url: req.url });
    const session = await getServerSession(authOptions);

    try {
      const contentType = req.headers.get('content-type');
      if (contentType && contentType.includes('application/json') && req.body) {
        const body = await req.json();
        account_id = body.account_id;
      }
    } catch {
      logger.info('Account removal request failed due to missing parameters', { url: req.url });
      return NextResponse.json(
        {
          message: 'Missing required parameters',
          success: false,
        },
        { status: 400 }
      );
    }

    if (session?.user?.accountId === account_id || (await isUserAdmin(session?.user?.accountId))) {
      const accountRemovalResponse = await removeUser(account_id);
      return NextResponse.json(
        {
          message: accountRemovalResponse.status,
          success: accountRemovalResponse.success,
        },
        { status: accountRemovalResponse.success ? 200 : 500 }
      );
    }

    logger.info('Account removal request failed due to missing rights', { url: req.url });
    return NextResponse.json(
      {
        message: 'Unauthorized account removal attempt',
        success: false,
      },
      { status: 401 }
    );
  } catch (error) {
    logger.error('Account removal error:', { error, url: req.url });
    return NextResponse.json(
      {
        message: 'Account removal failed',
        success: false,
      },
      { status: 500 }
    );
  }
}
