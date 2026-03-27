/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.compass.com',
        pathname: '/m/**',
      },
      {
        protocol: 'https',
        hostname: 'compass.com',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
