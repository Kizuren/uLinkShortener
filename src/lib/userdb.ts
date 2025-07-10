import { getMongo, Collection } from './mongodb';
import { generateAccountID } from './utils';
import { removeAllAnalyticsFromUser } from './analyticsdb';
import { removeAllLinksFromUser } from './linkdb';
import { removeAllSessionsByAccountId } from './sessiondb';
import type { User } from '@/types/user';
import type { DetailedReturn } from '@/types/global';
import type { Filter } from 'mongodb';

export interface UserQueryOptions {
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export async function isUserAdmin(account_id: string): Promise<boolean> {
  try {
    const { db } = await getMongo();
    const collection = db.collection<User>(Collection.user_collection);

    const user = await collection.findOne({account_id: account_id});

    return user?.is_admin ?? false;
  } catch {
    return false;
  }
}

export async function makeUserAdmin(account_id: string, admin: boolean): Promise<DetailedReturn> {
  try {
    const { db } = await getMongo();
    const collection = db.collection<User>(Collection.user_collection);

    const result = await collection.updateOne(
      { account_id: account_id },
      { $set: { is_admin: admin } }
    );

    if (result.matchedCount === 0) {
      return { success: false, status: "User not found" };
    }

    return { 
      success: result.modifiedCount > 0, 
      status: result.modifiedCount > 0 
        ? `User is now ${admin ? 'an admin' : 'no longer an admin'}`
        : "No changes were made"
    };
  } catch (error) {
    console.error('Error toggling admin status:', error);
    return { success: false, status: "An exception occurred" };
  }
}

export async function existsUser(account_id: string) : Promise<boolean> {
  try {
    const { db } = await getMongo();
    const collection = db.collection<User>(Collection.user_collection);

    const user = await collection.findOne({account_id: account_id});

    return user !== null;
  } catch {
    return false;
  }
}

export async function createUser(is_admin: boolean): Promise<{account_id: string, return: DetailedReturn}> {
  try {
    const { db } = await getMongo();
    const collection = db.collection<User>(Collection.user_collection);

    let account_id;
    let duplicate;
    do {
      account_id = generateAccountID();
      const existing = await collection.findOne({ account_id: account_id });
      duplicate = existing !== null;
    } while (duplicate);

    const newUser: User = {
        account_id: account_id,
        is_admin: is_admin,
        created_at: new Date()
    };

    const result = await collection.insertOne(newUser);
    if(!result.acknowledged) return { account_id: "", return: {success: false, status: "An error occured"} };

    return { account_id, return: {success: true, status: "User was successfully created"} };
  } catch {
    return { account_id: "", return: {success: false, status: "An exception occured"} };
  }
}

export async function removeUser(account_id: string): Promise<DetailedReturn> {
  try {
    const { db } = await getMongo();
    const collection = db.collection<User>(Collection.user_collection);

    const result = await collection.deleteOne({account_id: account_id});
    const removeAnalyticsResult = await removeAllAnalyticsFromUser(account_id);
    const removeLinksResult = await removeAllLinksFromUser(account_id);
    await removeAllSessionsByAccountId(account_id);
    const success = result.deletedCount > 0 && removeAnalyticsResult.success && removeLinksResult.success;

    return { success: success, status: success ? "User successfully deleted" : "An error occured" };
  } catch {
    return { success: false, status: "An exception occured" };
  }
}

export async function getUserById(account_id: string): Promise<User | null> {
  try {
    const { db } = await getMongo();
    const collection = db.collection<User>(Collection.user_collection);
    
    const user = await collection.findOne({ account_id });
    return user;
  } catch {
    return null;
  }
}

export async function listUsers(query_options: UserQueryOptions = {}): Promise<{users: User[] | null, total: number, return: DetailedReturn}> {
  try {
    const { db } = await getMongo();
    const collection = db.collection<User>(Collection.user_collection);

    const { startDate, endDate, search, page = 1, limit = 50 } = query_options;
    const query: Filter<User> = {};

    if (startDate || endDate) {
      query.created_at = {};
      if (startDate) query.created_at.$gte = startDate;
      if (endDate) query.created_at.$lte = endDate;
    }

    if (search && search.trim() !== "") {
      query.account_id = { $regex: new RegExp(search, "i") };
    }

    const cursor = collection
    .find(query)
    .sort({ created_at: -1 }) // Most recent first
    .skip((page - 1) * limit)
    .limit(limit);

    const users = await cursor.toArray();
    const total = await collection.countDocuments(query);

    return { users: users, total: total, return: {success: true, status: "Users successfully fetched"} };
  } catch {
    return { users: null, total: 0, return: {success: false, status: "An exception occured"} };
  }
}