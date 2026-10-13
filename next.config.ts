import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd()
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/index.html" },
        { source: "/ai-search", destination: "/ai-search.html" },
        { source: "/zhihu-search", destination: "/zhihu-search.html" },
        { source: "/hackathon", destination: "/hackathon.html" },
        { source: "/whale-tv", destination: "/whale-tv.html" },
        { source: "/platte", destination: "/platte.html" }
      ],
      afterFiles: [],
      fallback: []
    };
  }
};

export default nextConfig;
