import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle so the Docker image can run without
  // installing node_modules at runtime (see Dockerfile).
  output: "standalone",
};

export default nextConfig;
