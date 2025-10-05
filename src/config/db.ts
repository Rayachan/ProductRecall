import mongoose from 'mongoose';
import { env } from './env';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer: MongoMemoryServer | null = null;

export async function connectMongo(): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  if (env.mongoInMemory) {
    memoryServer = await MongoMemoryServer.create();
    const uri = memoryServer.getUri();
    return mongoose.connect(uri);
  }
  return mongoose.connect(env.mongoUri);
}
