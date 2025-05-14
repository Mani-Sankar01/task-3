/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    BACKEND_API_URL: process.env.BACKEND_API_URL,
  },
};

export default nextConfig;
