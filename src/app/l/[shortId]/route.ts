import { NextRequest, NextResponse } from 'next/server';
import { getTargetUrl } from '@/lib/linkdb';
import { getClientInfo } from '@/lib/utils';
import { saveAnalytics } from '@/lib/analyticsdb';
import logger from '@/lib/logger';

export async function GET(req: NextRequest, { params }: { params: Promise<{ shortId: string }> }) {
  try {
    const { shortId } = await params;

    const link = await getTargetUrl(shortId);

    if (!link || !link.target_url) {
      return NextResponse.redirect(new URL('/not-found', req.url));
    }

    const clientInfo = await getClientInfo(req);

    const analyticsData = {
      link_id: shortId,
      account_id: link.account_id,
      ...clientInfo,
    };

    saveAnalytics(analyticsData).catch(err =>
      logger.error('Failed to save analytics', { error: err, shortId })
    );

    return NextResponse.redirect(new URL(link.target_url));
  } catch (error) {
    logger.error('Link redirection error', error);
    return NextResponse.redirect(new URL('/error', req.url));
  }
}
