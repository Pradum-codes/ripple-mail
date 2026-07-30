import type { ApiError } from '@/types/api';
import type {
  SenderFormErrors,
  SenderFormValues,
  SenderMutationInput,
} from '../types';

export function getInitialSenderFormValues(
  mode: 'create' | 'edit',
  initial?: Partial<SenderFormValues>,
): SenderFormValues {
  return {
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    smtpHost: initial?.smtpHost ?? '',
    smtpPort: initial?.smtpPort ?? '',
    username: initial?.username ?? '',
    password: mode === 'create' ? initial?.password ?? '' : '',
  };
}

export function validateSenderForm(
  values: SenderFormValues,
  mode: 'create' | 'edit',
): SenderFormErrors {
  const errors: SenderFormErrors = {};

  if (!values.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!isEmail(values.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!values.smtpHost.trim()) {
    errors.smtpHost = 'SMTP host is required.';
  }

  const smtpPort = Number(values.smtpPort);

  if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
    errors.smtpPort = 'SMTP port must be between 1 and 65535.';
  }

  if (!values.username.trim()) {
    errors.username = 'Username is required.';
  }

  if (mode === 'create' && !values.password.trim()) {
    errors.password = 'Password is required.';
  }

  return errors;
}

export function buildSenderMutationInput(
  values: SenderFormValues,
  mode: 'create' | 'edit',
): SenderMutationInput {
  const payload: SenderMutationInput = {
    email: values.email.trim(),
    smtpHost: values.smtpHost.trim(),
    smtpPort: Number(values.smtpPort),
    username: values.username.trim(),
  };

  if (values.name.trim()) {
    payload.name = values.name.trim();
  }

  if (mode === 'create' || values.password.trim()) {
    payload.password = values.password.trim();
  }

  return payload;
}

export function getSenderErrorMessage(error: ApiError): string {
  if (error.status === 400 && error.code === 'SMTP_VERIFICATION_FAILED') {
    return 'SMTP verification failed. Please check the host, port, username, and password.';
  }

  if (error.status === 409 && error.code === 'DUPLICATE_EMAIL') {
    return 'A sender with this email already exists.';
  }

  if (error.status === 409 && error.code === 'SENDER_IN_USE') {
    return 'This sender cannot be deleted because it is still used by one or more campaigns.';
  }

  if (error.status && error.status >= 500) {
    return 'The server could not complete this request right now. Please try again.';
  }

  return error.message || 'Something went wrong.';
}

export function getFieldErrorsFromApiError(error: ApiError): SenderFormErrors {
  const fieldErrors: SenderFormErrors = {};

  if (error.status !== 400 || !Array.isArray(error.details)) {
    return fieldErrors;
  }

  for (const detail of error.details as Array<{
    path?: Array<string | number>;
    message?: string;
  }>) {
    const fieldName = detail.path?.[0];

    if (typeof fieldName !== 'string' || !detail.message) {
      continue;
    }

    if (
      fieldName === 'name' ||
      fieldName === 'email' ||
      fieldName === 'smtpHost' ||
      fieldName === 'smtpPort' ||
      fieldName === 'username' ||
      fieldName === 'password'
    ) {
      fieldErrors[fieldName] = detail.message;
    }
  }

  return fieldErrors;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
