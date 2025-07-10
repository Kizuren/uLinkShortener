import { Db, MongoClient, ObjectId } from "mongodb";

let client: MongoClient;
let db: Db;

export const Collection = {
  links_collection: "links",
  analytics_collection: "analytics",
  statistics_collection: "statistics",
  user_collection: "users",
  sessions_collection: "sessions",
  ip_addresses_collection: "ip_addresses"
};

export async function getMongo(): Promise<{ client: MongoClient; db: Db }> {
  if (client && db) {
    return { client, db };
  }
  
  if (!process.env.MONGO_URI) {
    throw new Error('Please add your MongoDB URI to .env');
  }
  if (!process.env.MONGO_DB_NAME) {
    throw new Error('Please add your MongoDB DB name to .env');
  }

  client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  db = client.db(process.env.MONGO_DB_NAME);

  return { client, db };
}

export function safeObjectId(id: string): ObjectId | null {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}