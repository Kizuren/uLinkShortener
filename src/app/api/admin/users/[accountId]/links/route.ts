import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getLinks } from '@/lib/linkdb';
import { sanitizeMongoDocument } from '@/lib/utils';
import logger from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({
        message: "Unauthorized",
        success: false,
      }, { status: 401 });
    }
    
    const { accountId } = await params;
    
    if (!accountId) {
      return NextResponse.json({
        message: "Account ID is required",
        success: false,
      }, { status: 400 });
    }
    
    const { links } = await getLinks(accountId);
    const sanitizedLinks = links.map(link => (sanitizeMongoDocument(link)));
    
    return NextResponse.json({
      links: sanitizedLinks,
      success: true,
    });
  } catch (error) {
    logger.error('Error getting user links:', error);
    return NextResponse.json({
      message: "Failed to retrieve user links",
      success: false,
    }, { status: 500 });
  }
}