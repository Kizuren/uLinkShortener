import { NextRequest, NextResponse } from 'next/server';
import { getAllAnalytics, removeAnalytics, removeAllAnalytics } from '@/lib/analyticsdb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import logger from '@/lib/logger';

// View analytics for a specific link
// Example: /api/analytics?link_id=SHORT_ID&page=1&limit=50&startDate=2025-01-01&endDate=2025-12-31
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.accountId) {
      logger.info('Analytics request failed due to unauthorized access', { url: req.url });
      return NextResponse.json({
        message: "Unauthorized. Please sign in first.",
        success: false,
      }, { status: 401 });
    }
    
    const account_id = session.user.accountId;
    const url = new URL(req.url);
    
    const link_id = url.searchParams.get('link_id');
    if (!link_id) {
      logger.info('Analytics request failed due to missing link_id', { account_id, url: req.url });
      return NextResponse.json({
        message: "Missing link_id parameter",
        success: false,
      }, { status: 400 });
    }
    const all = url.searchParams.get('all') === 'true';
    
    let page = 1;
    let limit = 50;
    
    if (!all) {
      page = parseInt(url.searchParams.get('page') || '1');
      limit = parseInt(url.searchParams.get('limit') || '50');
    }
    
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (url.searchParams.get('startDate')) {
      startDate = new Date(url.searchParams.get('startDate')!);
    }
    
    if (url.searchParams.get('endDate')) {
      endDate = new Date(url.searchParams.get('endDate')!);
    }
    
    const queryOptions = all 
      ? {}
      : { 
          page, 
          limit, 
          startDate, 
          endDate 
        };
    
    const { analytics, total } = await getAllAnalytics(account_id, link_id, queryOptions);
    
    return NextResponse.json({
      message: "Analytics retrieved successfully",
      success: true,
      analytics,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 });
  } catch (error) {
    logger.error('Analytics retrieval error:', { error, url: req.url });
    return NextResponse.json({
      message: "Failed to retrieve analytics",
      success: false,
    }, { status: 500 });
  }
}

// Delete analytics record
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.accountId) {
      logger.info('Analytics deletion request failed due to unauthorized access', { url: req.url });
      return NextResponse.json({
        message: "Unauthorized. Please sign in first.",
        success: false,
      }, { status: 401 });
    }
    
    const account_id = session.user.accountId;
    let link_id, analytics_id, delete_all;
    
    try {
      const contentType = req.headers.get('content-type');
      if (contentType && contentType.includes('application/json') && req.body) {
        const body = await req.json();
        link_id = body.link_id;
        analytics_id = body.analytics_id;
        delete_all = body.delete_all;
      }
    } catch {
      logger.info('Analytics deletion request failed due to missing parameters', { url: req.url });
      return NextResponse.json({
        message: "Missing required parameters",
        success: false,
      }, { status: 400 });
    }
    
    if (!link_id) {
      logger.info('Analytics deletion request failed due to missing link_id', { account_id, url: req.url });
      return NextResponse.json({
        message: "Missing link_id parameter",
        success: false,
      }, { status: 400 });
    }
    
    // Delete all analytics for a link
    if (delete_all) {
      const result = await removeAllAnalytics(account_id, link_id);
      
      if (result.success) {
        logger.info('All analytics deletion request succeeded', { account_id, link_id, url: req.url });
        return NextResponse.json({
          message: "All analytics records deleted successfully",
          success: true,
        }, { status: 200 });
      } else {
        logger.info('All analytics deletion request failed', { error: result.status, account_id, link_id, url: req.url });
        return NextResponse.json({
          message: result.status,
          success: false,
        }, { status: 404 });
      }
    }
    
    // Delete single analytics record
    if (!analytics_id) {
      logger.info('Analytics deletion request failed due to missing analytics_id', { account_id, link_id, url: req.url });
      return NextResponse.json({
        message: "Missing analytics_id parameter for single record deletion",
        success: false,
      }, { status: 400 });
    }
    
    const result = await removeAnalytics(account_id, link_id, analytics_id);
    
    if (result.success) {
      logger.info('Single analytics record deletion request succeeded', { 
        account_id, 
        link_id, 
        analytics_id, 
        url: req.url 
      });
      return NextResponse.json({
        message: "Analytics record deleted successfully",
        success: true,
      }, { status: 200 });
    } else {
      logger.info('Single analytics record deletion request failed', { 
        error: result.status, 
        account_id, 
        link_id, 
        analytics_id, 
        url: req.url 
      });
      return NextResponse.json({
        message: result.status,
        success: false,
      }, { status: 404 });
    }
  } catch (error) {
    logger.error('Analytics deletion error:', { error, url: req.url });
    return NextResponse.json({
      message: "Failed to delete analytics",
      success: false,
    }, { status: 500 });
  }
}