import axios from 'axios';
import * as cheerio from 'cheerio';
import dns from 'node:dns/promises';
import ipaddr from 'ipaddr.js';

type MediaType = 'image' | 'video';

export interface ScrapedMedia {
  type: MediaType;
  mediaUrl: string;
  sourceUrl: string;
}

const MAX_MEDIA_PER_PAGE = 1000;
const REQUEST_TIMEOUT_MS = 5000;
const MAX_REDIRECTS = 3;
const RETRIES = 2;

const isPrivateIp = (ip: string): boolean => {
  if (!ipaddr.isValid(ip)) return true;
  const parsed = ipaddr.parse(ip);
  if (parsed.kind() === 'ipv4') {
    const range = (parsed as ipaddr.IPv4).range();
    return ['private', 'loopback', 'linkLocal', 'broadcast', 'carrierGradeNat', 'unspecified'].includes(
      range
    );
  }

  const range = (parsed as ipaddr.IPv6).range();
  return ['uniqueLocal', 'loopback', 'linkLocal', 'unspecified'].includes(range);
};

const assertSafeUrl = async (rawUrl: string): Promise<URL> => {
  const parsed = new URL(rawUrl);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP/S URLs are allowed');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw new Error('Localhost is blocked');
  }

  const lookup = await dns.lookup(hostname, { all: true });
  if (lookup.some((entry) => isPrivateIp(entry.address))) {
    throw new Error('Private/internal IP targets are blocked');
  }

  return parsed;
};

const maybeNormalize = (candidate: string | undefined, pageUrl: string): string | null => {
  if (!candidate) return null;
  const trimmed = candidate.trim();
  if (!trimmed || trimmed.startsWith('data:')) return null;
  try {
    const normalized = new URL(trimmed, pageUrl).href;
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) return null;
    return normalized;
  } catch {
    return null;
  }
};

const fetchHtml = async (url: string): Promise<string> => {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
    try {
      const response = await axios.get<string>(url, {
        timeout: REQUEST_TIMEOUT_MS,
        maxRedirects: MAX_REDIRECTS,
        responseType: 'text',
        validateStatus: (status) => status >= 200 && status < 400,
        maxContentLength: 3 * 1024 * 1024
      });
      return response.data;
    } catch (error) {
      lastError = error;
      if (attempt < RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
      }
    }
  }
  throw lastError;
};

export const scrapeMediaFromPage = async (rawUrl: string): Promise<ScrapedMedia[]> => {
  const url = await assertSafeUrl(rawUrl);
  const html = await fetchHtml(url.href);
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const output: ScrapedMedia[] = [];

  const add = (type: MediaType, candidate: string | undefined): void => {
    if (output.length >= MAX_MEDIA_PER_PAGE) return;
    const normalized = maybeNormalize(candidate, url.href);
    if (!normalized) return;
    const key = `${type}:${normalized}`;
    if (seen.has(key)) return;
    seen.add(key);
    output.push({ type, mediaUrl: normalized, sourceUrl: url.href });
  };

  $('img').each((_, el) => {
    add('image', $(el).attr('src'));
    add('image', $(el).attr('data-src'));
    add('image', $(el).attr('data-lazy-src'));
  });

  $('meta[property="og:image"]').each((_, el) => add('image', $(el).attr('content')));
  $('video').each((_, el) => add('video', $(el).attr('src')));
  $('source').each((_, el) => add('video', $(el).attr('src')));

  return output;
};
