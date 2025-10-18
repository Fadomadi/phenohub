import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://10.10.5.168:3002"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tmpfiles.org",
        pathname: "/dl/**",
      },
      {
        protocol: "https",
        hostname: "tmpfiles.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ojsnhkocpinlgvyrlmfl.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
