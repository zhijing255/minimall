// 简单的内存速率限制器
// 注意：生产环境建议使用 Redis

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// 清理过期条目
function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

// 定期清理（每5分钟）
if (typeof setInterval !== "undefined") {
  setInterval(cleanup, 5 * 60 * 1000);
}

interface RateLimitOptions {
  windowMs: number; // 时间窗口（毫秒）
  max: number; // 最大请求次数
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const { windowMs, max } = options;
  const now = Date.now();
  const resetAt = now + windowMs;

  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // 新条目或已过期
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: max - 1, resetAt };
  }

  if (entry.count >= max) {
    // 超过限制
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  // 增加计数
  entry.count++;
  return { success: true, remaining: max - entry.count, resetAt: entry.resetAt };
}

// 登录速率限制：同一 IP 5分钟内最多 5 次失败尝试
export function loginRateLimit(ip: string): RateLimitResult {
  return rateLimit(`login:${ip}`, {
    windowMs: 5 * 60 * 1000, // 5分钟
    max: 5, // 最多5次
  });
}

// 注册速率限制：同一 IP 1小时内最多 3 次注册
export function registerRateLimit(ip: string): RateLimitResult {
  return rateLimit(`register:${ip}`, {
    windowMs: 60 * 60 * 1000, // 1小时
    max: 3, // 最多3次
  });
}
