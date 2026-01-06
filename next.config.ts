import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // 👈 Add this line to stop the Map crash
};

export default nextConfig;