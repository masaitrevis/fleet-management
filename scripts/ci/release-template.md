# Release {{VERSION}}

## 🚀 What's New

{{CHANGELOG}}

## 📝 Changes

<!-- List major changes, features, and improvements -->

- 
- 
- 

## ⚠️ Breaking Changes

<!-- List any breaking changes that require user action -->

**None** (or list below)

- 

## 🔄 Migration Notes

<!-- Provide migration steps for breaking changes -->

### Database Migrations

Run the following after deployment:

```bash
npx prisma migrate deploy
```

### Environment Variables

<!-- List any new or changed environment variables -->

| Variable | Change | Description |
|----------|--------|-------------|
| | | |

## 🐛 Bug Fixes

<!-- List bug fixes included in this release -->

- 

## 🔒 Security

<!-- List security fixes or improvements -->

- 

## 📦 Deployment

### Docker Image

```bash
docker pull ghcr.io/{{REPO}}:{{VERSION}}
docker pull ghcr.io/{{REPO}}:latest
```

### Render

Deploy using the Render deploy hook or push the tag to trigger automatic deployment.

### VPS (Docker Compose)

```bash
git checkout {{VERSION}}
docker-compose pull
docker-compose up -d
npx prisma migrate deploy
```

## 👥 Contributors

<!-- List contributors to this release -->

- @benjamin-masai

---

**Full Changelog**: {{COMPARE_URL}}
