# Security Checklist

## Authentication
- [ ] Strong password policy enforced
- [ ] Multi-factor authentication support (MFA-ready)
- [ ] Session timeout after inactivity
- [ ] Secure token storage (httpOnly cookies)
- [ ] Account lockout after failed attempts

## Authorization
- [ ] RBAC implemented
- [ ] Principle of least privilege
- [ ] Tenant isolation verified
- [ ] API endpoints check permissions

## Input Validation
- [ ] All inputs validated (Zod schemas)
- [ ] File upload type/size validation
- [ ] Filename sanitization
- [ ] SQL injection prevention (Prisma ORM)

## Output Encoding
- [ ] XSS prevention (output encoding)
- [ ] CSP headers configured
- [ ] Content-Type headers set correctly

## Infrastructure
- [ ] HTTPS enforced
- [ ] Security headers (HSTS, X-Frame-Options, etc.)
- [ ] Rate limiting configured
- [ ] Error messages don't leak sensitive info

## Data Protection
- [ ] Sensitive data encrypted at rest
- [ ] PII handling compliant
- [ ] Audit logging enabled
- [ ] Data retention policy defined
