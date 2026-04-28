'use server';

import Watchlist from "@/database/models/watchlist.model";
import { connectToDatabase } from "@/database/mongoose";

export const getWatchlistSymbolsByEmail = async (email: string): Promise<string[]> => {
  try {
    if (!email) return [];

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection is not available");

    const user = await db
      .collection("user")
      .findOne({ email });

    if (!user) return [];

    type UserRecord = { id?: string; _id?: { toString: () => string } };
    const userRecord = user as UserRecord;
    const userId = userRecord.id || userRecord._id?.toString() || "";

    if (!userId) return [];

    const watchlistItems = await Watchlist.find({ userId })
      .select({ symbol: 1, _id: 0 })
      .lean<{ symbol: string }[]>();

    return watchlistItems.map((item) => item.symbol);
  } catch (error) {
    console.error("Error fetching watchlist symbols by email", error);
    return [];
  }
};
