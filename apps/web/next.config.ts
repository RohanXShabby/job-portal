import "@job-portal/env/web";
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  turbopack: {
    root: path.resolve(__dirname, "../../"),
  },
};

export default nextConfig;
