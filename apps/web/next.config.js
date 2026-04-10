/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@esolang-battle/db", "@esolang-battle/common"],
  async rewrites() {
    return [
      {
        source: '/api/trpc/:path*',
        destination: 'http://localhost:3000/trpc/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
