import { getMongo, Collection } from './mongodb';
import { generateLinkID, isValidUrl } from './utils';
import type { Link } from '@/types/link';
import type { DetailedReturn } from '@/types/global';

export async function getLinks(
  account_id: string
): Promise<{ links: Link[]; return: DetailedReturn }> {
  try {
    const { db } = await getMongo();
    const collection = db.collection<Link>(Collection.links_collection);

    const links = await collection.find({ account_id }).sort({ created_at: -1 }).toArray();

    return { links, return: { success: true, status: 'Links retrieved successfully' } };
  } catch {
    return { links: [], return: { success: false, status: 'An exception occurred' } };
  }
}

export async function getTargetUrl(
  short_id: string
): Promise<{ target_url: string; account_id: string }> {
  try {
    const { db } = await getMongo();
    const collection = db.collection<Link>(Collection.links_collection);
    const found_link = await collection.findOne({ short_id: short_id });

    if (!found_link) return { target_url: '', account_id: '' };

    return {
      target_url: found_link.target_url,
      account_id: found_link.account_id,
    };
  } catch {
    return { target_url: '', account_id: '' };
  }
}

export async function getLinkById(
  account_id: string,
  short_id: string
): Promise<{ link: Link | null; return: DetailedReturn }> {
  try {
    const { db } = await getMongo();
    const collection = db.collection<Link>(Collection.links_collection);

    const link = await collection.findOne({ short_id, account_id });

    if (!link) {
      return {
        link: null,
        return: {
          success: false,
          status: "Link not found or you don't have permission to view it",
        },
      };
    }

    return { link, return: { success: true, status: 'Link retrieved successfully' } };
  } catch {
    return { link: null, return: { success: false, status: 'An exception occurred' } };
  }
}

export async function createLink(
  account_id: string,
  target_url: string
): Promise<{ shortId: string | null; return: DetailedReturn }> {
  try {
    if (!isValidUrl(target_url))
      return { shortId: null, return: { success: false, status: 'Invalid target URL' } };

    const { db } = await getMongo();
    const collection = db.collection<Link>(Collection.links_collection);

    let shortId;
    let duplicate = true;
    do {
      shortId = generateLinkID();
      const existing = await collection.findOne({ short_id: shortId });
      duplicate = existing !== null;
    } while (duplicate);

    const newLink: Link = {
      short_id: shortId,
      target_url: target_url,
      account_id: account_id,
      created_at: new Date(),
      last_modified: new Date(),
    };

    await collection.insertOne(newLink);
    return { shortId, return: { success: true, status: 'Link was successfully created' } };
  } catch {
    return { shortId: null, return: { success: false, status: 'An exception occured' } };
  }
}

export async function editLink(
  account_id: string,
  short_id: string,
  target_url: string
): Promise<DetailedReturn> {
  try {
    const { db } = await getMongo();
    const collection = db.collection<Link>(Collection.links_collection);

    const result = await collection.updateOne(
      { account_id: account_id, short_id: short_id },
      {
        $set: {
          target_url: target_url,
          last_modified: new Date(),
        },
      }
    );

    const success = result.modifiedCount > 0;

    return { success, status: success ? 'Link was successfully updated' : 'Link not found' };
  } catch {
    return { success: false, status: 'An exception occured' };
  }
}

export async function removeLink(account_id: string, short_id: string): Promise<DetailedReturn> {
  try {
    const { db } = await getMongo();
    const collection = db.collection<Link>(Collection.links_collection);
    const result = await collection.deleteOne({ account_id: account_id, short_id: short_id });
    const success = result.deletedCount > 0;

    return { success, status: success ? 'Link was successfully removed' : 'Link not found' };
  } catch {
    return { success: false, status: 'An exception occured' };
  }
}

export async function removeAllLinksFromUser(account_id: string): Promise<DetailedReturn> {
  try {
    const { db } = await getMongo();
    const collection = db.collection<Link>(Collection.links_collection);
    const result = await collection.deleteMany({ account_id: account_id });
    const hasRemovedLinks = result.deletedCount > 0;

    // Here it doesn't matter if no links were removed
    return {
      success: true,
      status: hasRemovedLinks ? 'Links were successfully removed' : 'No Links found',
    };
  } catch {
    return { success: false, status: 'An exception occured' };
  }
}
