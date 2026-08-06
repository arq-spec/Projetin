import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export function getMongoUri(): string | undefined {
  return (
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    process.env.MONGODB_URL ||
    process.env.MONGO_URI ||
    process.env.DATABASE_URL
  );
}

let isConnecting = false;

export async function connectToDatabase(): Promise<boolean> {
  if ((mongoose.connection.readyState as number) === 1) {
    return true;
  }

  const uri = getMongoUri();
  if (!uri) {
    return false;
  }

  if (isConnecting) {
    // Wait briefly for existing connection attempt to finalize
    let attempts = 0;
    while (isConnecting && attempts < 20) {
      await new Promise(res => setTimeout(res, 250));
      attempts++;
      if ((mongoose.connection.readyState as number) === 1) return true;
    }
  }

  try {
    isConnecting = true;
    console.log('[MongoDB] Connecting to MongoDB instance...');
    
    await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });

    const connected = (mongoose.connection.readyState as number) === 1;
    if (connected) {
      const dbName = mongoose.connection.db ? mongoose.connection.db.databaseName : 'default';
      console.log(`[MongoDB] Connection established successfully to database: ${dbName}`);
    }
    return connected;
  } catch (error: any) {
    console.warn('[MongoDB] Connection error (falling back to server memory):', error?.message || error);
    return false;
  } finally {
    isConnecting = false;
  }
}

export async function disconnectFromDatabase() {
  if ((mongoose.connection.readyState as number) === 0) return;
  await mongoose.disconnect();
  console.log('[MongoDB] Disconnected successfully');
}



