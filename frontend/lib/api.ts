const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ApiRequestOptions extends RequestInit {
  useCache?: boolean;
  cacheTtl?: number;
  skipDedupe?: boolean;
}

interface CacheEntry<T = any> {
  data: ApiResponse<T>;
  expiresAt: number;
}

// In-memory client cache for GET responses (default TTL: 45s)
const apiCache = new Map<string, CacheEntry>();

// In-flight GET request deduplication map to prevent redundant concurrent fetches
const inFlightRequests = new Map<string, Promise<ApiResponse<any>>>();

export function clearApiCache(prefix?: string): void {
  if (!prefix) {
    apiCache.clear();
  } else {
    apiCache.forEach((_, key) => {
      if (key.includes(prefix)) {
        apiCache.delete(key);
      }
    });
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const method = (options.method || 'GET').toUpperCase();

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Include token from localStorage if available (for dual cookie + Bearer fallback)
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('nexora_token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Segment cache and deduplication by user token to prevent cross-user collision
  const tokenSegment = token ? token.slice(-12) : 'anon';
  const cacheKey = `${tokenSegment}:${method}:${url}`;

  // 1. Check client-side memory cache for GET requests
  if (method === 'GET' && options.useCache !== false) {
    const cached = apiCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
  }

  // 2. In-flight request deduplication for concurrent identical GET calls
  if (method === 'GET' && !options.skipDedupe && inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  const executeFetch = async (): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // send cookies
      });

      const data = await response.json().catch(() => ({
        success: false,
        error: { code: 'PARSE_ERROR', message: 'Failed to parse JSON response' },
      }));

      // Cache successful GET responses
      if (method === 'GET' && data.success && options.useCache !== false) {
        const ttl = options.cacheTtl || 45 * 1000;
        apiCache.set(cacheKey, {
          data,
          expiresAt: Date.now() + ttl,
        });
      }

      return data;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'ABORTED',
            message: 'Request was cancelled',
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: err.message || 'Network request failed. Ensure backend is running.',
        },
      };
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  };

  if (method === 'GET' && !options.skipDedupe) {
    const promise = executeFetch();
    inFlightRequests.set(cacheKey, promise);
    return promise;
  }

  return executeFetch();
}
