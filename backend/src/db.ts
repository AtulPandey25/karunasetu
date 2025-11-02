import mongoose from "mongoose";

let isConnected = false;

export async function connectMongo(uri?: string) {
  const mongoUri = uri || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn(
      "MongoDB URI not set. Running with in-memory fallback. Set MONGODB_URI to enable persistence.",
    );
    return { connected: false } as const;
  }
  if (isConnected) return { connected: true } as const;
  try {
    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB || undefined,
    });
    isConnected = true;
    console.log("✅ Connected to MongoDB");
    return { connected: true } as const;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    return { connected: false } as const;
  }
}
