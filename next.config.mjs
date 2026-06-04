/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['web-push'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
