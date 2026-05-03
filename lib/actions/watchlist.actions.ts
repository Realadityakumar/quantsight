'use server';

import Watchlist from "@/database/models/watchlist.model";
import { connectToDatabase } from "@/database/mongoose";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

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

export const isStockInWatchlist = async (symbol: string): Promise<boolean> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return false;

    await connectToDatabase();
    const item = await Watchlist.findOne({ 
      userId: session.user.id, 
      symbol: symbol.toUpperCase() 
    });
    return !!item;
  } catch (error) {
    console.error('Error checking watchlist status:', error);
    return false;
  }
};

export const toggleWatchlistAction = async (symbol: string, company: string): Promise<{ success: boolean; isAdded: boolean; error?: string }> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, isAdded: false, error: 'Unauthorized' };

    await connectToDatabase();
    const existing = await Watchlist.findOne({ 
      userId: session.user.id, 
      symbol: symbol.toUpperCase() 
    });

    if (existing) {
      await Watchlist.deleteOne({ _id: existing._id });
      revalidatePath(`/stocks/${symbol}`);
      return { success: true, isAdded: false };
    } else {
      await Watchlist.create({
        userId: session.user.id,
        symbol: symbol.toUpperCase(),
        company: company || symbol,
      });
      revalidatePath(`/stocks/${symbol}`);
      return { success: true, isAdded: true };
    }
  } catch (error) {
    console.error('Failed to toggle watchlist:', error);
    return { success: false, isAdded: false, error: 'Failed to update watchlist' };
  }
};
