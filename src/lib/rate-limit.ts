// 简单的内存速率限制器
// 注意：生产环境建议使用 Redis

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const MAX_STORE_SIZE = 10000; // 最大存储条目数

// 清理过期条目并限制存储大小
function cleanup() {
  const now = Date.now();
  const keysToDelete: string[] = [];

  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      keysToDelete.push(key);
    }
  }

  // 删除过期条目
  for (const key of keysToDelete) {
    store.delete(key);
  }

  // 如果仍然超过限制，删除最早的条目
  if (store.size > MAX_STORE_SIZE) {
    const entries = Array.from(store.entries())
      .sort((a, b) => a[1].resetAt - b[1].resetAt);

    const toDelete = entries.slice(0, store.size - MAX_STORE_SIZE);
    for (const [key] of toDelete) {
      store.delete(key);
    }
  }
}

// Node.js 环境下定期清理（避免内存泄漏）
if (typeof setInterval !== "undefined" && process.env.NODE_ENV !== "test") {
  const interval = setInterval(cleanup, 5 * 60 * 1000);
  // 允许进程退出
  if (interval.unref) {
    interval.unref();
  }
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

// 获取客户端真实 IP（优先使用 CF-Connecting-IP，其次是 X-Forwarded-For）
export function getClientIp(request: Request): string {
  // Cloudflare
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  // 反向代理
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // 可能有多个 IP，取第一个
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  // Nginx
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
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
