/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Autorise temporairement tous les domaines pour le test
      },
      {
        protocol: 'http',
        hostname: 'localhost', // Si tes images viennent de ton backend local Spring Boot
        port: '8080',
      },
    ],
  },
};

export default nextConfig;