import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	cacheComponents: true,
	partialPrefetching: true,
	experimental: {
		optimizePackageImports: ["@chakra-ui/react"],
	},
};

export default nextConfig;
