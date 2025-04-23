/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async rewrites() {
    return [
      {
        // Exclude /api/auth using a negative lookahead
        source: '/api/((?!auth/).*)',
        destination: 'http://localhost:5000/api/$1', // Proxy API requests to our Express backend
      },
    ];
  },
};

module.exports = nextConfig; 