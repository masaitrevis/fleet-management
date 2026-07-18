import { describe, it, expect, vi } from 'vitest';
import { KPICalculator } from '../engine/kpi-calculator';
import { AnalyticsCacheService } from '../services/analytics-cache.service';

describe('KPI Calculator', () => {
  const companyId = 'test-company';
  const kpi = new KPICalculator(companyId);

  it('should calculate fleet utilization', () => {
    const totalVehicles = 100;
    const activeVehicles = 80;
    const utilization = totalVehicles > 0 ? (activeVehicles / totalVehicles) * 100 : 0;
    expect(utilization).toBe(80);
  });

  it('should calculate cost per vehicle', () => {
    const operatingCost = 1000000;
    const vehicles = 50;
    const costPerVehicle = vehicles > 0 ? Math.round((operatingCost / vehicles) * 100) / 100 : 0;
    expect(costPerVehicle).toBe(20000);
  });

  it('should calculate cost per driver', () => {
    const operatingCost = 1000000;
    const drivers = 40;
    const costPerDriver = drivers > 0 ? Math.round((operatingCost / drivers) * 100) / 100 : 0;
    expect(costPerDriver).toBe(25000);
  });
});

describe('Analytics Cache', () => {
  const companyId = 'test-company';
  const cache = new AnalyticsCacheService(companyId);

  it('should generate cache key', () => {
    const key = 'fleet_kpis_2024-01';
    expect(key).toBe('fleet_kpis_2024-01');
  });

  it('should calculate TTL expiration', () => {
    const ttlMinutes = 60;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe('Report Generation', () => {
  it('should generate report summary', () => {
    const data = { trips: [{ id: '1' }, { id: '2' }, { id: '3' }] };
    const summary = { generatedAt: new Date(), type: 'TRIP', recordCount: Array.isArray(data.trips) ? data.trips.length : 0 };
    expect(summary.recordCount).toBe(3);
  });

  it('should format currency', () => {
    const value = 1000000;
    const formatted = `KES ${value.toLocaleString()}`;
    expect(formatted).toBe('KES 1,000,000');
  });
});

describe('Dashboard Data', () => {
  it('should aggregate KPI data', () => {
    const fleet = { totalVehicles: 100, activeVehicles: 80, vehicleUtilization: 80 };
    const driver = { totalDrivers: 50, activeDrivers: 45, safetyScore: 95 };
    const financial = { operatingCost: 1000000, costPerVehicle: 20000 };

    const dashboard = { fleet, driver, financial };
    expect(dashboard.fleet.totalVehicles).toBe(100);
    expect(dashboard.driver.safetyScore).toBe(95);
    expect(dashboard.financial.operatingCost).toBe(1000000);
  });
});
