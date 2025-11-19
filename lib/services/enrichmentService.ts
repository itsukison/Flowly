/**
 * @deprecated This service is deprecated and will be removed in a future version.
 * 
 * Use Gemini3ContactEnrichmentAgent instead for better performance and features.
 * 
 * The new agent uses Gemini 3 Pro with Firecrawl fallback:
 * - 57-81% cost reduction
 * - 2-3x faster enrichment
 * - Uses ALL row data for smarter enrichment
 * - Confidence-based fallback strategy
 * 
 * Migration: Replace enrichmentService with Gemini3ContactEnrichmentAgent
 * See: .agent/tasks/CONTACT_ENRICHMENT_GEMINI3_REFACTOR_PLAN.md
 * 
 * ---
 * 
 * Enrichment service for finding contact information
 * Uses Firecrawl for web scraping and parsing utilities
 */

import { parseContactInfo, parseWithGemini, type ContactInfo } from '@/lib/utils/contactParser';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_KEY;

export interface EnrichmentResult {
  success: boolean;
  data?: ContactInfo & {
    source: 'crawl' | 'search';
    tokushoho_url: string;
  };
  error?: string;
}

/**
 * Try to scrape common tokushoho page paths
 */
async function tryCommonPaths(baseUrl: string): Promise<{ markdown: string; url: string } | null> {
  const commonPaths = [
    '/policies/legal-notice',
    '/tokushoho',
    '/legal',
    '/company',
  ];

  console.log('Trying common paths for:', baseUrl);

  for (const path of commonPaths) {
    try {
      const testUrl = `${baseUrl}${path}`;
      console.log('Trying:', testUrl);

      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: testUrl,
          formats: ['markdown']
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.markdown) {
          // Check if the page contains relevant keywords
          const markdown = data.data.markdown;
          const hasRelevantContent = 
            markdown.includes('特定商取引') || 
            markdown.includes('特商法') ||
            markdown.includes('販売業者') ||
            markdown.includes('事業者') ||
            markdown.includes('運営会社');

          if (hasRelevantContent) {
            console.log('✓ Found relevant page at:', testUrl);
            return { markdown, url: testUrl };
          }
        }
      }
    } catch (error) {
      // Continue to next path
      console.log('Path failed:', path);
    }
  }

  console.log('No common paths found');
  return null;
}

/**
 * Enrich contact information by company URL (Pattern A: Try common paths, then search)
 */
export async function enrichByUrl(url: string): Promise<EnrichmentResult> {
  try {
    // Ensure URL has protocol
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }

    // Extract base URL and clean it to root domain
    const urlObj = new URL(url);
    // Always use root domain (remove any path, query, hash)
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;
    const domain = urlObj.hostname.replace('www.', '');
    
    console.log('Original URL:', url);
    console.log('Cleaned base URL:', baseUrl);
    console.log('Domain:', domain);

    // Phase 1: Try common paths first (fast and cheap)
    console.log('=== PHASE 1: Trying common paths ===');
    const commonPathResult = await tryCommonPaths(baseUrl);
    
    let tokushohoPage: { markdown: string; url: string };

    if (commonPathResult) {
      tokushohoPage = commonPathResult;
      console.log('Using common path result');
    } else {
      // Phase 2: Fall back to search
      console.log('=== PHASE 2: Falling back to search ===');
      const searchQuery = `site:${domain} (特定商取引法 OR 特商法 OR 会社概要 OR 運営者情報)`;
      
      const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 5,
          scrapeOptions: {
            formats: ['markdown']
          }
        })
      });

      if (!searchResponse.ok) {
        const errorData = await searchResponse.json().catch(() => ({}));
        console.error('Firecrawl search error:', errorData);
        throw new Error(`Firecrawl search failed: ${searchResponse.statusText} - ${JSON.stringify(errorData)}`);
      }

      const searchData = await searchResponse.json();

      if (!searchData.data || searchData.data.length === 0) {
        throw new Error('特定商取引法 page not found');
      }

      // Use the first result (most relevant)
      tokushohoPage = {
        markdown: searchData.data[0].markdown,
        url: searchData.data[0].url
      };
    }

    console.log('=== FIRECRAWL RESULT ===');
    console.log('URL found:', tokushohoPage.url);
    console.log('Markdown length:', tokushohoPage.markdown?.length || 0);
    console.log('Markdown content:', tokushohoPage.markdown);
    console.log('=== END FIRECRAWL RESULT ===\n');

    // Parse contact info
    let contactInfo = parseContactInfo(tokushohoPage.markdown);

    // If regex parsing didn't find enough info, use Gemini
    if (contactInfo.confidence < 50) {
      console.log('Confidence too low (' + contactInfo.confidence + '%), using Gemini fallback...');
      const geminiResult = await parseWithGemini(tokushohoPage.markdown);
      contactInfo = {
        email: contactInfo.email || geminiResult.email || null,
        phone: contactInfo.phone || geminiResult.phone || null,
        address: contactInfo.address || geminiResult.address || null,
        representative: contactInfo.representative || geminiResult.representative || null,
        confidence: Math.max(contactInfo.confidence, 50),
      };
    }

    return {
      success: true,
      data: {
        ...contactInfo,
        source: 'crawl',
        tokushoho_url: tokushohoPage.url,
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Enrich contact information by company name (Pattern B: Search)
 */
export async function enrichByCompanyName(companyName: string): Promise<EnrichmentResult> {
  try {
    // Use multi-term search for better results
    const searchQuery = `"${companyName}" (特定商取引法 OR 特商法 OR 会社概要 OR 運営者情報)`;
    
    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 5,
        scrapeOptions: {
          formats: ['markdown']
        }
      })
    });

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json().catch(() => ({}));
      console.error('Firecrawl search error:', errorData);
      throw new Error(`Firecrawl search failed: ${searchResponse.statusText} - ${JSON.stringify(errorData)}`);
    }

    const searchData = await searchResponse.json();

    if (!searchData.data || searchData.data.length === 0) {
      throw new Error('No results found');
    }

    // Use the first result
    const firstResult = searchData.data[0];

    console.log('=== FIRECRAWL RESULT (Company Name) ===');
    console.log('URL found:', firstResult.url);
    console.log('Markdown length:', firstResult.markdown?.length || 0);
    console.log('Markdown content:', firstResult.markdown);
    console.log('=== END FIRECRAWL RESULT ===\n');

    // Parse contact info
    let contactInfo = parseContactInfo(firstResult.markdown);

    // If regex parsing didn't find enough info, use Gemini
    if (contactInfo.confidence < 50) {
      console.log('Confidence too low (' + contactInfo.confidence + '%), using Gemini fallback...');
      const geminiResult = await parseWithGemini(firstResult.markdown);
      contactInfo = {
        email: contactInfo.email || geminiResult.email || null,
        phone: contactInfo.phone || geminiResult.phone || null,
        address: contactInfo.address || geminiResult.address || null,
        representative: contactInfo.representative || geminiResult.representative || null,
        confidence: Math.max(contactInfo.confidence, 50),
      };
    } else {
      console.log('Regex confidence sufficient (' + contactInfo.confidence + '%), skipping Gemini');
    }

    return {
      success: true,
      data: {
        ...contactInfo,
        source: 'search',
        tokushoho_url: firstResult.url,
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
