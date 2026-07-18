import { prisma } from '@/lib/prisma';

export class InvitationRepository {
  async findAll(_companyId: string) {
    return [];
  }

  async findByToken(_token: string) {
    return null;
  }

  async findByEmail(_email: string, _companyId: string): Promise<{ status: string } | null> {
    return null;
  }

  async create(_data: {
    email: string;
    firstName: string;
    lastName: string;
    token: string;
    companyId: string;
    invitedById: string;
    expiresAt: Date;
  }) {
    throw new Error('Invitation model not available');
  }

  async addRoles(_invitationId: string, _roleIds: string[], _companyId: string) {
    throw new Error('Invitation model not available');
  }

  async accept(_token: string) {
    throw new Error('Invitation model not available');
  }

  async cancel(_id: string, _companyId: string) {
    throw new Error('Invitation model not available');
  }

  async resend(_id: string, _companyId: string, _newToken: string, _newExpiry: Date) {
    throw new Error('Invitation model not available');
  }
}

export const invitationRepository = new InvitationRepository();
