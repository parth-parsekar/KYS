import mongoose from 'mongoose';

let mongod: any = null;

// Lifecycle listeners for connection resiliency
mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB Resilience] Connection lost. Buffering queries while awaiting reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB Resilience] Successfully reconnected to MongoDB.');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB Resilience] Connection error:', err.message);
});

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log('Connecting to provided MongoDB URI...');
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log('MongoDB connected successfully to external instance.');
      return mongoose;
    } catch (err: any) {
      console.warn('Failed to connect to provided MONGODB_URI. Falling back to embedded MongoMemoryServer.', err.message || err);
    }
  }

  console.log('Starting in-memory MongoDB server for zero-configuration operation...');
  try {
    // @ts-ignore
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    const memUri = mongod.getUri();
    await mongoose.connect(memUri);
    console.log(`In-memory MongoDB connected at ${memUri}`);
    return mongoose;
  } catch (memErr) {
    throw new Error('No MONGODB_URI provided and in-memory MongoDB is not available in production.');
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
}

