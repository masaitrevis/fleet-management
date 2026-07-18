# Production Operations Manual

## Architecture Overview

The Fleet Management SaaS is a multi-tenant Next.js 15 application running on Docker containers, backed by PostgreSQL 16 for persistent storage and Redis 7 for caching, sessions, and real-time communication via Socket.IO. The architecture supports horizontal scaling through stateless application containers, with tenant isolation enforced at the database query level using Prisma ORM. Monitoring is handled by Prometheus (metrics), Grafana (dashboards), and Loki (log aggregation).

---

## Daily Operations

### Health Checks
Run these checks at the start of each shift:

```bash
# Application health
curl -f https://yourdomain.com/api/health
curl -f https://yourdomain.com/api/ready
curl -f https://yourdomain.com/api/version

# Database connectivity
./scripts/database/connection-test.sh

# Check recent error logs
docker logs --tail 100 fleet_app 2>&1 | grep -i error
```

### Monitoring Dashboard Review
1. Open Grafana at `https://grafana.yourdomain.com` (or port 3001)
2. Review the following dashboards:
   - **Application Overview**: Request rate, error rate, latency p95/p99
   - **Database**: Connection pool usage, query latency, slow queries
   - **Infrastructure**: CPU, memory, disk usage across all containers
3. Look for anomalies:
   - Error rate > 1%
   - p99 latency > 2 seconds
   - CPU usage > 70% sustained
   - Database connections > 80% of pool limit

### Log Review
Check Loki for critical errors:
```bash
# Via CLI (if configured)
curl "http://localhost:3100/loki/api/v1/query?query=%7Bjob%3D%22fleet_app%22%7D%20%7C%3D%20%22ERROR%22"
```

Focus on:
- Authentication failures (possible brute force)
- Database connection errors
- Unhandled exceptions (500 errors)
- Rate limiting triggers

### Backup Status
```bash
# Check latest backup
ls -lt backups/backup_*.sql.gz | head -3

# Verify backup age (should be < 25 hours)
find backups/ -name "backup_*.sql.gz" -mtime -1 | wc -l
```

---

## Weekly Operations

### Security Review
1. **Dependency updates**
   ```bash
   npm audit
   # Review and patch critical/high vulnerabilities
   npm audit fix
   ```

2. **SSL certificate expiry check**
   ```bash
   echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
   ```
   - Renew if expiry < 30 days

3. **Access log review**
   - Check for unusual login patterns
   - Review admin action audit logs
   - Verify no unauthorized API key usage

### Infrastructure Maintenance
1. **Disk usage check**
   ```bash
   df -h
   docker system df
   ```
   - Clean up old Docker images if > 80% disk usage
   - Archive old logs if Loki retention is exceeded

2. **Performance metrics review**
   - Database query performance (slow query log)
   - API endpoint response times
   - Cache hit/miss ratios

---

## Monthly Operations

### Database Optimization
```bash
# Run database maintenance (dev/staging, or maintenance window for prod)
./scripts/database/optimize.sh --dry-run   # Review first
./scripts/database/optimize.sh             # Execute
```

### Backup Verification
```bash
# Verify latest backup integrity
./scripts/backup/verify-backup.sh backups/backup_$(date +%Y-%m-%d)_*.sql.gz

# Test restore to temp database (monthly drill)
./scripts/backup/restore-db.sh backups/backup_*.sql.gz --force
# (Run against a temp database, not production)
```

### Security Audit
- Review all user accounts (suspended, inactive)
- Check RBAC permissions for changes
- Verify API key rotation schedule
- Review firewall rules and security group changes
- Run OWASP ZAP or similar security scan

### Capacity Planning
- Review growth trends (users, vehicles, trips)
- Check if current infrastructure can handle 2x growth
- Plan scaling actions if approaching limits

### Runbook Updates
- Update this document with any new procedures learned
- Document any incidents and resolutions
- Update emergency contact information

---

## Emergency Contacts

| Role | Contact | Method |
|------|---------|--------|
| On-call Engineer | [To be configured] | PagerDuty / Phone |
| Team Lead | [To be configured] | Slack / Phone |
| CTO | [To be configured] | Email / Phone |
| Infrastructure Provider | [To be configured] | Support Portal |
| Database Hosting | [To be configured] | Support Portal |

---

## Common Issues & Resolution

### Issue: High CPU

**Symptom:** Grafana shows CPU usage > 80% for sustained periods.

**Resolution:**
1. Identify the source:
   ```bash
   docker stats --no-stream
   top -p $(pgrep -d',' node)
   ```
2. If application container:
   - Check for runaway queries in database logs
   - Review recent deployments for performance regressions
   - Scale horizontally: add more app containers
3. If database:
   - Check for missing indexes on slow queries
   - Review connection pool usage
   - Consider read replica for read-heavy workloads

### Issue: Database Slow

**Symptom:** Query latency > 500ms for common operations.

**Resolution:**
1. Check slow query log:
   ```bash
   docker logs fleet_db 2>&1 | grep -i "duration"
   ```
2. Identify slow queries and add indexes:
   ```sql
   -- Example: add index on frequently queried column
   CREATE INDEX CONCURRENTLY idx_vehicle_company_status ON "Vehicle" ("companyId", status);
   ```
3. Check for table bloat:
   ```bash
   ./scripts/database/optimize.sh --dry-run
   ```
4. Verify connection pool is not exhausted:
   ```bash
   psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
   ```

### Issue: 502 Bad Gateway

**Symptom:** Nginx returns 502 errors.

**Resolution:**
1. Check if app container is running:
   ```bash
   docker ps | grep fleet_app
   ```
2. Check app health:
   ```bash
   docker logs --tail 50 fleet_app
   ```
3. Restart if needed:
   ```bash
   docker-compose --profile prod restart app
   ```
4. Check Nginx configuration:
   ```bash
   docker logs fleet_nginx
   ```

### Issue: Memory Leak

**Symptom:** Memory usage growing continuously without releasing.

**Resolution:**
1. Check container memory:
   ```bash
   docker stats --no-stream | grep fleet_app
   ```
2. Restart the app container:
   ```bash
   docker-compose --profile prod restart app
   ```
3. If recurring, investigate heap dump:
   ```bash
   # Enable heap dump in Node.js
   node --heap-prof app.js
   ```
4. Check for:
   - Unclosed database connections
   - Event listeners accumulating
   - Large objects in memory cache

### Issue: Redis Connection Errors

**Symptom:** Session errors, Socket.IO disconnections.

**Resolution:**
1. Check Redis status:
   ```bash
   docker exec fleet_redis redis-cli ping
   ```
2. Check memory usage:
   ```bash
   docker exec fleet_redis redis-cli info memory
   ```
3. If maxmemory reached, check eviction policy:
   ```bash
   docker exec fleet_redis redis-cli info eviction
   ```
4. Restart if unresponsive:
   ```bash
   docker-compose --profile prod restart redis
   ```
