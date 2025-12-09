import { NextRequest, NextResponse } from 'next/server';
import { createUser, isUserAdmin } from '@/lib/userdb';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  try {
    let is_admin;
    logger.info('Registration request', { url: req.url });
    const session = await getServerSession(authOptions);

    try {
      const contentType = req.headers.get('content-type');
      if (contentType && contentType.includes('application/json') && req.body) {
        const body = await req.json();
        is_admin = body.is_admin;
      }
    } catch {
      logger.info('Registration request failed due to missing parameters', { url: req.url });
      return NextResponse.json(
        {
          message: 'Missing required parameters',
          success: false,
        },
        { status: 400 }
      );
    }

    if (is_admin) {
      const isAuthorized = await isUserAdmin(session?.user?.accountId);

      if (isAuthorized) {
        const account = await createUser(is_admin);
        logger.info('Account creation request succeeded (admin)', { is_admin, url: req.url });
        return NextResponse.json(
          {
            message: 'Admin registration successful',
            success: true,
            account_id: account.account_id,
          },
          { status: 200 }
        );
      } else {
        logger.info('Registration request failed due to missing rights', {
          is_admin,
          url: req.url,
        });
        return NextResponse.json(
          {
            message: 'Unauthorized admin registration attempt',
            success: false,
          },
          { status: 401 }
        );
      }
    }

    const account = await createUser(false);

    return NextResponse.json({
      message: 'Registration successful',
      success: true,
      account_id: account.account_id,
    });
  } catch (error) {
    logger.error('Registration error:', { error, url: req.url });
    return NextResponse.json(
      {
        message: 'Registration failed',
        success: false,
      },
      { status: 500 }
    );
  }
}
