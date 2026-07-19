const { PrismaClient, CompanyStatus, UserStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('admin123', SALT_ROUNDS);

  const result = await prisma.$transaction(async (tx) => {
    // Create company
    const company = await tx.company.create({
      data: {
        name: 'Bright Fleet Demo',
        slug: 'bright-fleet-demo',
        email: 'admin@brightfleet.com',
        status: CompanyStatus.ACTIVE,
      },
    });
    console.log('Company:', company.name);

    // Create owner role
    const role = await tx.role.create({
      data: {
        name: 'Company Owner',
        description: 'Full access to company resources',
        companyId: company.id,
        permissions: [
          'company:read', 'company:update',
          'user:create', 'user:read', 'user:update', 'user:delete',
          'vehicle:create', 'vehicle:read', 'vehicle:update', 'vehicle:delete',
          'driver:create', 'driver:read', 'driver:update', 'driver:delete',
          'trip:create', 'trip:read', 'trip:update', 'trip:delete',
          'fuel:create', 'fuel:read', 'fuel:update', 'fuel:delete',
          'maintenance:create', 'maintenance:read', 'maintenance:update', 'maintenance:delete',
          'expense:create', 'expense:read', 'expense:update', 'expense:delete',
          'invoice:create', 'invoice:read', 'invoice:update', 'invoice:delete',
          'report:read', 'settings:read', 'settings:update',
        ],
      },
    });
    console.log('Role:', role.name);

    // Create user (email verified, active)
    const user = await tx.user.create({
      data: {
        email: 'admin@brightfleet.com',
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(), // Required for login
      },
    });
    console.log('User:', user.email);

    // Link user to company
    await tx.companyUser.create({
      data: {
        userId: user.id,
        companyId: company.id,
        isOwner: true,
      },
    });
    console.log('CompanyUser created');

    // Assign role
    await tx.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
        companyId: company.id,
      },
    });
    console.log('UserRole created');

    // Create branches
    await tx.branch.createMany({
      data: [
        {
          companyId: company.id,
          name: 'Nairobi HQ',
          address: '123 Mombasa Road, Nairobi',
          city: 'Nairobi',
          country: 'Kenya',
        },
        {
          companyId: company.id,
          name: 'Mombasa Depot',
          address: '456 Port Road, Mombasa',
          city: 'Mombasa',
          country: 'Kenya',
        },
      ],
    });
    console.log('Branches created');

    // Create a vehicle category
    const category = await tx.vehicleCategory.create({
      data: {
        companyId: company.id,
        name: 'Light Trucks',
        description: 'Light commercial vehicles',
        color: '#3b82f6',
      },
    });
    console.log('Category:', category.name);

    // Create a vehicle
    await tx.vehicle.create({
      data: {
        companyId: company.id,
        categoryId: category.id,
        registrationNumber: 'KCA 123A',
        plateNumber: 'KCA 123A',
        make: 'Toyota',
        model: 'Hilux',
        year: 2023,
        fuelType: 'DIESEL',
        currentOdometer: 15000,
        odometer: 15000,
        status: 'ACTIVE',
        availability: 'AVAILABLE',
      },
    });
    console.log('Vehicle created');

    return { company, user };
  });

  console.log('Seed done!');
  console.log('Login with: admin@brightfleet.com / admin123');
  console.log('Company ID:', result.company.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
