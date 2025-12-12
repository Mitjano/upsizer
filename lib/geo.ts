/**
 * IP Geolocation service using ip-api.com (free, no API key needed)
 * Rate limit: 45 requests per minute
 */

export interface GeoData {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
}

// Simple in-memory cache to avoid hitting rate limits
const geoCache = new Map<string, { data: GeoData | null; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get geolocation data for an IP address
 * Uses ip-api.com free tier (no API key required)
 */
export async function getGeoFromIP(ip: string): Promise<GeoData | null> {
  // Skip for localhost/private IPs
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return null;
  }

  // Check cache
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // ip-api.com free API (no key needed, 45 requests/min limit)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,city,zip,lat,lon,timezone,isp,org,as`,
      {
        next: { revalidate: 86400 }, // Cache for 24 hours
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('[geo] Failed to fetch geo data:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.status === 'fail') {
      console.error('[geo] IP lookup failed:', data.message);
      geoCache.set(ip, { data: null, timestamp: Date.now() });
      return null;
    }

    const geoData: GeoData = {
      country: data.country,
      countryCode: data.countryCode,
      region: data.region,
      city: data.city,
      zip: data.zip,
      lat: data.lat,
      lon: data.lon,
      timezone: data.timezone,
      isp: data.isp,
      org: data.org,
      as: data.as,
    };

    // Cache the result
    geoCache.set(ip, { data: geoData, timestamp: Date.now() });

    return geoData;
  } catch (error) {
    console.error('[geo] Error fetching geo data:', error);
    return null;
  }
}

/**
 * Get country flag emoji from country code
 */
export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '';

  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}
