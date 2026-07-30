import type { Sender } from '@/types/sender';

export type SenderVerificationState = 'verified' | 'unknown';

export interface SenderDisplayRecord extends Sender {
  name?: string;
  smtpHost?: string;
  smtpPort?: number;
  verificationStatus?: SenderVerificationState;
}

export interface SenderFormValues {
  name: string;
  email: string;
  smtpHost: string;
  smtpPort: string;
  username: string;
  password: string;
}

export interface SenderFormErrors {
  name?: string;
  email?: string;
  smtpHost?: string;
  smtpPort?: string;
  username?: string;
  password?: string;
  form?: string;
}

export interface SenderFormModeConfig {
  mode: 'create' | 'edit';
}

export interface SenderMutationInput {
  name?: string;
  email: string;
  smtpHost: string;
  smtpPort: number;
  username: string;
  password?: string;
}

export interface SenderDisplayMetadata {
  name?: string;
  smtpHost?: string;
  smtpPort?: number;
  verificationStatus?: SenderVerificationState;
}
