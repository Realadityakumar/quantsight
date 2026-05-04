import React from 'react';
import TradingViewWidget from '@/components/TradingViewWidget';
import WatchlistButton from '@/components/WatchlistButton';
import { isStockInWatchlist } from '@/lib/actions/watchlist.actions';
import {
  SYMBOL_INFO_WIDGET_CONFIG,
  CANDLE_CHART_WIDGET_CONFIG,
  BASELINE_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
} from '@/lib/constants';

export default async function StockDetails({ params }: StockDetailsPageProps) {
  const { symbol } = await params;
  const decodedSymbol = decodeURIComponent(symbol);
  const scriptUrl = 'https://s3.tradingview.com/external-embedding/embed-widget-';
  const inWatchlist = await isStockInWatchlist(decodedSymbol);

  return (
    <div className="stock-details-container px-4 py-8 max-w-7xl mx-auto w-full grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
      {/* Left Column */}
      <div className="xl:col-span-2 space-y-6 sm:space-y-8 flex flex-col">
        <TradingViewWidget
          scriptUrl={`${scriptUrl}symbol-info.js`}
          config={SYMBOL_INFO_WIDGET_CONFIG(decodedSymbol)}
          className="custom-chart h-auto min-h-42.5 w-full"
          height={170}
        />
        // Main Chart
        <TradingViewWidget
          scriptUrl={`${scriptUrl}advanced-chart.js`}
          config={CANDLE_CHART_WIDGET_CONFIG(decodedSymbol)}
          className="custom-chart w-full"
          height={600}
        />
        // Baseline Chart
        <TradingViewWidget
          scriptUrl={`${scriptUrl}advanced-chart.js`}
          config={BASELINE_WIDGET_CONFIG(decodedSymbol)}
          className="custom-chart w-full"
          height={600}
        />
      </div>
    
      {/* Right Column */}
      <div className="xl:col-span-1 space-y-6 sm:space-y-8 flex flex-col">
        <WatchlistButton 
          symbol={decodedSymbol} 
          company={decodedSymbol} 
          isInWatchlist={false} 
        />
        // Technical Analysis Widget
        <TradingViewWidget
          scriptUrl={`${scriptUrl}technical-analysis.js`}
          config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(decodedSymbol)}
          className="custom-chart w-full"
          height={400}
        />

        <TradingViewWidget
          scriptUrl={`${scriptUrl}symbol-profile.js`}
          config={COMPANY_PROFILE_WIDGET_CONFIG(decodedSymbol)}
          className="custom-chart w-full"
          height={440}
        />

        <TradingViewWidget
          scriptUrl={`${scriptUrl}financials.js`}
          config={COMPANY_FINANCIALS_WIDGET_CONFIG(decodedSymbol)}
          className="custom-chart w-full"
          height={464}
        />
      </div>
    </div>
  );
}
