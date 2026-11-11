/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone "מלווה" new-driver tracker lives as a static page in public/melave.
  async rewrites() {
    return [
      { source: "/melave", destination: "/melave/index.html" },
      { source: "/melave/", destination: "/melave/index.html" },
    ];
  },
};

module.exports = nextConfig;
