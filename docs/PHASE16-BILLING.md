# Phase 16: Billing, Subscription & Multi-Tenant SaaS Administration

## Overview
Complete billing and subscription management module for the multi-tenant fleet management SaaS platform. Supports multiple pricing tiers, usage-based limits, feature flags, coupon codes, and integrated payment processing (Stripe + M-Pesa).

## Schema Changes

### Extended Models
- `SubscriptionPlan` - Pricing tiers with configurable limits
- `CompanySubscription` - Tenant subscription state
- `Invoice` - Billing documents
- `Payment` - Payment records

### New Models
- `UsageRecord` - Resource consumption tracking per billing period
- `FeatureFlag` - Per-tenant feature enablement
- `Coupon` - Discount codes and referral programs
- `CouponUsage` - Coupon redemption tracking

### New/Extended Enums
- `SubscriptionStatus` - Added `PAUSED`, `GRACE_PERIOD`
- `DiscountType` - `PERCENTAGE`, `FIXED`, `FREE_TRIAL_EXTENSION`, `REFERRAL_CREDIT`

## Backend Architecture

### Payment Provider Pattern
```
PaymentProvider (interface)
├── StripeProvider
└── MPesaProvider

PaymentProviderFactory.register('stripe', new StripeProvider())
PaymentProviderFactory.register('mpesa', new MPesaProvider())
```

### Services
| Service | Responsibility |
|---------|---------------|
| `SubscriptionService` | Trials, activations, upgrades, downgrades, pausing, cancellation |
| `BillingService` | Invoice generation, payment processing, credit notes, overdue tracking |
| `UsageMonitoringService` | Resource tracking, limit enforcement, period resets |
| `FeatureFlagService` | Feature enablement per tenant, plan-based sync |
| `CouponService` | Validation, application, referral code generation |

### API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions` | Current subscription |
| POST | `/api/subscriptions` | Activate subscription |
| GET | `/api/subscriptions/plans` | Available plans |
| POST | `/api/subscriptions/trial` | Start free trial |
| POST | `/api/subscriptions/upgrade` | Upgrade plan |
| POST | `/api/subscriptions/downgrade` | Downgrade plan |
| POST | `/api/subscriptions/cancel` | Cancel subscription |
| POST | `/api/subscriptions/pause` | Pause subscription |
| POST | `/api/subscriptions/resume` | Resume subscription |
| GET | `/api/subscriptions/history` | Subscription history |
| GET | `/api/plans` | Public plan listing |
| GET | `/api/billing/invoices` | Invoice list |
| POST | `/api/billing/invoices` | Create invoice |
| GET | `/api/billing/invoices/[id]` | Invoice detail |
| POST | `/api/billing/invoices/[id]` | Create credit note |
| GET | `/api/billing/payments` | Payment history |
| POST | `/api/billing/payments` | Process payment |
| GET | `/api/billing/overdue` | Overdue invoices |
| GET | `/api/usage` | Usage dashboard |
| POST | `/api/usage` | Sync limits |
| GET | `/api/features` | Feature flags |
| GET | `/api/coupons` | List coupons |
| POST | `/api/coupons` | Create coupon |
| POST | `/api/payments/webhook` | Stripe/M-Pesa webhooks |

## Frontend

### Pages
- `/pricing` - Public plan comparison
- `/billing/subscription` - Manage subscription, upgrade/downgrade
- `/billing/invoices` - Invoice history & overdue alerts
- `/billing/usage` - Resource usage dashboard
- `/billing/payment-methods` - Cards & mobile money management

### Components
- `PricingCard` - Plan card with feature list
- `UsageBar` - Resource usage with limit warnings
- `InvoiceTable` - Invoice history table

## Subscription Plans

| Plan | Price (KES) | Vehicles | Users | Features |
|------|-------------|----------|-------|----------|
| Free | 0 | 3 | 2 | Basic |
| Starter | 2,990/mo | 10 | 5 | +Fuel |
| Professional | 7,990/mo | 50 | 20 | +Maintenance, Inventory, Analytics |
| Enterprise | 19,990/mo | Unlimited | Unlimited | All features |

## Feature Flags
- `gps_tracking`
- `route_optimization`
- `predictive_maintenance`
- `bi_reports`
- `fuel_analytics`
- `api_access`
- `mobile_app`
- `white_labeling`
- `integrations`

## Payment Methods
- Credit/Debit Card (Stripe)
- M-Pesa (Safaricom)
- Bank Transfer
- PayPal

## Currency
Default: **KES** (Kenyan Shilling)

## Security
- All routes protected with `withAuth` middleware
- Tenant isolation via `x-company-id` header
- Soft-delete pattern applied

## Next Steps / Future Enhancements
- [ ] Integrate real Stripe SDK (currently mocked)
- [ ] Integrate real M-Pesa Daraja API (currently mocked)
- [ ] Add automated dunning for failed payments
- [ ] Add usage-based billing meters
- [ ] Add webhook event processing for subscription sync
- [ ] Add prorated billing calculations
- [ ] Add tax calculation (VAT/KRA integration)
- [ ] Add invoice PDF generation
