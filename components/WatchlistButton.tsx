'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toggleWatchlistAction } from '@/lib/actions/watchlist.actions';
import { toast } from 'sonner';

export default function WatchlistButton({ symbol, company, isInWatchlist }: WatchlistButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const result = await toggleWatchlistAction(symbol, company);
      if (result.success) {
        toast.success(
          result.isAdded 
            ? `${symbol} added to watchlist` 
            : `${symbol} removed from watchlist`
        );
      } else {
        toast.error(result.error || 'Failed to update watchlist');
      }
    } catch (e) {
      toast.error('An error occurred while updating the watchlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      className={`watchlist-btn ${isInWatchlist ? 'watchlist-remove' : ''}`}
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? 'Processing...' : (isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist')}
    </Button>
  );
}
