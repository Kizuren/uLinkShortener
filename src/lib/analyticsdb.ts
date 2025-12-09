import { DetailedReturn } from '@/types/global';
import { getMongo, Collection, safeObjectId } from './mongodb';
import type { IPAddress, Analytics } from '@/types/analytics';

const ONE_WEEK = 1000 * 60 * 60 * 24 * 7;

export async function getIPData(ip: string): Promise<IPAddress> {
  try {
    const { db } = await getMongo();
    const collection = db.collection<IPAddress>(Collection.ip_addresses_collection);

    const existing = await collection.findOne({ ip_address: ip });

    if (existing && Date.now() - new Date(existing.timestamp).getTime() < ONE_WEEK) {
      return existing;
    }

    // Fetch new data from ipwho.is
    const res = await fetch(`https://ipwho.is/${ip}`);
    if (!res.ok) throw new Error('Failed to fetch IP data');
    const data = await res.json();

    const ipData: IPAddress = {
      ip_address: ip,
      ip_version: ip.includes(':') ? 'IPv6' : 'IPv4',
      isp: data.connection?.isp || 'Unknown',
      country: data.country || 'Unknown',
      timestamp: new Date(),
    };

    await collection.updateOne({ ip_address: ip }, { $set: ipData }, { upsert: true });

    return ipData;
  } catch {
    return {
      ip_address: ip,
      ip_version: ip.includes(':') ? 'IPv6' : 'IPv4',
      isp: 'Unknown',
      country: 'Unknown',
      timestamp: new Date(),
    };
  }
}

export interface AnalyticsQueryOptions {
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export async function getAllAnalytics(
  account_id: string,
  link_id: string,
  query_options: AnalyticsQueryOptions = {}
): Promise<{ analytics: Analytics[]; total: number }> {
  try {
    const { db } = await getMongo();
    const collection = db.collection<Analytics>(Collection.analytics_collection);

    const { startDate, endDate, page = 1, limit = 50 } = query_options;
    const timestamp: Record<string, Date> = {};
    if (startDate) timestamp['$gte'] = startDate;
    if (endDate) timestamp['$lte'] = endDate;

    // Overcomplicated shit
    const query: Omit<Partial<Analytics>, 'timestamp'> & { timestamp?: Record<string, Date> } = {
      account_id,
      link_id,
    };
    if (Object.keys(timestamp).length > 0) {
      query.timestamp = timestamp;
    }

    const cursor = collection
      .find(query)
      .sort({ timestamp: -1 }) // Most recent first
      .skip((page - 1) * limit)
      .limit(limit);

    const analytics = await cursor.toArray();
    const total = await collection.countDocuments(query);

    return { analytics, total };
  } catch {
    return { analytics: [], total: 0 };
  }
}

export async function saveAnalytics(analytics: Analytics): Promise<DetailedReturn> {
  try {
    const { db } = await getMongo();
    const collection = db.collection<Analytics>(Collection.analytics_collection);
    await collection.insertOne(analytics);

    return { success: true, status: 'Analytics successfully saved' };
  } catch {
    return { success: false, status: 'An exception occured' };
  }
}

export async function removeAllAnalytics(
  account_id: string,
  link_id: string
): Promise<DetailedReturn> {
  try {
    const { db } = await getMongo();
    const collection = db.collection<Analytics>(Collection.analytics_collection);
    const result = await collection.deleteMany({ account_id: account_id, link_id: link_id });
    const success = result.deletedCount > 0;

    return {
      success,
      status: success ? 'Analytics were successfully deleted' : 'No analytics found',
    };
  } catch {
    return { success: false, status: 'An exception occured' };
  }
}

export async function removeAllAnalyticsFromUser(account_id: string): Promise<DetailedReturn> {
  try {
    const { db } = await getMongo();
    const collection = db.collection<Analytics>(Collection.analytics_collection);
    const result = await collection.deleteMany({ account_id: account_id });
    const hasRemovedAnalytics = result.deletedCount > 0;

    return {
      success: true,
      status: hasRemovedAnalytics
        ? 'All analytics were successfully removed'
        : 'No analytics found',
    };
  } catch {
    return { success: false, status: 'An exception occured' };
  }
}

export async function removeAnalytics(
  account_id: string,
  link_id: string,
  _id: string
): Promise<DetailedReturn> {
  const objectId = safeObjectId(_id);
  if (!objectId) return { success: false, status: 'Invalid object ID' };

  try {
    const { db } = await getMongo();
    const collection = db.collection<Analytics>(Collection.analytics_collection);
    await collection.deleteOne({ _id: objectId, account_id: account_id, link_id: link_id });

    return { success: true, status: 'Analytics successfully removed' };
  } catch {
    return { success: false, status: 'An exception occured' };
  }
}
