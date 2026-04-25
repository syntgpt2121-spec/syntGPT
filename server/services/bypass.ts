import { RequestHandler } from "express";

// Rotating User Agents to bypass bot detection
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
];

// Rotating Accept-Language headers
const ACCEPT_LANGUAGES = [
  'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  'en-US,en;q=0.9,tr;q=0.8',
  'en-GB,en;q=0.9,en-US;q=0.8',
  'de-DE,de;q=0.9,en-US;q=0.8',
  'fr-FR,fr;q=0.9,en-US;q=0.8',
];

// Rotating Accept headers
const ACCEPT_HEADERS = [
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
];

// Proxy list (can be populated from environment variables)
const PROXY_LIST = process.env.PROXY_LIST?.split(',').filter(Boolean) || [];

export interface BypassConfig {
  useProxy?: boolean;
  rotateUserAgent?: boolean;
  addRandomDelay?: boolean;
  minDelay?: number;
  maxDelay?: number;
}

export class BypassService {
  private currentUserAgentIndex = 0;
  private currentProxyIndex = 0;

  getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  getNextUserAgent(): string {
    const agent = USER_AGENTS[this.currentUserAgentIndex];
    this.currentUserAgentIndex = (this.currentUserAgentIndex + 1) % USER_AGENTS.length;
    return agent;
  }

  getRandomAcceptLanguage(): string {
    return ACCEPT_LANGUAGES[Math.floor(Math.random() * ACCEPT_LANGUAGES.length)];
  }

  getRandomAcceptHeader(): string {
    return ACCEPT_HEADERS[Math.floor(Math.random() * ACCEPT_HEADERS.length)];
  }

  getNextProxy(): string | undefined {
    if (PROXY_LIST.length === 0) return undefined;
    const proxy = PROXY_LIST[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % PROXY_LIST.length;
    return proxy;
  }

  getRandomDelay(min = 1000, max = 3000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  generateStealthHeaders(): Record<string, string> {
    return {
      'User-Agent': this.getRandomUserAgent(),
      'Accept': this.getRandomAcceptHeader(),
      'Accept-Language': this.getRandomAcceptLanguage(),
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
    };
  }

  async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const bypassService = new BypassService();

// Rate limiting helper with jitter
export class RateLimiter {
  private lastRequestTime = 0;
  private minDelay: number;
  private maxDelay: number;

  constructor(minDelay = 2000, maxDelay = 5000) {
    this.minDelay = minDelay;
    this.maxDelay = maxDelay;
  }

  async waitForNextRequest(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const requiredDelay = bypassService.getRandomDelay(this.minDelay, this.maxDelay);
    
    if (timeSinceLastRequest < requiredDelay) {
      await bypassService.sleep(requiredDelay - timeSinceLastRequest);
    }
    
    this.lastRequestTime = Date.now();
  }
}

// Retry logic with exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await bypassService.sleep(delay);
      }
    }
  }
  
  throw lastError;
}
