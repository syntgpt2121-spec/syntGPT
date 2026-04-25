import { bypassService, withRetry, RateLimiter } from './bypass.js';
import { webSearchService, SearchResult, SearchResponse } from './webSearch.js';

// Rate limiter for free APIs
const freeApiRateLimiter = new RateLimiter(500, 1500);

export class FreeSearchSources {
  private googleApiKey: string | undefined;
  private googleCx: string | undefined;
  private braveApiKey: string | undefined;
  private tavilyApiKey: string | undefined;
  private dailySearchCount = 0;
  private monthlyBraveCount = 0;
  private monthlyTavilyCount = 0;
  private lastResetDate: string;
  private lastBraveReset: string;

  constructor() {
    this.googleApiKey = process.env.GOOGLE_API_KEY;
    this.googleCx = process.env.GOOGLE_CX;
    this.braveApiKey = process.env.BRAVE_API_KEY;
    // Hardcoded Tavily API key for better search results
    this.tavilyApiKey = process.env.TAVILY_API_KEY || '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';
    this.lastResetDate = new Date().toDateString();
    this.lastBraveReset = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    // Reset counters
    const savedDate = process.env.LAST_SEARCH_DATE;
    if (savedDate !== this.lastResetDate) {
      this.dailySearchCount = 0;
      process.env.LAST_SEARCH_DATE = this.lastResetDate;
    } else {
      this.dailySearchCount = parseInt(process.env.DAILY_SEARCH_COUNT || '0');
    }
    
    const savedBraveMonth = process.env.LAST_BRAVE_MONTH;
    if (savedBraveMonth !== this.lastBraveReset) {
      this.monthlyBraveCount = 0;
      process.env.LAST_BRAVE_MONTH = this.lastBraveReset;
    } else {
      this.monthlyBraveCount = parseInt(process.env.MONTHLY_BRAVE_COUNT || '0');
    }
    
    const savedTavilyMonth = process.env.LAST_TAVILY_MONTH;
    if (savedTavilyMonth !== this.lastBraveReset) {
      this.monthlyTavilyCount = 0;
      process.env.LAST_TAVILY_MONTH = this.lastBraveReset;
    } else {
      this.monthlyTavilyCount = parseInt(process.env.MONTHLY_TAVILY_COUNT || '0');
    }
  }

  /**
   * Main search - tries multiple free sources
   */
  async search(query: string, numResults = 5): Promise<SearchResponse> {
    const sources: Promise<SearchResponse | null>[] = [];
    
    // 1. Try Tavily AI Search API (1000/month free, NO CARD REQUIRED)
    if (this.canUseTavilyApi()) {
      sources.push(this.searchTavilyApi(query, numResults).catch(() => null));
    }
    
    // 2. Try Google Custom Search API (100/day free)
    if (this.canUseGoogleApi()) {
      sources.push(this.searchGoogleApi(query, numResults).catch(() => null));
    }
    
    // 3. Try Wikipedia API (always free)
    sources.push(this.searchWikipedia(query, numResults).catch(() => null));
    
    // 3. Try DuckDuckGo (always free, scraping)
    sources.push(this.searchDuckDuckGo(query, numResults).catch(() => null));
    
    // 4. Try Bing (always free, scraping)
    sources.push(this.searchBing(query, numResults).catch(() => null));

    // Run all in parallel, return first successful with good results
    const results = await Promise.all(sources);
    
    // Find the best result
    for (const result of results) {
      if (result && result.results.length >= 3) {
        return result;
      }
    }
    
    // If no good results, merge all partial results
    const allResults: SearchResult[] = [];
    const seenUrls = new Set<string>();
    
    for (const result of results) {
      if (result) {
        for (const item of result.results) {
          if (!seenUrls.has(item.url)) {
            seenUrls.add(item.url);
            allResults.push(item);
          }
        }
      }
    }
    
    return {
      results: allResults.slice(0, numResults),
      query,
      totalResults: allResults.length
    };
  }

  /**
   * Check if Tavily API can be used (1000/month limit, NO CARD REQUIRED)
   */
  private canUseTavilyApi(): boolean {
    if (!this.tavilyApiKey) return false;
    if (this.monthlyTavilyCount >= 1000) {
      console.log('⚠️ Tavily API monthly limit (1000) reached');
      return false;
    }
    return true;
  }

  /**
   * Track Tavily API usage
   */
  private trackTavilyApiUsage() {
    this.monthlyTavilyCount++;
    process.env.MONTHLY_TAVILY_COUNT = this.monthlyTavilyCount.toString();
    console.log(`📊 Tavily API usage: ${this.monthlyTavilyCount}/1000 this month`);
  }

