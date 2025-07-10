import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserById } from '@/lib/userdb';
import logger from '@/lib/logger';
import { sanitizeMongoDocument } from '@/lib/utils';

export async function GET(
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
    
    const { accountId } = await params;
    
    if (!accountId) {
      return NextResponse.json({
        message: "Account ID is required",
        success: false,
      }, { status: 400 });
    }
    
    const user = await getUserById(accountId);
    
    if (!user) {
      return NextResponse.json({
        message: "User not found",
        success: false,
      }, { status: 404 });
    }
    
    const sanitizedUser = sanitizeMongoDocument(user);
    
    return NextResponse.json({
      user: sanitizedUser,
      success: true,
    });
  } catch (error) {
    logger.error('Error getting user:', error);
    return NextResponse.json({
      message: "Failed to retrieve user",
      success: false,
    }, { status: 500 });
  }
}