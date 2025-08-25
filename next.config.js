/** @type {import('next').NextConfig} */
const nextConfig = {
  // Serve static files from Vite build output
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: '/api/static/:path*',
        has: [
          {
            type: 'header',
            key: 'accept',
            value: '(?!.*api).*',
          },
        ],
      },
    ]
  },
  
  // Handle static file serving
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  
  // Server external packages
  serverExternalPackages: ['bcryptjs'],
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

export default nextConfig