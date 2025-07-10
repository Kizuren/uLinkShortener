import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { isSessionValid } from '@/lib/sessiondb';
import logger from '@/lib/logger';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.accountId || !session?.user?.sessionId) {
      return NextResponse.json({
        valid: false,
        message: "No active session"
      }, { status: 401 });
    }
    
    const isValid = await isSessionValid(
      session.user.sessionId, 
      session.user.accountId
    );
    
    if (!isValid) {
      logger.info('Session check failed - revoked or expired session', { 
        sessionId: session.user.sessionId,
        accountId: session.user.accountId 
      });
      
      return NextResponse.json({
        valid: false,
        message: "Session has been revoked"
      }, { status: 401 });
    }
    
    return NextResponse.json({ valid: true });
  } catch (error) {
    logger.error('Error checking session:', error);
    return NextResponse.json({
      valid: false,
      message: "Error checking session"
    }, { status: 500 });
  }
}