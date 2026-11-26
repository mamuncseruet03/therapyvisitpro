import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Keep production builds within the memory available on the EC2 instance.
    cpus: 1,
  },
};

export default nextConfig;
