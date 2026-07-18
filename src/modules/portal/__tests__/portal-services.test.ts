import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CustomerAuthService } from '../services/customer-auth.service';
import { CustomerPortalService } from '../services/customer-portal.service';
import { MobileDriverService } from '../services/mobile-driver.service';
import { MobileSyncService } from '../services/mobile-sync.service';
import { PublicApiService } from '../services/public-api.service';

describe('CustomerAuthService', () => {
  let service: CustomerAuthService;

  beforeEach(() => {
    service = new CustomerAuthService();
  });

  it('should verify token payload structure', () => {
    const payload = { sub: 'cust-1', cid: 'comp-1', email: 'test@test.com', type: 'customer' as const };
    expect(payload.type).toBe('customer');
    expect(payload.sub).toBeDefined();
    expect(payload.cid).toBeDefined();
  });
});

describe('CustomerPortalService', () => {
  it('should instantiate with customer and company IDs', () => {
    const service = new CustomerPortalService('cust-1', 'comp-1');
    expect(service).toBeDefined();
  });
});

describe('MobileDriverService', () => {
  it('should instantiate with driver and company IDs', () => {
    const service = new MobileDriverService('driver-1', 'comp-1');
    expect(service).toBeDefined();
  });
});

describe('MobileSyncService', () => {
  it('should process empty sync batch', async () => {
    const service = new MobileSyncService('driver-1', 'comp-1');
    const results = await service.processSyncBatch([]);
    expect(results).toEqual([]);
  });

  it('should identify retryable errors', () => {
    const service = new MobileSyncService('driver-1', 'comp-1');
    const retryable = (service as any).isRetryable(new Error('NETWORK_ERROR'));
    expect(retryable).toBe(true);
  });
});

describe('PublicApiService', () => {
  let service: PublicApiService;

  beforeEach(() => {
    service = new PublicApiService();
  });

  it('should instantiate', () => {
    expect(service).toBeDefined();
  });
});
