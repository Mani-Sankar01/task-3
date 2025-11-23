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
    NEXT_PUBLIC_DOCUMENTS_API_URL: process.env.NEXT_PUBLIC_DOCUMENTS_API_URL,
    NEXT_PUBLIC_GST_BACKEND_URL: process.env.NEXT_PUBLIC_GST_BACKEND_URL,
    GST_BACKEND_URL: process.env.GST_BACKEND_URL,
  },
};

export default nextConfig;
