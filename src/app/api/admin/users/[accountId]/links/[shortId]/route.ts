import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getLinkById, editLink, removeLink } from '@/lib/linkdb';
import { sanitizeMongoDocument } from '@/lib/utils';
import logger from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string; shortId: string }> }
) {
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

    const { accountId, shortId } = await params;

    if (!accountId || !shortId) {
      return NextResponse.json(
        {
          message: 'Account ID and Short ID are required',
          success: false,
        },
        { status: 400 }
      );
    }

    const { link, return: linkReturn } = await getLinkById(accountId, shortId);

    if (!linkReturn.success || !link) {
      return NextResponse.json(
        {
          message: linkReturn.status,
          success: false,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      link: sanitizeMongoDocument(link),
      success: true,
    });
  } catch (error) {
    logger.error('Error getting link details:', {
      error,
      accountId: (await params).accountId,
      shortId: (await params).shortId,
    });
    return NextResponse.json(
      {
        message: 'Failed to retrieve link details',
        success: false,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string; shortId: string }> }
) {
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

    const { accountId, shortId } = await params;

    if (!accountId || !shortId) {
      return NextResponse.json(
        {
          message: 'Account ID and Short ID are required',
          success: false,
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { target_url } = body;

    if (!target_url) {
      return NextResponse.json(
        {
          message: 'Target URL is required',
          success: false,
        },
        { status: 400 }
      );
    }

    const result = await editLink(accountId, shortId, target_url);

    return NextResponse.json(
      {
        message: result.status,
        success: result.success,
      },
      { status: result.success ? 200 : 400 }
    );
  } catch (error) {
    logger.error('Error updating link:', {
      error,
      accountId: (await params).accountId,
      shortId: (await params).shortId,
    });
    return NextResponse.json(
      {
        message: 'Failed to update link',
        success: false,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string; shortId: string }> }
) {
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

    const { accountId, shortId } = await params;

    if (!accountId || !shortId) {
      return NextResponse.json(
        {
          message: 'Account ID and Short ID are required',
          success: false,
        },
        { status: 400 }
      );
    }

    const result = await removeLink(accountId, shortId);

    return NextResponse.json(
      {
        message: result.status,
        success: result.success,
      },
      { status: result.success ? 200 : 400 }
    );
  } catch (error) {
    logger.error('Error deleting link:', {
      error,
      accountId: (await params).accountId,
      shortId: (await params).shortId,
    });
    return NextResponse.json(
      {
        message: 'Failed to delete link',
        success: false,
      },
      { status: 500 }
    );
  }
}
