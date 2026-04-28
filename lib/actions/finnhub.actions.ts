'use server';

import { formatArticle, getDateRange, validateArticle } from "@/lib/utils";

 const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
 const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "";

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
  `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;

const buildMarketNewsUrl = () =>
  `${FINNHUB_BASE_URL}/news?category=general&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;

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
    if (!NEXT_PUBLIC_FINNHUB_API_KEY) {
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

    for (let i = 0; i < 6; i += 1) {
      const symbol = cleanedSymbols[i % cleanedSymbols.length];
      const url = buildCompanyNewsUrl(symbol, from, to);
      const articles = await fetchJSON<RawNewsArticle[]>(url);
      const candidate = articles.find((article) => {
        if (!validateArticle(article)) return false;
        const key = `${article.id}|${article.url}|${article.headline}`;
        return !seenKeys.has(key);
      });

      if (!candidate) continue;

      const key = `${candidate.id}|${candidate.url}|${candidate.headline}`;
      seenKeys.add(key);
      collected.push(formatArticle(candidate, true, symbol, i));
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
