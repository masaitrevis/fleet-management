import { invitationRepository } from '../repositories/invitation.repository';
import { createInvitationSchema, acceptInvitationSchema } from '../validators/invitation.validator';
import { ConflictError, NotFoundError } from '@/shared/errors/AppError';
import { authRepository } from '@/modules/auth/repositories/auth.repository';

export class InvitationService {
  async getAllInvitations(companyId: string) {
    return invitationRepository.findAll(companyId);
  }

  async createInvitation(companyId: string, data: ReturnType<typeof createInvitationSchema.parse>, invitedById: string) {
    const existing = await invitationRepository.findByEmail(data.email, companyId);
    if (existing) {
      throw new ConflictError('Invitation already pending for this email');
    }

    throw new Error('Invitation model not available in current schema');
  }

  async getInvitationByToken(token: string) {
    const invitation = await invitationRepository.findByToken(token);
    if (!invitation) {
      throw new NotFoundError('Invitation not found');
    }
    return invitation;
  }

  async acceptInvitation(data: ReturnType<typeof acceptInvitationSchema.parse>) {
    throw new Error('Invitation model not available in current schema');
  }

  async cancelInvitation(id: string, companyId: string, cancelledById: string) {
    await invitationRepository.cancel(id, companyId);

    await authRepository.createAuditLog({
      companyId,
      userId: cancelledById,
      action: 'INVITATION_CANCELLED',
      entityType: 'Invitation',
      entityId: id,
      description: 'Invitation cancelled',
    });

    return { message: 'Invitation cancelled' };
  }

  async resendInvitation(id: string, companyId: string, resendById: string) {
    throw new Error('Invitation model not available in current schema');
  }
}

export const invitationService = new InvitationService();
