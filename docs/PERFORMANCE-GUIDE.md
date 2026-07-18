# Performance Optimization Guide

## Frontend Performance

### Bundle Optimization
- Use dynamic imports for heavy components
- Code split by route (automatic in Next.js App Router)
- Tree shaking with ES modules
- Analyze bundle with `@next/bundle-analyzer`

### Image Optimization
- Always use `next/image` instead of `<img>`
- Provide width/height to prevent CLS
- Use `priority` for above-the-fold images
- Use appropriate formats (WebP, AVIF)

### Font Optimization
- Use `next/font` for self-hosted fonts
- Preload critical fonts
- Use `font-display: swap`

### React Performance
- Use `React.memo()` for expensive components
- Use `useMemo()` for expensive computations
- Use `useCallback()` for stable function references
- Avoid inline object/array creation in render

## Backend Performance

### Database Optimization
- Use Prisma connection pooling
- Add indexes for frequently queried fields
- Use `select` to limit returned fields
- Batch queries where possible
- Use Prisma's `findUnique` over `findFirst` when possible

### API Optimization
- Implement response caching
- Use pagination for large datasets
- Compress responses with gzip/brotli
- Implement rate limiting
- Use CDN for static assets

### Caching Strategy
- In-memory cache for frequently accessed data (src/lib/cache.ts)
- Next.js ISR for semi-static pages
- HTTP caching headers for API responses
- Redis recommended for production

## Targets
- Lighthouse Score ≥ 95
- First Contentful Paint < 2s
- Largest Contentful Paint < 2.5s
- Time to Interactive < 3.5s
- Cumulative Layout Shift < 0.1
