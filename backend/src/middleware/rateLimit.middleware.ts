import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * Lightweight, zero-dependency in-memory rate limiter middleware.
 * Prevents automated scraping and PIN brute-forcing attacks.
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  code?: string;
}) {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    code = 'TOO_MANY_REQUESTS',
  } = options;

  const hits = new Map<string, RateLimitRecord>();

  // Periodically clean up expired entries to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(key);
      }
    }
  }, Math.max(windowMs, 60000)).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    // In test environment, allow bypassing rate limits unless specifically testing rate limiting
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return next();
    }

    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    const key = `${req.baseUrl || req.path}:${clientIp}`;
    const now = Date.now();
    const record = hits.get(key);

    if (!record || now > record.resetTime) {
      const resetTime = now + windowMs;
      hits.set(key, { count: 1, resetTime });
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - 1));
      res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));
      return next();
    }

    if (record.count >= max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
      res.status(429).json({
        success: false,
        error: {
          code,
          message,
          retryAfterSeconds,
        },
      });
      return;
    }

    record.count += 1;
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
    next();
  };
}
