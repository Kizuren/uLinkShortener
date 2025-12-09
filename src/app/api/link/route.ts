import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { isValidUrl, sanitizeMongoDocument } from '@/lib/utils';
import { getLinkById, createLink, editLink, removeLink } from '@/lib/linkdb';
import { removeAllAnalytics } from '@/lib/analyticsdb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// View link
// Example: /api/link?shortId=SHORT_ID
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.accountId) {
      logger.info('Link retrieval request failed due to unauthorized access', { url: req.url });
      return NextResponse.json(
        {
          message: 'Unauthorized. Please sign in first.',
          success: false,
        },
        { status: 401 }
      );
    }

    const account_id = session.user.accountId;

    const url = new URL(req.url);
    const shortId = url.searchParams.get('shortId');

    if (!shortId) {
      logger.info('Link retrieval request failed due to missing shortId', {
        account_id,
        url: req.url,
      });
      return NextResponse.json(
        {
          message: 'Missing shortId parameter',
          success: false,
        },
        { status: 400 }
      );
    }

    const { link, return: returnValue } = await getLinkById(account_id, shortId);

    if (returnValue.success && link) {
      return NextResponse.json(
        {
          message: 'Link retrieved successfully',
          success: true,
          link: sanitizeMongoDocument(link),
        },
        { status: 200 }
      );
    }

    logger.info('Link retrieval request failed', {
      error: returnValue.status,
      account_id,
      shortId,
      url: req.url,
    });
    return NextResponse.json(
      {
        message: returnValue.status || 'Link not found',
        success: false,
      },
      { status: 404 }
    );
  } catch (error) {
    logger.error('Link retrieval error:', { error, url: req.url });
    return NextResponse.json(
      {
        message: 'Failed to retrieve link',
        success: false,
      },
      { status: 500 }
    );
  }
}

// Create link
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.accountId) {
      logger.info('Link creation request failed due to unauthorized access', { url: req.url });
      return NextResponse.json(
        {
          message: 'Unauthorized. Please sign in first.',
          success: false,
        },
        { status: 401 }
      );
    }

    const account_id = session.user.accountId;
    let target_url;

    try {
      const contentType = req.headers.get('content-type');
      if (contentType && contentType.includes('application/json') && req.body) {
        const body = await req.json();
        target_url = body.target_url;
      }
    } catch {
      logger.info('Link creation request failed due to missing parameters', { url: req.url });
      return NextResponse.json(
        {
          message: 'Missing required parameters',
          success: false,
        },
        { status: 400 }
      );
    }

    if (!target_url || !isValidUrl(target_url)) {
      logger.info('Link creation request failed due to invalid URL', { account_id, url: req.url });
      return NextResponse.json(
        {
          message: 'Invalid URL. Please provide a valid URL with http:// or https://',
          success: false,
        },
        { status: 400 }
      );
    }

    const { shortId, return: returnValue } = await createLink(account_id, target_url);

    if (returnValue.success) {
      return NextResponse.json(
        {
          message: 'Link Creation succeeded',
          success: true,
          shortId,
        },
        { status: 200 }
      );
    }

    logger.error('Link creation request failed', {
      error: returnValue.status,
      account_id,
      url: req.url,
    });
    return NextResponse.json(
      {
        message: returnValue.status || 'Link creation failed',
        success: false,
      },
      { status: 422 }
    );
  } catch (error) {
    logger.error('Link creation error:', { error, url: req.url });
    return NextResponse.json(
      {
        message: 'Link creation failed',
        success: false,
      },
      { status: 500 }
    );
  }
}

// Edit link
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.accountId) {
      logger.info('Link edit request failed due to unauthorized access', { url: req.url });
      return NextResponse.json(
        {
          message: 'Unauthorized. Please sign in first.',
          success: false,
        },
        { status: 401 }
      );
    }

    const account_id = session.user.accountId;
    let shortId, target_url;

    try {
      const contentType = req.headers.get('content-type');
      if (contentType && contentType.includes('application/json') && req.body) {
        const body = await req.json();
        shortId = body.shortId;
        target_url = body.target_url;
      }
    } catch {
      logger.info('Link edit request failed due to missing parameters', { url: req.url });
      return NextResponse.json(
        {
          message: 'Missing required parameters',
          success: false,
        },
        { status: 400 }
      );
    }

    if (!shortId) {
      logger.info('Link edit request failed due to missing shortId', { account_id, url: req.url });
      return NextResponse.json(
        {
          message: 'Missing shortId parameter',
          success: false,
        },
        { status: 400 }
      );
    }

    if (!target_url || !isValidUrl(target_url)) {
      logger.info('Link edit request failed due to invalid URL', { account_id, url: req.url });
      return NextResponse.json(
        {
          message: 'Invalid URL. Please provide a valid URL with http:// or https://',
          success: false,
        },
        { status: 400 }
      );
    }

    const returnValue = await editLink(account_id, shortId, target_url);

    if (returnValue.success) {
      return NextResponse.json(
        {
          message: 'Link updated successfully',
          success: true,
        },
        { status: 200 }
      );
    }

    logger.error('Link edit request failed', {
      error: returnValue.status,
      account_id,
      shortId,
      url: req.url,
    });
    return NextResponse.json(
      {
        message: returnValue.status || 'Link update failed',
        success: false,
      },
      { status: 422 }
    );
  } catch (error) {
    logger.error('Link edit error:', { error, url: req.url });
    return NextResponse.json(
      {
        message: 'Link update failed',
        success: false,
      },
      { status: 500 }
    );
  }
}

// Delete link
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.accountId) {
      logger.info('Link removal request failed due to unauthorized access', { url: req.url });
      return NextResponse.json(
        {
          message: 'Unauthorized. Please sign in first.',
          success: false,
        },
        { status: 401 }
      );
    }

    const account_id = session.user.accountId;
    let shortId;

    try {
      const contentType = req.headers.get('content-type');
      if (contentType && contentType.includes('application/json') && req.body) {
        const body = await req.json();
        shortId = body.shortId;
      }
    } catch {
      logger.info('Link removal request failed due to missing parameters', { url: req.url });
      return NextResponse.json(
        {
          message: 'Missing required parameters',
          success: false,
        },
        { status: 400 }
      );
    }

    if (!shortId) {
      logger.info('Link removal request failed due to missing shortId', {
        account_id,
        url: req.url,
      });
      return NextResponse.json(
        {
          message: 'Missing shortId parameter',
          success: false,
        },
        { status: 400 }
      );
    }

    await removeAllAnalytics(account_id, shortId);
    const returnValue = await removeLink(account_id, shortId);

    if (returnValue.success) {
      return NextResponse.json(
        {
          message: 'Link removal succeeded',
          success: true,
        },
        { status: 200 }
      );
    }

    logger.error('Link removal request failed', {
      error: returnValue.status,
      account_id,
      url: req.url,
    });
    return NextResponse.json(
      {
        message: returnValue.status || 'Link removal failed',
        success: false,
      },
      { status: 422 }
    );
  } catch (error) {
    logger.error('Link removal error:', { error, url: req.url });
    return NextResponse.json(
      {
        message: 'Link removal failed',
        success: false,
      },
      { status: 500 }
    );
  }
}
