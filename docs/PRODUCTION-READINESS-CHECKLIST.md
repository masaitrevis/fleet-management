# Production Readiness Checklist

Use this checklist before every production deployment to ensure system stability, security, and operational readiness.

---

## Pre-Deployment

### Code Quality
- [ ] All unit tests passing (`npm run test`)
- [ ] All integration tests passing
- [ ] TypeScript compiles with zero errors (`npx tsc --noEmit`)
- [ ] ESLint passes with zero warnings (`npm run lint`)
- [ ] Prettier formatting checked (`npx prettier --check .`)

### Security
- [ ] Security scan: zero critical/high vulnerabilities (`npm audit`)
- [ ] No secrets or credentials in code (verified with `git-secrets` or `truffleHog`)
- [ ] JWT secret is strong (≥ 256 bits) and not using default value
- [ ] Database password is strong and not reused
- [ ] All API endpoints have authentication/authorization middleware
- [ ] Rate limiting enabled on public endpoints
- [ ] File upload restrictions configured (size, type, extension)
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] CORS policy restricted to known domains

### Database
- [ ] Database migrations reviewed and tested in staging
- [ ] Migration rollback plan documented and tested
- [ ] Database backup completed successfully before deploy
- [ ] No destructive migrations without data migration scripts
- [ ] Indexes added for new frequently-queried columns

### Infrastructure
- [ ] Environment variables configured for production
- [ ] SSL certificate obtained and valid (not expiring within 30 days)
- [ ] Domain DNS configured and propagated
- [ ] Backup system configured and tested (`scripts/backup/backup-db.sh`)
- [ ] Log aggregation configured (Loki or equivalent)
- [ ] Error tracking configured (Sentry or equivalent)
- [ ] Session timeout configured (24 hours recommended)

### Monitoring & Alerting
- [ ] Monitoring dashboards configured (Grafana)
- [ ] Alerting rules configured (Prometheus Alertmanager)
- [ ] Health check endpoints responding (`/api/health`, `/api/ready`)
- [ ] Error rate baseline established
- [ ] Paging/notification system tested

---

## Deployment

### Staging Validation
- [ ] Staging deployment successful
- [ ] Smoke tests pass on staging (`tests/production/smoke.test.ts`)
- [ ] Performance tests pass on staging (Artillery/K6)
- [ ] Security scan passes on staging
- [ ] Database migration applied successfully on staging
- [ ] All features tested manually on staging
- [ ] Rollback plan documented and tested

### Production Deploy
- [ ] Production deployment approved by team lead
- [ ] Deploy during low-traffic window (recommended: early morning UTC)
- [ ] Database backup taken immediately before deploy
- [ ] Maintenance page ready (if needed)

### Post-Deploy Verification
- [ ] Monitor for 30 minutes after production deploy
- [ ] Verify all health checks passing (`/api/health`)
- [ ] Verify error rate is normal (< 1%)
- [ ] Verify no 5xx errors in logs
- [ ] Verify database connectivity
- [ ] Verify Redis connectivity
- [ ] Verify critical user flows (login, dashboard, key features)
- [ ] Notify team of successful deployment

---

## Post-Deployment

### Monitoring Period
- [ ] Monitor for 24 hours after deployment
- [ ] Check daily backup ran successfully
- [ ] Review monitoring dashboards (hourly for first 4 hours)
- [ ] Review error logs for new errors
- [ ] Review performance metrics for regressions

### Validation
- [ ] Verify customer-facing features work correctly
- [ ] Verify admin dashboard functionality
- [ ] Check report generation works
- [ ] Verify email notifications are sending
- [ ] Test critical integrations (M-Pesa, GPS, etc.)

### Documentation
- [ ] Update documentation if schema or API changed
- [ ] Update API documentation (Swagger/OpenAPI)
- [ ] Write deployment notes in team channel/wiki
- [ ] Update changelog with release notes

### Rollback Preparedness
- [ ] Previous version container image tagged and available
- [ ] Database can be restored from pre-deploy backup
- [ ] Rollback procedure tested and documented
- [ ] Team knows rollback trigger conditions

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Deployer | | | |
| Reviewer | | | |
| Team Lead | | | |

---

## Emergency Contacts

| Role | Contact | Method |
|------|---------|--------|
| On-call Engineer | [To be configured] | PagerDuty |
| Team Lead | [To be configured] | Slack / Phone |
| CTO | [To be configured] | Email / Phone |
