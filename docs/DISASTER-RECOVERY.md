# Disaster Recovery Plan

## Overview

This document outlines the disaster recovery (DR) procedures for the Fleet Management SaaS platform. It covers data backup strategies, recovery procedures for common failure scenarios, failover architecture, and communication protocols.

**Recovery Time Objective (RTO):** 1 hour  
**Recovery Point Objective (RPO):** 15 minutes (with continuous backups)

---

## Backup Strategy

### Schedule
- **Daily full backups** at 2:00 AM UTC
- **Hourly incremental backups** via PostgreSQL WAL archiving
- **Continuous WAL archiving** for point-in-time recovery (PITR)

### Storage
Backups are stored in **3 locations** for redundancy:

1. **Local**: `backups/` directory on the application server
2. **Cloud**: AWS S3 (or equivalent object storage)
3. **Offsite**: Secondary data center or separate cloud region

### Retention Policy
| Frequency | Retention |
|-----------|-----------|
| Daily | 30 days |
| Monthly | 12 months |
| Yearly | 7 years |

### Backup Verification
- Automated integrity checks run weekly via `scripts/backup/verify-backup.sh`
- Test restores performed monthly to a temporary database
- Backup size and duration logged for trend monitoring

---

## Recovery Procedures

### Scenario 1: Database Corruption

Database corruption may be detected by:
- PostgreSQL error logs showing checksum failures
- Application errors on queries that previously worked
- Prisma migration failures with data integrity errors
- Automated health checks failing

**Steps:**

1. **Stop the application** to prevent further writes
   ```bash
   docker-compose --profile prod stop app
   ```

2. **Identify the last known good backup**
   ```bash
   ls -lt backups/backup_*.sql.gz | head -5
   ```

3. **Restore the database**
   ```bash
   ./scripts/backup/restore-db.sh backups/backup_YYYY-MM-DD_HH-MM-SS.sql.gz
   ```

4. **Verify data integrity**
   ```bash
   ./scripts/database/status.sh
   ```

5. **Restart the application**
   ```bash
   docker-compose --profile prod up -d app
   ```

6. **Run smoke tests**
   ```bash
   npm run test:production:smoke
   ```

### Scenario 2: Complete Server Failure

**Steps:**

1. **Provision a new server** or promote the hot standby
   - Use infrastructure-as-code (Terraform/CloudFormation) if available
   - Ensure same or better specs than the failed server

2. **Restore Docker Compose stack**
   ```bash
   git clone <repo> /opt/fleet-saas
   cd /opt/fleet-saas
   cp .env.production .env
   docker-compose --profile prod pull
   ```

3. **Restore database from latest backup**
   ```bash
   ./scripts/backup/restore-db.sh backups/backup_YYYY-MM-DD_HH-MM-SS.sql.gz --force
   ```

4. **Restore Redis** from RDB persistence
   ```bash
   # If Redis AOF/RDB is backed up:
   docker cp redis_backup.aof fleet_redis:/data/
   docker restart fleet_redis
   ```

5. **Update DNS** to point to the new server IP
   - Lower TTL to 300 seconds ahead of time for quick failover
   - Update A records in DNS provider

6. **Verify health checks**
   ```bash
   curl -f https://yourdomain.com/api/health
   curl -f https://yourdomain.com/api/ready
   ```

7. **Notify users** via status page, email, or in-app notification

### Scenario 3: Data Loss (Specific Tables)

When only specific tables are affected (e.g., accidental DELETE without WHERE):

**Steps:**

1. **Identify affected tables** from the backup
   ```bash
   gunzip -c backups/backup_*.sql.gz | grep -E "^COPY.*FROM stdin" | head -20
   ```

2. **Restore to a temporary database**
   ```bash
   # Create temp DB
   psql $DATABASE_URL -c "CREATE DATABASE fleet_recovery;"
   # Restore backup to temp DB
   gunzip -c backups/backup_*.sql.gz | psql <temp-db-url>
   ```

3. **Export affected data**
   ```bash
   psql $TEMP_DB_URL -c "\copy (SELECT * FROM \"AffectedTable\") TO '/tmp/affected_data.csv' CSV HEADER;"
   ```

4. **Import into production** (with extreme caution)
   ```bash
   # Use INSERT with ON CONFLICT or UPDATE where appropriate
   psql $DATABASE_URL -c "COPY \"AffectedTable\" FROM '/tmp/affected_data.csv' CSV HEADER;"
   ```

5. **Verify counts**
   ```bash
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"AffectedTable\";"
   ```

### Scenario 4: Ransomware / Security Breach

**Steps:**

1. **Isolate affected systems**
   - Disconnect compromised servers from network
   - Block suspicious IPs at firewall/Cloudflare

2. **Revoke all sessions and API keys**
   - Clear all Redis session data: `docker exec fleet_redis redis-cli FLUSHDB`
   - Rotate JWT secret (immediately invalidates all tokens)
   - Revoke and regenerate all API keys

3. **Rotate all secrets**
   ```bash
   # JWT Secret
   openssl rand -base64 32
   # Database password (via hosting provider)
   # Redis password
   # Any third-party API keys (Resend, M-Pesa, etc.)
   ```

4. **Restore from pre-breach backup**
   - Identify the last clean backup (before the breach timestamp)
   - Use `restore-db.sh` with `--force` flag

5. **Security audit**
   - Review access logs for unauthorized activity
   - Check for backdoors or modified files
   - Run vulnerability scan
   - Review all admin accounts for unauthorized changes

6. **Gradual re-enablement**
   - Enable app in read-only mode first
   - Monitor for anomalous activity
   - Gradually restore write access after 24h clean period

---

## Failover Architecture

### Primary Site
- **Application**: Render / VPS (production)
- **Database**: PostgreSQL Primary (read/write)
- **Cache**: Redis Primary

### Secondary Site
- **Application**: Staging environment (can be promoted)
- **Database**: Read replica (if configured) or restore from backup
- **Cache**: Redis replica

### DNS Configuration
- **TTL**: 300 seconds for rapid failover
- **Health checks**: Automated failover via Cloudflare or AWS Route 53
- **Failover trigger**: Health endpoint returns 5xx for 2 consecutive minutes

### Database Replication
- **Primary**: Read/write operations
- **Replica**: Read-only queries (can be promoted to primary)
- **WAL archiving**: Continuous for PITR

---

## Communication Plan

### Incident Response Timeline

| Time | Action | Responsible |
|------|--------|-------------|
| T+0 min | Incident detected (automated alert) | Monitoring system |
| T+5 min | On-call engineer notified | PagerDuty / Slack |
| T+15 min | Initial assessment and triage | On-call engineer |
| T+30 min | Decision: repair or failover | On-call engineer |
| T+60 min | RTO target — service restored | Engineering team |
| T+2h | Post-incident communication to users | Support team |
| T+24h | Post-mortem completed | Engineering + management |

### Escalation Path

```
Incident Detected
       ↓
On-call Engineer (auto-assigned)
       ↓
RTO exceeded (1h) → Escalate to Team Lead
       ↓
RPO exceeded (15m data loss) → Escalate to CTO
       ↓
Security breach → Immediate CTO + Legal
```

### Communication Channels

| Audience | Channel | Timing |
|----------|---------|--------|
| Engineering team | Slack #incidents | Immediate |
| Management | Email + Slack DM | Within 15 min |
| Customers | Status page + email | After assessment |
| External stakeholders | Scheduled update | Every 2 hours during incident |

### Post-Incident Requirements
- **Post-mortem document** within 24 hours
- **Root cause analysis** with timeline
- **Action items** for prevention
- **Communication summary** sent to all stakeholders
