import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 允许的外部图片域名（根据实际情况配置）
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
