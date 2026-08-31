import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 允许的外部图片域名（根据实际情况配置）
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
    // 禁用 Vercel 图片优化（picsum.photos 超时时使用）
    unoptimized: true,
  },
  // 安全响应头
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js RSC 需要 unsafe-inline
              "style-src 'self' 'unsafe-inline'", // Tailwind 需要 unsafe-inline
              "img-src 'self' https://picsum.photos data: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://picsum.photos",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
