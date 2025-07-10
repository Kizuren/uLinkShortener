import { Db, MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGO_URI!;
const dbName = process.env.MONGO_DB_NAME!;

if (!process.env.MONGO_URI) {
  throw new Error('Please add your MongoDB URI to .env');
}
if (!process.env.MONGO_DB_NAME) {
  throw new Error('Please add your MongoDB DB name to .env');
}

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

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);

  return { client, db };
}

export function safeObjectId(id: string): ObjectId | null {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}