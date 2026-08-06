import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) {
    return;
  }

  if (!MONGODB_URI) {
    console.log('[MongoDB] MONGODB_URI not configured in environment variables. Using server storage.');
    return;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
    });

    isConnected = db.connections[0].readyState === 1;
    console.log('[MongoDB] Connection established successfully');
  } catch (error: any) {
    console.warn('[MongoDB] Connection error (falling back to server storage):', error?.message || error);
    isConnected = false;
  }
}

export async function disconnectFromDatabase() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('[MongoDB] Disconnected successfully');
}