  /**
   * Tavily AI Search API - 1000/month FREE, NO CREDIT CARD REQUIRED
   */
  private async searchTavilyApi(query: string, numResults: number): Promise<SearchResponse> {
    await freeApiRateLimiter.waitForNextRequest();
    
    const url = 'https://api.tavily.com/search';
    
    return withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.tavilyApiKey,
          query: query,
          search_depth: 'basic',
          max_results: numResults,
          include_answer: false,
          include_images: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.includes('quota') || errorText.includes('limit') || response.status === 429) {
          console.log('⚠️ Tavily API quota exceeded');
          this.monthlyTavilyCount = 1000;
        }
        throw new Error(`Tavily API error: ${response.status}`);
      }

      const data = await response.json();
      const webResults = data.results || [];
      
      if (webResults.length === 0) {
        throw new Error('No results from Tavily API');
      }

      this.trackTavilyApiUsage();

      const results: SearchResult[] = webResults.map((item: any) => ({
        title: item.title || 'No title',
        url: item.url || '',
        snippet: item.content || item.snippet || '',
        source: 'Tavily AI Search',
      }));

      return {
        results,
        query,
        totalResults: results.length,
      };
    }, 2, 500);
  }

  /**
   * Check if Brave API can be used (2000/month limit)
   */
  private canUseBraveApi(): boolean {
    if (!this.braveApiKey) return false;
    if (this.monthlyBraveCount >= 2000) {
      console.log('⚠️ Brave API monthly limit (2000) reached');
      return false;
    }
    return true;
  }

  /**
   * Track Brave API usage
   */
  private trackBraveApiUsage() {
    this.monthlyBraveCount++;
    process.env.MONTHLY_BRAVE_COUNT = this.monthlyBraveCount.toString();
    console.log(`📊 Brave API usage: ${this.monthlyBraveCount}/2000 this month`);
  }

  /**
   * Brave Search API - 2000/month FREE
   */
  private async searchBraveApi(query: string, numResults: number): Promise<SearchResponse> {
    await freeApiRateLimiter.waitForNextRequest();
    
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${numResults}&offset=0&mkt=tr-tr&safesearch=off&text_decorations=no&spellcheck=1`;
    
    return withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': this.braveApiKey!,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.includes('quota') || errorText.includes('limit') || response.status === 429) {
          console.log('⚠️ Brave API quota exceeded');
          this.monthlyBraveCount = 2000;
        }
        throw new Error(`Brave API error: ${response.status}`);
      }

      const data = await response.json();
      const webResults = data.web?.results || [];
      
      if (webResults.length === 0) {
        throw new Error('No results from Brave API');
      }

      this.trackBraveApiUsage();

      const results: SearchResult[] = webResults.map((item: any) => ({
        title: item.title || 'No title',
        url: item.url || '',
        snippet: item.description || '',
        source: 'Brave Search',
      }));

      return {
        results,
        query,
        totalResults: data.web?.total_count || results.length,
      };
    }, 2, 500);
  }

  /**
   * Check if Google API can be used (100/day limit)
   */
  private canUseGoogleApi(): boolean {
    // Check if configured
    if (!this.googleApiKey || !this.googleCx) {
      return false;
    }
    
    // Check daily limit
    if (this.dailySearchCount >= 100) {
      console.log('⚠️ Google API daily limit (100) reached');
      return false;
    }
    
    return true;
  }

  /**
   * Increment Google API usage counter
   */
  private trackGoogleApiUsage() {
    this.dailySearchCount++;
    process.env.DAILY_SEARCH_COUNT = this.dailySearchCount.toString();
    console.log(`📊 Google API usage: ${this.dailySearchCount}/100 today`);
  }

  /**
   * Google Custom Search API - 100/day FREE
   */
  private async searchGoogleApi(query: string, numResults: number): Promise<SearchResponse> {
    await freeApiRateLimiter.waitForNextRequest();
    
    const params = new URLSearchParams({
      key: this.googleApiKey!,
      cx: this.googleCx!,
      q: query,
      num: Math.min(numResults, 10).toString(),
      safe: 'active',
    });

    const url = `https://www.googleapis.com/customsearch/v1?${params.toString()}`;
    
    return withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        // Check for quota exceeded
        if (errorText.includes('quota') || errorText.includes('limit') || response.status === 429) {
          console.log('⚠️ Google API quota exceeded');
          this.dailySearchCount = 100; // Mark as exhausted
        }
        throw new Error(`Google API error: ${response.status}`);
      }

      const data = await response.json();
      
      const items = data.items || [];
      if (items.length === 0) {
        throw new Error('No results from Google API');
      }

      // Track usage
      this.trackGoogleApiUsage();

      const results: SearchResult[] = items.map((item: any) => ({
        title: item.title || 'No title',
        url: item.link || item.url || '',
        snippet: item.snippet || item.description || '',
        source: 'Google API',
      }));

      return {
        results,
        query,
        totalResults: data.searchInformation?.totalResults || results.length,
      };
    }, 2, 500);
  }

  /**
   * Wikipedia API - ALWAYS FREE, NO LIMIT
   */
  private async searchWikipedia(query: string, numResults: number): Promise<SearchResponse> {
    await freeApiRateLimiter.waitForNextRequest();
    
    const params = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: query,
      format: 'json',
      srlimit: numResults.toString(),
      origin: '*',
    });

    const url = `https://en.wikipedia.org/w/api.php?${params.toString()}`;
    
    return withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SyntGPT/1.0 (https://syntgpt.com)',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Wikipedia API error: ${response.status}`);
      }

      const data = await response.json();
      const items = data.query?.search || [];

      if (items.length === 0) {
        throw new Error('No results from Wikipedia');
      }

      const results: SearchResult[] = items.map((item: any) => ({
        title: item.title || 'No title',
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
        snippet: item.snippet?.replace(/<[^>]*>/g, '') || '',
        source: 'Wikipedia',
      }));

      return {
        results,
        query,
        totalResults: data.query?.searchinfo?.totalhits || results.length,
      };
    }, 2, 500);
  }

  /**
   * DuckDuckGo HTML Search - ALWAYS FREE
   */
  private async searchDuckDuckGo(query: string, numResults: number): Promise<SearchResponse> {
    await freeApiRateLimiter.waitForNextRequest();
    
    const encodedQuery = encodeURIComponent(query);
    const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;

    return withRetry(async () => {
      await bypassService.sleep(300);
      
      const headers = {
        ...bypassService.generateStealthHeaders(),
        'Referer': 'https://duckduckgo.com/',
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`DuckDuckGo error: ${response.status}`);
      }

      const html = await response.text();
      const results = this.parseDuckDuckGoResults(html, numResults);

      if (results.length === 0) {
        throw new Error('No results from DuckDuckGo');
      }

      return {
        results,
        query,
        totalResults: results.length,
      };
    }, 2, 500);
  }

  /**
   * Bing Search - ALWAYS FREE
   */
  private async searchBing(query: string, numResults: number): Promise<SearchResponse> {
    await freeApiRateLimiter.waitForNextRequest();
    
    const encodedQuery = encodeURIComponent(query);
    const url = `https://www.bing.com/search?q=${encodedQuery}&count=${numResults}`;

    return withRetry(async () => {
      await bypassService.sleep(500);
      
      const headers = {
        ...bypassService.generateStealthHeaders(),
        'Referer': 'https://www.bing.com/',
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Bing error: ${response.status}`);
      }

      const html = await response.text();
      const results = this.parseBingResults(html, numResults);

      return {
        results,
        query,
        totalResults: results.length,
      };
    }, 2, 500);
  }

  private parseDuckDuckGoResults(html: string, limit: number): SearchResult[] {
    const results: SearchResult[] = [];
    const resultRegex = /<div class="result[^"]*"[^>]*>.*?<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>.*?<a[^>]*class="result__snippet"[^>]*>(.*?)<\/a>/gs;
    
    let match;
    while ((match = resultRegex.exec(html)) !== null && results.length < limit) {
      const url = this.cleanHtml(match[1]);
      const title = this.cleanHtml(match[2]);
      const snippet = this.cleanHtml(match[3]);
      
      if (url && title) {
        results.push({
          title,
          url: url.startsWith('http') ? url : `https:${url}`,
          snippet,
          source: 'DuckDuckGo',
        });
      }
    }
    return results;
  }

  private parseBingResults(html: string, limit: number): SearchResult[] {
    const results: SearchResult[] = [];
    const titleRegex = /<h2[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>.*?<\/h2>/gi;
    const snippetRegex = /<span[^>]*class="b_caption"[^>]*>.*?<p[^>]*>(.*?)<\/p>.*?<\/span>/gi;
    
    const snippets: string[] = [];
    let snippetMatch;
    while ((snippetMatch = snippetRegex.exec(html)) !== null) {
      snippets.push(this.cleanHtml(snippetMatch[1]));
    }
    
    let titleMatch;
    let index = 0;
    while ((titleMatch = titleRegex.exec(html)) !== null && results.length < limit) {
      const url = this.cleanHtml(titleMatch[1]);
      const title = this.cleanHtml(titleMatch[2]);
      
      if (url && title && !url.includes('microsoft.com') && !url.includes('bing.com')) {
        results.push({
          title,
          url: url.startsWith('http') ? url : `https://www.bing.com${url}`,
          snippet: snippets[index] || '',
          source: 'Bing',
        });
        index++;
      }
    }
    return results;
  }

  private cleanHtml(html: string): string {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export const freeSearchSources = new FreeSearchSources();
