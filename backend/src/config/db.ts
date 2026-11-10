import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | null = null;

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log('Connecting to provided MongoDB URI...');
      await mongoose.connect(uri);
      console.log('MongoDB connected successfully to external instance.');
      return mongoose;
    } catch (err) {
      console.warn('Failed to connect to provided MONGODB_URI. Falling back to embedded MongoMemoryServer.', err);
    }
  }

  console.log('Starting in-memory MongoDB server for zero-configuration operation...');
  mongod = await MongoMemoryServer.create();
  const memUri = mongod.getUri();
  await mongoose.connect(memUri);
  console.log(`In-memory MongoDB connected at ${memUri}`);
  return mongoose;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
}

