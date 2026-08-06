import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/frello';

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) {
    console.log('[MongoDB] Using existing database connection');
    return;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI, {
      autoIndex: true, // Auto-build indexes
    });

    isConnected = db.connections[0].readyState === 1;
    console.log('[MongoDB] Connection established successfully');
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    throw new Error('Failed to connect to MongoDB database.');
  }
}

export async function disconnectFromDatabase() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('[MongoDB] Disconnected successfully');
}
