import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { listUsers, removeUser, isUserAdmin } from '@/lib/userdb';
import { sanitizeMongoDocument } from '@/lib/utils';
import logger from '@/lib/logger';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({
        message: "Unauthorized",
        success: false,
      }, { status: 401 });
    }
    
    const result = await listUsers();
    
    if (result.users) {
      const sanitizedUsers = result.users.map(user => (sanitizeMongoDocument(user)));
      
      return NextResponse.json({
        users: sanitizedUsers,
        total: result.total,
        success: true,
      });
    }
    
    return NextResponse.json({
      message: result.return.status,
      success: result.return.success,
    }, { status: result.return.success ? 200 : 500 });
  } catch (error) {
    logger.error('Error getting users:', { error });
    return NextResponse.json({
      message: "Failed to retrieve users",
      success: false,
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({
        message: "Unauthorized",
        success: false,
      }, { status: 401 });
    }
    
    const { account_id } = await req.json();
    
    if (!account_id) {
      return NextResponse.json({
        message: "Account ID is required",
        success: false,
      }, { status: 400 });
    }
    
    if (account_id === session.user.accountId) {
      return NextResponse.json({
        message: "You cannot delete your own account from admin panel",
        success: false,
      }, { status: 400 });
    }
    
    if (await isUserAdmin(account_id)) {
      return NextResponse.json({
        message: "Cannot delete admin accounts",
        success: false,
      }, { status: 400 });
    }
    
    const result = await removeUser(account_id);
    
    return NextResponse.json({
      message: result.status,
      success: result.success,
    });
  } catch (error) {
    logger.error('Error deleting user:', { error });
    return NextResponse.json({
      message: "Failed to delete user",
      success: false,
    }, { status: 500 });
  }
}