import { NextRequest, NextResponse } from 'next/server';
import { getLinks } from '@/lib/linkdb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sanitizeMongoDocument } from '@/lib/utils';
import logger from '@/lib/logger';

// Get all links
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.accountId) {
      logger.info('Links retrieval request failed due to unauthorized access', { url: req.url });
      return NextResponse.json({
        message: "Unauthorized. Please sign in first.",
        success: false,
      }, { status: 401 });
    }
    
    const account_id = session.user.accountId;
    const { links, return: returnValue } = await getLinks(account_id);
    
    if (returnValue.success) {
      return NextResponse.json({
        message: "Links retrieved successfully",
        success: true,
        links: links.map(link => sanitizeMongoDocument(link)),
      }, { status: 200 });
    }
    
    logger.info('Links retrieval request failed', { error: returnValue.status, account_id, url: req.url });
    return NextResponse.json({
      message: returnValue.status || "Failed to retrieve links",
      success: false,
    }, { status: 404 });
  } catch (error) {
    logger.error('Links retrieval error:', { error, url: req.url });
    return NextResponse.json({
      message: "Failed to retrieve links",
      success: false,
    }, { status: 500 });
  }
}