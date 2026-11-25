const requestCounts = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 300; // requests per minute per IP

export function rateLimiter(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();

  let clientRecord = requestCounts.get(ip);
  if (!clientRecord) {
    clientRecord = { count: 1, resetTime: now + WINDOW_MS };
    requestCounts.set(ip, clientRecord);
  } else {
    if (now > clientRecord.resetTime) {
      clientRecord.count = 1;
      clientRecord.resetTime = now + WINDOW_MS;
    } else {
      clientRecord.count++;
    }
  }

  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - clientRecord.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(clientRecord.resetTime / 1000));

  if (clientRecord.count > MAX_REQUESTS) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded. Please back off before trying again.'
    }));
    return;
  }

  next();
}
