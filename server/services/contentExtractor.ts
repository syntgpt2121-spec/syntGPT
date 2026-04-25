import { bypassService, withRetry, RateLimiter } from './bypass.js';

// Rate limiter for content scraping - daha hızlı
const contentRateLimiter = new RateLimiter(1000, 2000);

export interface ExtractedContent {
  url: string;
  title: string;
  content: string;
  metaDescription?: string;
  headings?: string[];
  links?: string[];
  source: string;
}

export interface ContentAnalysisResult {
  contents: ExtractedContent[];
  summary: string;
  sources: string[];
}

class ContentExtractorService {
  private readonly MAX_CONTENT_LENGTH = 4000; // Daha kısa
  private readonly MAX_PAGES = 2; // Daha az sayfa
  private readonly TIMEOUT_MS = 12000; // 12s timeout

  /**
   * Extract content via Jina Reader API (bot-proof, free, no key needed)
   */
  private async extractViaJina(url: string): Promise<ExtractedContent | null> {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(jinaUrl, {
        headers: {
          'Accept': 'application/json',
          'X-Return-Format': 'markdown',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`Jina error: ${response.status}`);

      const text = await response.text();
      if (!text || text.length < 100) throw new Error('Jina returned empty content');

      // Parse title from Jina response header
      const titleMatch = text.match(/^Title:\s*(.+)$/m);
      const title = titleMatch?.[1]?.trim() || new URL(url).hostname;

      // Get markdown content after the header block
      const contentStart = text.indexOf('Markdown Content:');
      const rawContent = contentStart > -1 ? text.slice(contentStart + 17) : text;

      // Remove nav/menu noise (lines shorter than 20 chars after cleanup)
      const cleanedLines = rawContent.split('\n').filter(line => {
        const t = line.replace(/\[.*?\]/g, '').replace(/[#*\-]/g, '').trim();
        return t.length > 20 || line.startsWith('#');
      });
      const content = cleanedLines.join('\n').slice(0, this.MAX_CONTENT_LENGTH);

      return {
        url,
        title,
        content,
        source: new URL(url).hostname,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Extract main content from a webpage — Jina first, raw scrape fallback
   */
  async extractFromUrl(url: string): Promise<ExtractedContent | null> {
    // 1. Try Jina Reader (most reliable, bypasses bots)
    try {
      const result = await this.extractViaJina(url);
      if (result) return result;
    } catch {
      // fall through to raw scrape
    }

    // 2. Fallback: raw scrape with stealth headers
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      const headers = {
        ...bypassService.generateStealthHeaders(),
        'Referer': new URL(url).origin,
      };

      const response = await fetch(url, {
        headers,
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`Fetch error: ${response.status}`);

      const html = await response.text();
      return this.parseHtmlContent(html, url);
    } catch {
      return null;
    }
  }

  /**
   * Parse HTML and extract main content
   */
  private parseHtmlContent(html: string, url: string): ExtractedContent {
    // Clean HTML first
    let cleaned = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
      .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');

    // Extract title
    const titleMatch = cleaned.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = this.cleanText(titleMatch?.[1] || '');

    // Extract meta description
    const metaDescMatch = cleaned.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                          cleaned.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
    const metaDescription = this.cleanText(metaDescMatch?.[1] || '');

    // Extract main content - try multiple strategies
    let mainContent = '';

    // Strategy 1: Look for article or main tag
    const articleMatch = cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      mainContent = articleMatch[1];
    } else {
      const mainMatch = cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
      if (mainMatch) {
        mainContent = mainMatch[1];
      }
    }

    // Strategy 2: Look for content divs with common class names
    if (!mainContent) {
      const contentPatterns = [
        /<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class=["'][^"']*post[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class=["'][^"']*entry[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class=["'][^"']*body[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*id=["']content["'][^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*id=["']main["'][^>]*>([\s\S]*?)<\/div>/i,
      ];

      for (const pattern of contentPatterns) {
        const match = cleaned.match(pattern);
        if (match && match[1].length > mainContent.length) {
          mainContent = match[1];
        }
      }
    }

    // Strategy 3: Extract paragraphs from body if nothing else worked
    if (!mainContent) {
      const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        mainContent = bodyMatch[1];
      }
    }

    // Extract headings
    const headings: string[] = [];
    const headingMatches = mainContent.matchAll(/<h[1-3][^>]*>([^<]*)<\/h[1-3]>/gi);
    for (const match of headingMatches) {
      const heading = this.cleanText(match[1]);
      if (heading && heading.length > 5) {
        headings.push(heading);
      }
    }

    // Extract links
    const links: string[] = [];
    const linkMatches = mainContent.matchAll(/<a[^>]*href=["']([^"']*)["'][^>]*>([^<]*)<\/a>/gi);
    for (const match of linkMatches) {
      const href = match[1];
      const text = this.cleanText(match[2]);
      if (href && !href.startsWith('#') && !href.startsWith('javascript:') && text.length > 3) {
        try {
          const fullUrl = new URL(href, url).href;
          links.push(`${text} (${fullUrl})`);
        } catch {
          links.push(`${text} (${href})`);
        }
      }
    }

    // Clean and extract text from main content
    let textContent = this.extractTextFromHtml(mainContent);
    
    // Truncate if too long
    if (textContent.length > this.MAX_CONTENT_LENGTH) {
      textContent = textContent.substring(0, this.MAX_CONTENT_LENGTH) + '... [content truncated]';
    }

    return {
      url,
      title: title || 'Untitled',
      content: textContent,
      metaDescription,
      headings: headings.slice(0, 10),
      links: links.slice(0, 15),
      source: new URL(url).hostname,
    };
  }

  /**
   * Extract text from HTML, preserving some structure
   */
  private extractTextFromHtml(html: string): string {
    return html
      .replace(/<h[1-6][^>]*>([^<]*)<\/h[1-6]>/gi, '\n\n$1\n\n')
      .replace(/<p[^>]*>([^<]*)<\/p>/gi, '\n$1\n')
      .replace(/<li[^>]*>([^<]*)<\/li>/gi, '\n• $1')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Clean text content
   */
  private cleanText(text: string): string {
    if (!text) return '';
    return text
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Analyze content from multiple sources - HIZLI MOD
   */
  async analyzeMultipleSources(urls: string[]): Promise<ContentAnalysisResult> {
    const contents: ExtractedContent[] = [];
    const sources: string[] = [];

    // Limit to MAX_PAGES and run in parallel
    const limitedUrls = urls.slice(0, this.MAX_PAGES);
    
    const extractionPromises = limitedUrls.map(async (url) => {
      try {
        const content = await this.extractFromUrl(url);
        return content;
      } catch (error) {
        console.error(`Failed to extract from ${url}:`, error);
        return null;
      }
    });

    const results = await Promise.all(extractionPromises);
    
    for (const content of results) {
      if (content && content.content.length > 50) {
        contents.push(content);
        sources.push(content.source);
      }
    }

    // Create a summary of all sources
    const summary = this.createContentSummary(contents);

    return {
      contents,
      summary,
      sources: [...new Set(sources)],
    };
  }

  /**
   * Create a summary from multiple content sources
   */
  private createContentSummary(contents: ExtractedContent[]): string {
    if (contents.length === 0) {
      return 'No content could be extracted from the provided sources.';
    }

    let summary = `Extracted content from ${contents.length} source(s):\n\n`;

    contents.forEach((content, index) => {
      summary += `[${index + 1}] ${content.title}\n`;
      summary += `Source: ${content.source} (${content.url})\n`;
      
      if (content.metaDescription) {
        summary += `Description: ${content.metaDescription}\n`;
      }

      if (content.headings && content.headings.length > 0) {
        summary += `Key points: ${content.headings.slice(0, 5).join(' | ')}\n`;
      }

      // Add truncated content preview
      const preview = content.content.substring(0, 500).replace(/\n/g, ' ');
      summary += `Content preview: ${preview}...\n\n`;
    });

    return summary;
  }

  /**
   * Determine if a URL is worth scraping (not a login page, error page, etc.)
   */
  isValidContentUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Skip common non-content URLs
      const skipPatterns = [
        /login/i,
        /signin/i,
        /signup/i,
        /register/i,
        /404/i,
        /error/i,
        /\/auth\//i,
        /\/admin\//i,
        /\.pdf$/i,
        /\.jpg$/i,
        /\.png$/i,
        /\.gif$/i,
        /\.zip$/i,
        /\.exe$/i,
      ];

      return !skipPatterns.some(pattern => pattern.test(urlObj.pathname));
    } catch {
      return false;
    }
  }
}

export const contentExtractor = new ContentExtractorService();
