/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // The optimizer can stall when the dev cache lives on an exFAT workspace.
    // Vercel production keeps optimization enabled.
    unoptimized: process.env.NODE_ENV === "development",
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nwkxpcqjtmhsuakgupjn.supabase.co"
      }
    ]
  }
};

export default nextConfig;
