'use server';

import { formatArticle, getDateRange, validateArticle } from "@/lib/utils";

 const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
 const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY ?? "";

const fetchJSON = async <T>(url: string, revalidateSeconds?: number): Promise<T> => {
  const response = await fetch(url, {
    cache: revalidateSeconds ? "force-cache" : "no-store",
    next: revalidateSeconds ? { revalidate: revalidateSeconds } : undefined,
  });

  if (!response.ok) {
    throw new Error(`Finnhub request failed: ${response.status}`);
  }

  return (await response.json()) as T;
};

const buildCompanyNewsUrl = (symbol: string, from: string, to: string) =>
  `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;

const buildMarketNewsUrl = () =>
  `${FINNHUB_BASE_URL}/news?category=general&token=${FINNHUB_API_KEY}`;

const getGeneralNews = async (): Promise<MarketNewsArticle[]> => {
  const rawArticles = await fetchJSON<RawNewsArticle[]>(buildMarketNewsUrl());
  const deduped = new Map<string, RawNewsArticle>();

  rawArticles.forEach((article) => {
    if (!validateArticle(article)) return;
    const key = `${article.id}|${article.url}|${article.headline}`;
    if (!deduped.has(key)) deduped.set(key, article);
  });

  return Array.from(deduped.values())
    .sort((a, b) => (b.datetime ?? 0) - (a.datetime ?? 0))
    .slice(0, 6)
    .map((article, index) => formatArticle(article, false, undefined, index));
};

export const getNews = async (symbols?: string[]): Promise<MarketNewsArticle[]> => {
  try {
    if (!FINNHUB_API_KEY) {
      throw new Error("Finnhub API key is missing");
    }

    const { from, to } = getDateRange(5);
    const cleanedSymbols = (symbols ?? [])
      .map((symbol) => symbol.trim().toUpperCase())
      .filter((symbol) => symbol.length > 0);

    if (cleanedSymbols.length === 0) {
      return await getGeneralNews();
    }

    const collected: MarketNewsArticle[] = [];
    const seenKeys = new Set<string>();
    const uniqueSymbols = Array.from(new Set(cleanedSymbols));

    for (const symbol of uniqueSymbols) {
      const url = buildCompanyNewsUrl(symbol, from, to);
      const articles = await fetchJSON<RawNewsArticle[]>(url);

      for (const article of articles) {
        if (collected.length >= 6) break;
        if (!validateArticle(article)) continue;

        const key = `${article.id}|${article.url}|${article.headline}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          collected.push(formatArticle(article, true, symbol, collected.length));
        }
      }

      if (collected.length >= 6) break;
    }

    if (collected.length === 0) {
      return await getGeneralNews();
    }

    return collected.sort((a, b) => b.datetime - a.datetime);
  } catch (error) {
    console.error("Error fetching news", error);
    throw new Error("Failed to fetch news");
  }
};
