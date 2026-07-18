# Infrastructure Diagram

## High-Level Architecture

```
                                    [Internet]
                                       |
                                 [Cloudflare / DNS]
                                       |
                              [Nginx (80/443)]
                                       |
                              [Load Balancer]
                                       |
                    +------------------+------------------+
                    |                  |                  |
               [App 1]           [App 2]           [App 3]
               Next.js           Next.js           Next.js
               Port 3000         Port 3000         Port 3000
                    |                  |                  |
                    +------------------+------------------+
                                       |
                              [Redis Cluster]
                              - Sessions
                              - Cache
                              - Socket.IO Adapter
                              - Rate Limiting
                              - Job Queue (BullMQ)
                                       |
                              [PostgreSQL Primary]
                              - Read/Write Operations
                              - Automated Backups
                              - WAL Archiving
                                       |
                              [PostgreSQL Replica]
                              - Read-Only Queries
                              - Failover Target
                                       |
                    +------------------+------------------+
                    |                  |                  |
             [Prometheus]       [Grafana]          [Loki]
             Metrics            Dashboards         Log Aggregation
                    |                  |                  |
                    +------------------+------------------+
                                       |
                              [Alert Manager]
                                       |
                         [PagerDuty / Slack / Email]
```

## Component Details

### Edge Layer
| Component | Purpose | Technology |
|-----------|---------|------------|
| Cloudflare | DDoS protection, CDN, DNS | Cloudflare Pro/Business |
| Nginx | Reverse proxy, SSL termination, rate limiting | nginx:alpine |

### Application Layer
| Component | Purpose | Scaling |
|-----------|---------|---------|
| App Containers | Next.js 15 application | Horizontal — add/remove containers |
| Load Balancer | Distribute traffic | Nginx round-robin |

### Data Layer
| Component | Purpose | Persistence |
|-----------|---------|-------------|
| PostgreSQL Primary | All read/write operations | Persistent volume + WAL archiving |
| PostgreSQL Replica | Read-only queries, failover | Persistent volume |
| Redis | Sessions, cache, real-time, queues | RDB + AOF persistence |

### Monitoring Layer
| Component | Purpose | Data Source |
|-----------|---------|-------------|
| Prometheus | Metrics collection | App metrics, system metrics |
| Grafana | Visualization | Prometheus, Loki |
| Loki | Log aggregation | Application logs |
| Promtail | Log shipping | Docker container logs |
| Alert Manager | Alert routing | Prometheus alerts |

## Network Flow

### User Request Flow
```
User → Cloudflare (DNS + WAF) → Nginx (SSL) → Load Balancer → App Container
                                                                    ↓
                                                              Redis (session check)
                                                                    ↓
                                                              PostgreSQL (data)
                                                                    ↓
                                                              Response → User
```

### Real-Time Communication (Socket.IO)
```
User → WebSocket → Nginx (proxy_upgrade) → App Container
                                              ↓
                                         Redis Pub/Sub (cross-server sync)
                                              ↓
                                         All connected clients receive update
```

### Background Job Processing
```
App → Queue Job (BullMQ) → Redis List
                                ↓
                         Worker Container(s)
                                ↓
                         Process job → Database update → Notify user
```

## Backup Flow

```
PostgreSQL Primary ──→ pg_dump ──→ Local Backup (backups/)
              │
              └──→ WAL Archiving ──→ S3 / Object Storage
              │
              └──→ Automated ──→ Offsite Storage
```

## Failover Flow

### Primary Database Failure
```
[Primary DB Down] → [Health Check Fails] → [Promote Replica to Primary]
                                              ↓
                                       [Update App Config]
                                              ↓
                                       [Resume Operations]
```

### Application Container Failure
```
[App Container Down] → [Health Check Fails] → [Load Balancer Removes Container]
                                                   ←
                                         [Auto-restart / New Container] ─┘
```

## Security Perimeter

```
┌─────────────────────────────────────────────────────────────┐
│                      Public Internet                         │
└─────────────────────────────────────────────────────────────┘
                           │
                    [Cloudflare WAF]
                           │
┌─────────────────────────────────────────────────────────────┐
│                    DMZ / Edge Zone                           │
│  • Nginx (SSL termination, rate limiting)                   │
│  • DDoS protection                                          │
└─────────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│                   Application Zone                           │
│  • Next.js containers (stateless)                           │
│  • Health checks                                            │
└─────────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│                    Data Zone                                 │
│  • PostgreSQL (network isolated)                            │
│  • Redis (network isolated)                                 │
└─────────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│                 Monitoring Zone                              │
│  • Prometheus, Grafana, Loki (internal access only)         │
└─────────────────────────────────────────────────────────────┘
```

## Port Reference

| Service | Port | Protocol | Access |
|---------|------|----------|--------|
| Nginx HTTP | 80 | TCP | Public |
| Nginx HTTPS | 443 | TCP | Public |
| Next.js App | 3000 | TCP | Internal |
| Grafana | 3001 | TCP | Internal/VPN |
| PostgreSQL | 5432 | TCP | Internal |
| Redis | 6379 | TCP | Internal |
| Prometheus | 9090 | TCP | Internal |
| Loki | 3100 | TCP | Internal |
| MailHog (dev) | 8025 | TCP | Local only |

## Resource Requirements (Per Container)

| Service | CPU | Memory | Storage |
|---------|-----|--------|---------|
| App | 1 core | 1 GB | — |
| PostgreSQL | 2 cores | 4 GB | 50 GB SSD |
| Redis | 0.5 core | 256 MB | 5 GB |
| Nginx | 0.5 core | 256 MB | — |
| Prometheus | 1 core | 2 GB | 20 GB |
| Grafana | 0.5 core | 512 MB | 5 GB |
| Loki | 1 core | 1 GB | 50 GB |
