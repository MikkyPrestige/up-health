import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // RainbowKit pulls in Coinbase's Base Account / CDP SDK transitively (for
  // a wallet connector this project doesn't even use), which references
  // optional @x402 payment-protocol packages that aren't installed. Next's
  // bundler otherwise tries to statically resolve those at build time and
  // fails - externalizing these tells it to leave them alone rather than
  // bundle/analyze them.
  serverExternalPackages: ["@coinbase/cdp-sdk", "@base-org/account"],
};

export default nextConfig;
