import { getMongo, Collection } from './mongodb';
import type { SessionInfo } from '@/types/session';
import type { DetailedReturn } from '@/types/global';
import { v4 as uuidv4 } from 'uuid';
import logger from '@/lib/logger';

export async function createSession(
  accountId: string,
  userAgent: string,
  ipAddress: string
): Promise<{ sessionId: string; return: DetailedReturn }> {
  try {
    const { db } = await getMongo();
    const collection = db.collection<SessionInfo>(Collection.sessions_collection);

    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(now.getDate() + 30);

    const sessionId = uuidv4();
    const session: SessionInfo = {
      id: sessionId,
      accountId,
      userAgent,
      ipAddress,
      lastActive: now,
      createdAt: now,
      expiresAt,
    };

    await collection.insertOne(session);

    return {
      sessionId,
      return: { success: true, status: 'Session created' },
    };
  } catch (error) {
    logger.error('Error creating session:', error);
    return {
      sessionId: '',
      return: { success: false, status: 'Failed to create session' },
    };
  }
}

export async function isSessionValid(sessionId: string, accountId: string): Promise<boolean> {
  try {
    const { db } = await getMongo();
    const collection = db.collection(Collection.sessions_collection);

    const session = await collection.findOne({
      id: sessionId,
      accountId: accountId,
      revoked: { $ne: true },
    });

    return !!session;
  } catch (error) {
    logger.error('Error checking session validity:', { error, sessionId, accountId });
    return false;
  }
}

export async function getSessions(accountId: string): Promise<SessionInfo[]> {
  try {
    const { db } = await getMongo();
    const collection = db.collection<SessionInfo>(Collection.sessions_collection);

    const sessions = await collection
      .find({
        accountId,
        expiresAt: { $gt: new Date() },
      })
      .sort({ lastActive: -1 })
      .toArray();

    return sessions;
  } catch (error) {
    logger.error('Error getting sessions:', error);
    return [];
  }
}

export async function revokeSession(sessionId: string, accountId: string): Promise<DetailedReturn> {
  try {
    const { db } = await getMongo();
    const collection = db.collection<SessionInfo>(Collection.sessions_collection);

    const result = await collection.deleteOne({
      id: sessionId,
      accountId,
    });

    return {
      success: result.deletedCount > 0,
      status: result.deletedCount > 0 ? 'Session revoked' : 'Session not found',
    };
  } catch (error) {
    logger.error('Error revoking session:', error);
    return {
      success: false,
      status: 'Failed to revoke session',
    };
  }
}

export async function removeAllSessionsByAccountId(accountId: string): Promise<DetailedReturn> {
  try {
    const { db } = await getMongo();
    const collection = db.collection<SessionInfo>(Collection.sessions_collection);

    const result = await collection.deleteMany({
      accountId,
    });

    return {
      success: result.deletedCount > 0,
      status: result.deletedCount > 0 ? 'Sessions terminated' : 'No Sessions found',
    };
  } catch (error) {
    logger.error('Error terminating session:', error);
    return {
      success: false,
      status: 'Failed to terminate session',
    };
  }
}

export async function updateSessionActivity(sessionId: string): Promise<void> {
  try {
    const { db } = await getMongo();
    const collection = db.collection<SessionInfo>(Collection.sessions_collection);

    await collection.updateOne({ id: sessionId }, { $set: { lastActive: new Date() } });
  } catch (error) {
    logger.error('Error updating session activity:', error);
  }
}
