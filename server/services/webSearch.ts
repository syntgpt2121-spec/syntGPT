import { bypassService, withRetry, RateLimiter } from './bypass.js';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  totalResults?: number;
}

// Rate limiter for search requests
const searchRateLimiter = new RateLimiter(1000, 2000);

class WebSearchService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.SERPAPI_KEY;
  }

  /**
   * Main search method that tries multiple sources - HIZLI MOD
   */
  async search(query: string, numResults = 5): Promise<SearchResponse> {
    await searchRateLimiter.waitForNextRequest();

    // Try all sources in parallel for speed
    const promises: Promise<SearchResponse>[] = [];
    
    if (this.apiKey) {
      promises.push(this.searchSerpAPI(query, numResults).catch(() => null as any));
    }
    
    promises.push(this.searchDuckDuckGo(query, numResults).catch(() => null as any));
    promises.push(this.searchBing(query, numResults).catch(() => null as any));

    // Return first successful result
    const results = await Promise.all(promises);
    const successful = results.find(r => r && r.results && r.results.length > 0);
    
    if (successful) {
      return successful;
    }

    // If all fail, return empty
    return {
      results: [],
      query,
      totalResults: 0
    };
  }

  /**
   * SerpAPI Search (most reliable, requires API key) - 30s timeout
   */
  private async searchSerpAPI(query: string, numResults: number): Promise<SearchResponse> {
    if (!this.apiKey) {
      throw new Error('SerpAPI key not configured');
    }

    const params = new URLSearchParams({
      q: query,
      api_key: this.apiKey,
      engine: 'google',
      num: numResults.toString(),
      gl: 'tr',
      hl: 'tr',
    });

    const url = `https://serpapi.com/search?${params.toString()}`;
    
    return withRetry(async () => {
      const headers = bypassService.generateStealthHeaders();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`SerpAPI error: ${response.status}`);
      }

      const data = await response.json();
      
      const results: SearchResult[] = (data.organic_results || []).slice(0, numResults).map((r: any) => ({
        title: r.title || 'No title',
        url: r.link || r.url || '',
        snippet: r.snippet || r.description || '',
        source: 'Google (SerpAPI)',
      }));

      return {
        results,
        query,
        totalResults: data.search_information?.total_results,
      };
    }, 2, 1000);
  }

  /**
   * DuckDuckGo Search - 20s timeout
   */
  private async searchDuckDuckGo(query: string, numResults: number): Promise<SearchResponse> {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;

    return withRetry(async () => {
      await bypassService.sleep(500); // Daha hızlı
      
      const headers = {
        ...bypassService.generateStealthHeaders(),
        'Referer': 'https://duckduckgo.com/',
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout
      
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
    }, 2, 1000);
  }

  /**
   * Bing Search - 20s timeout
   */
  private async searchBing(query: string, numResults: number): Promise<SearchResponse> {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://www.bing.com/search?q=${encodedQuery}&count=${numResults}`;

    return withRetry(async () => {
      await bypassService.sleep(800); // Daha hızlı
      
      const headers = {
        ...bypassService.generateStealthHeaders(),
        'Referer': 'https://www.bing.com/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout
      
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
    }, 2, 1000);
  }

  /**
   * Parse DuckDuckGo HTML results
   */
  private parseDuckDuckGoResults(html: string, limit: number): SearchResult[] {
    const results: SearchResult[] = [];
    
    // DuckDuckGo result pattern
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

  /**
   * Parse Bing HTML results
   */
  private parseBingResults(html: string, limit: number): SearchResult[] {
    const results: SearchResult[] = [];
    
    // Bing result patterns
    const titleRegex = /<h2[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>.*?<\/h2>/gi;
    const snippetRegex = /<span[^>]*class="b_caption"[^>]*>.*?<p[^>]*>(.*?)<\/p>.*?<\/span>/gi;
    
    let titleMatch;
    const snippets: string[] = [];
    
    // Extract snippets
    let snippetMatch;
    while ((snippetMatch = snippetRegex.exec(html)) !== null) {
      snippets.push(this.cleanHtml(snippetMatch[1]));
    }
    
    // Extract titles and URLs
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

  /**
   * Clean HTML tags from text
   */
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

  /**
   * Format search results for AI context
   */
  formatResultsForAI(results: SearchResult[]): string {
    if (results.length === 0) {
      return 'No search results found.';
    }

    let formatted = 'Web Search Results:\n\n';
    
    results.forEach((result, index) => {
      formatted += `[${index + 1}] ${result.title}\n`;
      formatted += `URL: ${result.url}\n`;
      formatted += `Source: ${result.source}\n`;
      if (result.snippet) {
        formatted += `Snippet: ${result.snippet}\n`;
      }
      formatted += '\n';
    });

    return formatted;
  }

  /**
   * Smart search with query enhancement
   */
  async smartSearch(userQuery: string, numResults = 5): Promise<SearchResponse> {
    // Enhance query for better results
    const enhancedQuery = this.enhanceQuery(userQuery);
    
    try {
      const response = await this.search(enhancedQuery, numResults);
      return response;
    } catch (error) {
      console.error('Smart search failed:', error);
      // Return empty results but don't throw
      return {
        results: [],
        query: userQuery,
        totalResults: 0,
      };
    }
  }

  /**
   * Enhance search query for better results
   */
  private enhanceQuery(query: string): string {
    // Remove question words that don't help search
    let enhanced = query
      .replace(/^(what is|who is|where is|when is|how to|what are|who are)\s+/i, '')
      .replace(/\?$/g, '');

    // Add context for better results
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('programming') || lowerQuery.includes('code')) {
      enhanced += ' programming tutorial documentation';
    }
    if (lowerQuery.includes('news') || lowerQuery.includes('current')) {
      enhanced += ' 2024';
    }

    return enhanced.trim() || query;
  }
}

export const webSearchService = new WebSearchService();

// Express route handler
export const handleWebSearch = async (query: string, enableSearch = true) => {
  if (!enableSearch) {
    return null;
  }

  try {
    const results = await webSearchService.smartSearch(query, 5);
    return webSearchService.formatResultsForAI(results.results);
  } catch (error) {
    console.error('Web search error:', error);
    return null;
  }
};
