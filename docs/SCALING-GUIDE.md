# Scaling Guide

## Horizontal Scaling

### Application Layer
- **Multiple app containers** behind Nginx load balancer
- **Stateless design**: No local session storage — all sessions in Redis
- **Deployment**: Rolling updates with zero downtime

```yaml
# docker-compose.yml (scaled)
services:
  app-1:
    build: .
    ports: ["3001:3000"]
  app-2:
    build: .
    ports: ["3002:3000"]
  app-3:
    build: .
    ports: ["3003:3000"]
  nginx:
    depends_on: [app-1, app-2, app-3]
```

### Session State
- All sessions stored in **Redis**
- JWT tokens validated statelessly
- Socket.IO uses Redis adapter for cross-server communication

### Database
- **Read replicas** for read-heavy workloads (reports, analytics)
- Write operations always go to primary
- Prisma connection pooling handles replica routing

### Cache
- **Redis Cluster** for distributed caching
- Cache invalidation via key patterns or TTL
- Separate Redis instances for sessions vs. cache if needed

### File Storage
- **Object storage (S3)** for all uploads (vehicle images, documents)
- Cloudinary already configured for image optimization
- Never store uploaded files on local disk

---

## Vertical Scaling

### Application Containers
- Increase CPU cores and memory allocation
- Node.js benefits from more memory for heap (`--max-old-space-size`)
- Consider using `worker_threads` for CPU-intensive tasks

### PostgreSQL
- Increase `shared_buffers` (typically 25% of RAM)
- Increase `work_mem` for complex queries
- Tune `effective_cache_size` for query planner
- Use SSD storage for database volumes

### Redis
- Increase `maxmemory` limit
- Monitor memory fragmentation
- Enable persistence (RDB + AOF) for critical data

---

## Database Scaling

### Read Replicas
Route read queries to replicas to offload the primary:

```typescript
// Example: Prisma with read replica
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,        // Primary (writes)
    },
  },
})

// For reads, use a separate Prisma instance pointing to replica
const prismaRead = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_REPLICA_URL,  // Read replica
    },
  },
})
```

### Connection Pooling
Use **PgBouncer** between app and database:
- Reduces connection overhead
- Handles connection spikes gracefully
- Recommended pool size: `(CPU cores * 2) + effective_spindle_count`

```yaml
# docker-compose.yml
  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    environment:
      DATABASES_HOST: db
      DATABASES_PORT: 5432
      DATABASES_DATABASE: fleet_management
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 25
```

### Query Optimization
- Add indexes on frequently queried columns
- Use materialized views for complex reports
- Partition large tables by date or tenant
- Regular `ANALYZE` after significant data changes

### Multi-Tenant Sharding (Future)
For very large tenants, consider:
- **Schema per tenant**: Isolated but harder to manage at scale
- **Database per tenant**: Maximum isolation, highest overhead
- **Row-level with partitioning**: Best balance for most cases

---

## CDN Scaling

### Static Assets
- **CloudFront** (AWS) or **Cloudflare** for global static asset delivery
- Cache static files at edge locations
- Configure long TTLs for versioned assets

### Images
- **Cloudinary** already handles image optimization and CDN delivery
- Use responsive image sizes to reduce bandwidth
- Leverage Cloudinary's automatic format selection (WebP/AVIF)

### API Responses
- Cache frequently accessed data in Redis:
  - Company settings
  - Vehicle lists (with short TTL)
  - Dashboard summaries
- Use cache tags for efficient invalidation

---

## Queue Scaling

### Background Jobs
Use **BullMQ** with Redis for job processing:

```typescript
// Queue setup
import { Queue } from 'bullmq'

const emailQueue = new Queue('email', { connection: redisConnection })
const reportQueue = new Queue('report', { connection: redisConnection })
```

### Worker Scaling
Scale workers horizontally based on queue depth:

```bash
# Monitor queue depth
docker exec fleet_redis redis-cli LLEN bull:email:wait

# Scale workers up when queue depth > 100
docker-compose --profile prod up -d --scale worker=3
```

### Queue Separation
Separate queues by job type for independent scaling:

| Queue | Priority | Workers | Description |
|-------|----------|---------|-------------|
| `email` | Medium | 2 | Email notifications |
| `notification` | High | 2 | Real-time notifications |
| `report` | Low | 1 | Scheduled reports |
| `import` | Low | 1 | Bulk data imports |
| `export` | Low | 1 | Data exports |

---

## Scaling Checklist

Before scaling, verify:

- [ ] Current bottleneck identified (CPU, memory, DB, network)
- [ ] Monitoring dashboards show clear resource exhaustion
- [ ] Database query optimization attempted first
- [ ] Caching strategy reviewed and optimized
- [ ] Load test results justify the scaling action
- [ ] Cost impact calculated and approved
- [ ] Rollback plan documented
