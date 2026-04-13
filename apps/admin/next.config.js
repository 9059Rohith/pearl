/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@publication/shared'],
  output: 'standalone',
};

module.exports = nextConfig;
