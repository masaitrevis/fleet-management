import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo company
  const company = await prisma.company.upsert({
    where: { id: 'demo-company-001' },
    update: {},
    create: {
      id: 'demo-company-001',
      name: 'Bright Fleet Demo',
      slug: 'bright-fleet-demo',
      status: 'ACTIVE',
      subscriptionPlan: 'PROFESSIONAL',
      subscriptionStatus: 'ACTIVE',
      maxUsers: 50,
      maxVehicles: 100,
      maxBranches: 10,
      settings: {
        timezone: 'Africa/Nairobi',
        language: 'en',
        currency: 'KES',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        measurementUnit: 'metric',
        fuelUnit: 'liters',
        distanceUnit: 'km',
      },
    },
  });

  console.log('Company created:', company.name);

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.upsert({
    where: { id: 'demo-admin-001' },
    update: {},
    create: {
      id: 'demo-admin-001',
      email: 'admin@brightfleet.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      status: 'ACTIVE',
      companyId: company.id,
      permissions: ['company:read', 'company:update', 'company:delete', 'user:read', 'user:write', 'vehicle:read', 'vehicle:write'],
    },
  });

  console.log('User created:', user.email);

  // Create some branches
  const branches = await prisma.$transaction([
    prisma.branch.upsert({
      where: { id: 'branch-001' },
      update: {},
      create: {
        id: 'branch-001',
        name: 'Nairobi HQ',
        code: 'NBO-HQ',
        type: 'HEADQUARTERS',
        status: 'ACTIVE',
        companyId: company.id,
        address: '123 Mombasa Road, Nairobi',
        city: 'Nairobi',
        country: 'Kenya',
      },
    }),
    prisma.branch.upsert({
      where: { id: 'branch-002' },
      update: {},
      create: {
        id: 'branch-002',
        name: 'Mombasa Depot',
        code: 'MBA-DP',
        type: 'DEPOT',
        status: 'ACTIVE',
        companyId: company.id,
        address: '456 Port Road, Mombasa',
        city: 'Mombasa',
        country: 'Kenya',
      },
    }),
  ]);

  console.log('Branches created:', branches.length);

  // Create a sample vehicle
  const vehicle = await prisma.vehicle.upsert({
    where: { id: 'vehicle-001' },
    update: {},
    create: {
      id: 'vehicle-001',
      registrationNumber: 'KCA 123A',
      make: 'Toyota',
      model: 'Hilux',
      year: 2023,
      type: 'PICKUP',
      status: 'ACTIVE',
      companyId: company.id,
      branchId: 'branch-001',
      fuelType: 'DIESEL',
      currentOdometer: 15000,
      assignedDriverId: null,
    },
  });

  console.log('Vehicle created:', vehicle.registrationNumber);

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
