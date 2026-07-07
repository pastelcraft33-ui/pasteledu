/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nwkxpcqjtmhsuakgupjn.supabase.co"
      }
    ]
  }
};

export default nextConfig;
