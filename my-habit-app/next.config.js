// next.config.js
const nextConfig = {
  // Vercel에서는 별도 설정이 없어도 자동으로 최적화됩니다.
  // 필요하다면 기타 옵션만 추가
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;

