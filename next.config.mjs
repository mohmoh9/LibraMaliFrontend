/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http",  hostname: "localhost" },
      { protocol: "http",  hostname: "127.0.0.1" },
      // Optionnel : Ajoute explicitement le domaine Render pour plus de sécurité
      { protocol: "https", hostname: "libramali-backend.onrender.com" },
    ],
  },
  
  async rewrites() {
    // On ne fait le rewrite que si on est en local pour éviter les conflits CORS en prod
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;