import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { isUserAdmin, makeUserAdmin } from '@/lib/userdb';
import { removeAllSessionsByAccountId } from '@/lib/sessiondb';
import logger from '@/lib/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({
        message: "Unauthorized",
        success: false,
      }, { status: 401 });
    }
    
    const { accountId } = params;
    
    if (!accountId) {
      return NextResponse.json({
        message: "Account ID is required",
        success: false,
      }, { status: 400 });
    }
    
    if (accountId === session.user.accountId) {
      return NextResponse.json({
        message: "You cannot change your own admin status",
        success: false,
      }, { status: 400 });
    }
    
    const isAdmin = await isUserAdmin(accountId);
    const result = await makeUserAdmin(accountId, !isAdmin);
    
    if (!result.success) {
      return NextResponse.json({
        message: result.status,
        success: false,
      }, { status: result.status === "User not found" ? 404 : 500 });
    }
    
    await removeAllSessionsByAccountId(accountId);
    
    logger.info(`Admin status toggled for user ${accountId}, all sessions revoked`, { 
      accountId, 
      newStatus: !isAdmin 
    });
    
    return NextResponse.json({
      message: `${result.status} User will need to log in again.`,
      is_admin: !isAdmin,
      success: true,
    });
  } catch (error) {
    logger.error('Error toggling admin status:', { error });
    return NextResponse.json({
      message: "Failed to toggle admin status",
      success: false,
    }, { status: 500 });
  }
}