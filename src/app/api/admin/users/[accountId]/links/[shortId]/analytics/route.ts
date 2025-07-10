import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getAllAnalytics, removeAnalytics, removeAllAnalytics } from '@/lib/analyticsdb';
import { sanitizeMongoDocument } from '@/lib/utils';
import logger from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: { accountId: string, shortId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({
        message: "Unauthorized",
        success: false,
      }, { status: 401 });
    }
    
    const { accountId, shortId } = await params;
    
    if (!accountId || !shortId) {
      return NextResponse.json({
        message: "Account ID and Short ID are required",
        success: false,
      }, { status: 400 });
    }
    
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    const { analytics, total } = await getAllAnalytics(
      accountId, 
      shortId, 
      { page, limit }
    );
    
    const sanitizedAnalytics = analytics.map(item => sanitizeMongoDocument(item));
    
    return NextResponse.json({
      analytics: sanitizedAnalytics,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      success: true,
    });
  } catch (error) {
    logger.error('Error getting analytics:', { error, accountId: params.accountId, shortId: params.shortId });
    return NextResponse.json({
      message: "Failed to retrieve analytics",
      success: false,
    }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { accountId: string, shortId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({
        message: "Unauthorized",
        success: false,
      }, { status: 401 });
    }
    
    const { accountId, shortId } = await params;
    
    if (!accountId || !shortId) {
      return NextResponse.json({
        message: "Account ID and Short ID are required",
        success: false,
      }, { status: 400 });
    }
    
    const body = await req.json();
    
    if (body.delete_all) {
      const result = await removeAllAnalytics(accountId, shortId);
      
      return NextResponse.json({
        message: result.status,
        success: result.success,
      }, { status: result.success ? 200 : 400 });
    }
    
    if (body.analytics_id) {
      const result = await removeAnalytics(accountId, shortId, body.analytics_id);
      
      return NextResponse.json({
        message: result.status,
        success: result.success,
      }, { status: result.success ? 200 : 400 });
    }
    
    return NextResponse.json({
      message: "Either delete_all or analytics_id must be provided",
      success: false,
    }, { status: 400 });
  } catch (error) {
    logger.error('Error deleting analytics:', { error, accountId: params.accountId, shortId: params.shortId });
    return NextResponse.json({
      message: "Failed to delete analytics",
      success: false,
    }, { status: 500 });
  }
}