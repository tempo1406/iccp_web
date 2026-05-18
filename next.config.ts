import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  /**
   * Packages that import Node.js APIs (fs, crypto, net, etc.) must be treated as
   * server-only externals so Next.js does not bundle them into the client chunk.
   */
  serverExternalPackages: ['superjson'],

  /**
   * Strict mode surfaces double-invocation bugs early in development.
   */
  reactStrictMode: true,

  /**
   * Disable the X-Powered-By header to reduce fingerprinting.
   */
  poweredByHeader: false,

  /**
   * Remote image allowlist used by next/image in the team chat mocks.
   */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
