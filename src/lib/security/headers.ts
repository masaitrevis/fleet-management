import type { NextConfig } from 'next';

export function securityHeaders() {
  return [
    {
      key: 'Content-Security-Policy',
      value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' blob: data: https://res.cloudinary.com https://*.amazonaws.com",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
    },
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    },
    {
      key: 'X-Frame-Options',
      value: 'DENY',
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
    },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=()',
    },
    {
      key: 'X-DNS-Prefetch-Control',
      value: 'on',
    },
  ];
}

export function withSecurityHeaders(config: NextConfig = {}): NextConfig {
  return {
    ...config,
    async headers() {
      const existingHeaders = (await config.headers?.()) || [];
      return [
        ...existingHeaders,
        {
          source: '/(.*)',
          headers: securityHeaders(),
        },
      ];
    },
  };
}
