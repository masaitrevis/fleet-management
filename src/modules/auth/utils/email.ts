import { EmailContext } from '../types/auth.types';

export async function sendEmail(
  template: 'welcome' | 'verify-email' | 'reset-password' | 'password-changed' | 'new-login',
  context: EmailContext
): Promise<void> {
  console.log(`[Email] ${template} to ${context.to}`);
}
