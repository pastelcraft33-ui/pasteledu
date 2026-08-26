/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
