import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || process.env.JWT_SECRET || 'customer-secret-key';
const JWT_EXPIRES_IN = '7d';

export interface CustomerAuthPayload {
  sub: string; // customerId
  cid: string; // companyId
  email: string;
  type: 'customer';
}

export class CustomerAuthService {
  /**
   * Register a customer portal account
   * Creates a password hash for customer login
   */
  async register(customerId: string, password: string): Promise<any> {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new Error('Customer not found');

    const passwordHash = await bcrypt.hash(password, 10);

    // Store password in customer metadata (since schema has no password field)
    const metadata = (customer.metadata as Record<string, any>) || {};
    metadata.portalPasswordHash = passwordHash;
    metadata.portalEnabled = true;
    metadata.portalRegisteredAt = new Date().toISOString();

    return prisma.customer.update({
      where: { id: customerId },
      data: { metadata },
    });
  }

  /**
   * Login with email + password
   */
  async login(email: string, password: string, companyId: string): Promise<{ token: string; refreshToken: string; customer: any }> {
    const customer = await prisma.customer.findFirst({
      where: { email, companyId, deletedAt: null },
    });
    if (!customer) throw new Error('Invalid credentials');

    const metadata = (customer.metadata as Record<string, any>) || {};
    const passwordHash = metadata.portalPasswordHash;
    if (!passwordHash) throw new Error('Portal account not activated');

    const valid = await bcrypt.compare(password, passwordHash);
    if (!valid) throw new Error('Invalid credentials');

    const payload: CustomerAuthPayload = {
      sub: customer.id,
      cid: customer.companyId,
      email: customer.email,
      type: 'customer',
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ ...payload, rt: true }, JWT_SECRET, { expiresIn: '30d' });

    // Store refresh token
    metadata.refreshToken = refreshToken;
    metadata.lastLoginAt = new Date().toISOString();
    await prisma.customer.update({
      where: { id: customer.id },
      data: { metadata },
    });

    return { token, refreshToken, customer };
  }

  /**
   * Refresh access token
   */
  async refresh(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as CustomerAuthPayload & { rt: boolean };
      if (!decoded.rt) throw new Error('Invalid refresh token');

      const customer = await prisma.customer.findUnique({ where: { id: decoded.sub } });
      if (!customer) throw new Error('Customer not found');

      const metadata = (customer.metadata as Record<string, any>) || {};
      if (metadata.refreshToken !== refreshToken) throw new Error('Refresh token revoked');

      const payload: CustomerAuthPayload = {
        sub: customer.id,
        cid: customer.companyId,
        email: customer.email,
        type: 'customer',
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      const newRefreshToken = jwt.sign({ ...payload, rt: true }, JWT_SECRET, { expiresIn: '30d' });

      metadata.refreshToken = newRefreshToken;
      await prisma.customer.update({
        where: { id: customer.id },
        data: { metadata },
      });

      return { token, refreshToken: newRefreshToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Verify customer JWT
   */
  verifyToken(token: string): CustomerAuthPayload {
    return jwt.verify(token, JWT_SECRET) as CustomerAuthPayload;
  }

  /**
   * Logout - revoke refresh token
   */
  async logout(customerId: string): Promise<void> {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return;

    const metadata = (customer.metadata as Record<string, any>) || {};
    delete metadata.refreshToken;
    await prisma.customer.update({
      where: { id: customerId },
      data: { metadata },
    });
  }

  /**
   * Change password
   */
  async changePassword(customerId: string, oldPassword: string, newPassword: string): Promise<void> {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new Error('Customer not found');

    const metadata = (customer.metadata as Record<string, any>) || {};
    const valid = await bcrypt.compare(oldPassword, metadata.portalPasswordHash);
    if (!valid) throw new Error('Incorrect current password');

    metadata.portalPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.customer.update({
      where: { id: customerId },
      data: { metadata },
    });
  }
}
