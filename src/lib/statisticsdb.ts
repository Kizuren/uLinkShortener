import { getMongo, Collection } from './mongodb';
import { formatOSStrings } from './utils';
import type { Stats, StatItem } from '@/types/statistics';
import type { Analytics } from '@/types/analytics';
import type { Link } from '@/types/link';
import { DetailedReturn } from '@/types/global';

export async function getAllStats(): Promise<Stats | null> {
  try {
    const { db } = await getMongo();
    const statsCollection = db.collection<Stats>(Collection.statistics_collection);

    // We have only one item in this collection!!!
    // Is it dumb? most probably yes, but it's better than searching on every request
    const stats = await statsCollection.findOne();
    return stats ?? null;
  } catch {
    return null;
  }
}

export async function updateStats(): Promise<DetailedReturn> {
  try {
    const { db } = await getMongo();
    const statisticsCollection = db.collection<Stats>(Collection.statistics_collection);
    
    // Get and update the data
    const analyticsCollection = db.collection<Analytics>(Collection.analytics_collection);
    const total_links = await db.collection<Link>(Collection.links_collection).countDocuments();
    const total_clicks = await analyticsCollection.countDocuments();
    const ipv6_count = await analyticsCollection.countDocuments({ip_version: 'IPv6'});

    const ip_versions: StatItem[] = [
      { id: 'IPv4', count: total_clicks - ipv6_count },
      { id: 'IPv6', count: ipv6_count },
    ];

    const os_stats_raw = await analyticsCollection.aggregate<StatItem>([
      { $group: { _id: "$platform", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { id: "$_id", count: 1, _id: 0 } }
    ]).toArray();

    const os_stats = os_stats_raw.map(item => ({
      id: formatOSStrings(item.id),
      count: item.count
    }));

    const country_stats = await analyticsCollection.aggregate<StatItem>([
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { id: "$_id", count: 1, _id: 0 } }
    ]).toArray();

    const isp_stats = await analyticsCollection.aggregate<StatItem>([
      { $group: { _id: "$ip_data.isp", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { id: "$_id", count: 1, _id: 0 } }
    ]).toArray();

    const newStats: Stats = {
      total_links,
      total_clicks,
      chart_data: {
        ip_versions,
        os_stats,
        country_stats,
        isp_stats
      },
      last_updated: new Date(),
    };

    const result = await statisticsCollection.replaceOne({}, newStats, { upsert: true });
    const success = result.modifiedCount > 0;

    return { success, status: success ? "Stats successfully updated" : "Failed to update stats" };
  } catch {
    return { success: false, status: "An exception occurred" };
  }
}