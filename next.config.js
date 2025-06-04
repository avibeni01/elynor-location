/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['elynortours.com', 'upload.wikimedia.org'],
  },
}

export default nextConfig
