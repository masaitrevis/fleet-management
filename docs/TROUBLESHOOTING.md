# Troubleshooting Guide

## Build Failures

### TypeScript Errors

**Check:**
```bash
npx tsc --noEmit
```

**Common fixes:**
- Ensure Prisma client is generated: `npx prisma generate`
- Check for missing type imports
- Review recent schema changes that may affect types
- Use `skipLibCheck: true` in `tsconfig.json` for third-party type issues

**If errors persist:**
1. Clear build cache: `rm -rf .next tsconfig.tsbuildinfo`
2. Regenerate Prisma client: `npx prisma generate`
3. Reinstall dependencies: `rm -rf node_modules && npm install`
4. Rebuild: `npm run build`

### Prisma Errors

**"Prisma Client is not generated"**
```bash
npx prisma generate
```

**"Migration is locked"**
```bash
# Check migration status
npx prisma migrate status
# If stuck, unlock (dev only!)
npx prisma migrate resolve --rolled-back <migration_name>
```

**"Database connection error"**
1. Verify `DATABASE_URL` is correct
2. Check PostgreSQL is running: `docker ps | grep fleet_db`
3. Test connection: `./scripts/database/connection-test.sh`

### npm / Node Issues

**"Module not found" after install**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Out of memory during build**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

---

## Runtime Errors

### 500 Internal Server Error

**1. Check application logs:**
```bash
docker logs --tail 100 fleet_app
# Or for dev:
npm run dev 2>&1 | grep -i error
```

**2. Check error tracking** (Sentry if configured)

**3. Common causes:**
- Database connection pool exhausted
- Missing environment variable
- Prisma query error (check for null values)
- Unhandled promise rejection

**4. Quick restart:**
```bash
docker-compose --profile prod restart app
```

### Database Connection Errors

**"Connection refused"**
```bash
# Check if PostgreSQL is running
docker ps | grep fleet_db

# If not running, start it
docker-compose --profile prod up -d db

# Check logs
docker logs fleet_db
```

**"Too many connections"**
```bash
# Check active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Check max connections
psql $DATABASE_URL -c "SHOW max_connections;"

# Restart app to clear stale connections
docker-compose --profile prod restart app
```

**"Connection pool timeout"**
- Increase Prisma connection pool size in schema:
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  ```
- Or set via connection string: `?connection_limit=20`

### Memory Issues

**"JavaScript heap out of memory"**
```bash
# Increase heap size
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

**Container memory limit reached**
```bash
# Check memory usage
docker stats --no-stream

# Increase container memory limit in docker-compose.yml:
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
```

**Memory leak detection**
```bash
# Enable heap profiling
node --heap-prof dist/server.js

# Analyze with Chrome DevTools
# Load the .heapprofile file in Chrome → Memory tab
```

### Socket.IO Connection Issues

**"WebSocket connection failed"**

1. **Check WebSocket proxy in Nginx:**
   ```nginx
   location /socket.io/ {
       proxy_pass http://app:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
   }
   ```

2. **Verify Redis is running** (for multi-server Socket.IO):
   ```bash
   docker exec fleet_redis redis-cli ping
   ```

3. **Check firewall rules:**
   ```bash
   # Ports should be open
   # 80, 443 (HTTP/HTTPS)
   # 3000 (app — internal only)
   # 6379 (Redis — internal only)
   ```

### Authentication Issues

**"Invalid token" / "Session expired"**
1. Check JWT secret hasn't changed
2. Verify Redis is running (sessions stored there)
3. Check token expiry settings
4. Clear browser cookies and re-login

**"Cannot login"**
1. Check `NEXTAUTH_URL` matches your domain
2. Verify database connection
3. Check if user account is active (not suspended)
4. Review failed login attempts (rate limiting)

---

## Deployment Issues

### Docker Build Fails

**"Cannot find module" in Docker**
```dockerfile
# Ensure node_modules is copied
COPY package*.json ./
RUN npm ci --only=production
COPY . .
```

**"Prisma Client not found" in container**
```dockerfile
# Generate Prisma client during build
RUN npx prisma generate
```

### Render Deployment Issues

**"Build failed on Render"**
1. Check Render dashboard for build logs
2. Verify all environment variables are set in Render dashboard
3. Ensure `render.yaml` is up to date
4. Check if build command in `render.yaml` matches package.json scripts

**"Application crashed after deploy"**
1. Check Render logs for error messages
2. Verify database is accessible from Render (network/whitelist)
3. Check if migration was applied: `npx prisma migrate status`
4. Rollback to previous deploy if needed

---

## Performance Issues

### Slow Page Loads

**Diagnose:**
```bash
# Check network waterfall in browser DevTools
# Look for:
# - Large JS bundles
# - Slow API responses
# - Unoptimized images
```

**Fixes:**
1. Enable Next.js image optimization
2. Code-split heavy components
3. Add database indexes for slow queries
4. Enable Redis caching for frequently accessed data

### High Database CPU

**Find slow queries:**
```sql
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Add indexes:**
```sql
-- Example: Index for common filter
CREATE INDEX CONCURRENTLY idx_vehicle_company_status
ON "Vehicle" ("companyId", status);
```

---

## Getting Help

If an issue isn't resolved by this guide:

1. **Check logs first:** Always start with `docker logs`
2. **Search issues:** Check GitHub issues and discussions
3. **Gather info:**
   - Error message (full stack trace)
   - Environment (dev/staging/prod)
   - Recent changes (deployments, config changes)
   - Reproduction steps
4. **Contact:** [To be configured — support channel]
