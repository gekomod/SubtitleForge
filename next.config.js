/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  // Maksymalny rozmiar body dla API routes - to jest domyślnie 4MB
  // Jeśli potrzebujesz więcej, możesz skonfigurować to w samej route:
  // export const maxDuration = 60; // dla funkcji serverless
  // export const maxBodySize = '100mb'; // dla body parsera
}

module.exports = nextConfig