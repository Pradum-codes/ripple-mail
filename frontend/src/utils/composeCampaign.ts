import type { ApiError } from '@/types/api';
import type { CreateCampaignRequest } from '@/types/campaign';

export interface ComposeCampaignFormValues {
  senderId: string;
  subject: string;
  body: string;
  startTime: string;
  delaySeconds: string;
  hourlyLimit: string;
}

export interface ComposeCampaignFieldErrors {
  senderId?: string;
  subject?: string;
  body?: string;
  startTime?: string;
  delaySeconds?: string;
  hourlyLimit?: string;
  recipients?: string;
}

export interface ComposeCampaignValidationResult {
  isValid: boolean;
  fieldErrors: ComposeCampaignFieldErrors;
}

export interface ComposeCampaignSubmissionError {
  formError: string | null;
  fieldErrors: ComposeCampaignFieldErrors;
}

export const initialComposeCampaignValues: ComposeCampaignFormValues = {
  senderId: '',
  subject: '',
  body: '',
  startTime: '',
  delaySeconds: '00',
  hourlyLimit: '00',
};

const REQUIRED_MESSAGE = 'This field is required.';
const INVALID_START_TIME_MESSAGE = 'Please choose a valid start time.';
const INVALID_DELAY_MESSAGE = 'Delay must be 0 or greater.';
const INVALID_HOURLY_LIMIT_MESSAGE = 'Hourly limit must be greater than 0.';
const RECIPIENTS_REQUIRED_MESSAGE = 'Add at least one recipient.';
const FIELD_NAMES = new Set<keyof ComposeCampaignFieldErrors>([
  'senderId',
  'subject',
  'body',
  'startTime',
  'delaySeconds',
  'hourlyLimit',
  'recipients',
]);

export function validateComposeCampaignForm(
  values: ComposeCampaignFormValues,
  recipients: ReadonlyArray<string>,
): ComposeCampaignValidationResult {
  const fieldErrors: ComposeCampaignFieldErrors = {};

  if (!values.senderId.trim()) {
    fieldErrors.senderId = REQUIRED_MESSAGE;
  }

  if (!values.subject.trim()) {
    fieldErrors.subject = REQUIRED_MESSAGE;
  }

  if (!values.body.trim()) {
    fieldErrors.body = REQUIRED_MESSAGE;
  }

  if (!values.startTime.trim() || Number.isNaN(new Date(values.startTime).getTime())) {
    fieldErrors.startTime = INVALID_START_TIME_MESSAGE;
  }

  const delaySeconds = Number(values.delaySeconds);

  if (!Number.isInteger(delaySeconds) || delaySeconds < 0) {
    fieldErrors.delaySeconds = INVALID_DELAY_MESSAGE;
  }

  const hourlyLimit = Number(values.hourlyLimit);

  if (!Number.isInteger(hourlyLimit) || hourlyLimit <= 0) {
    fieldErrors.hourlyLimit = INVALID_HOURLY_LIMIT_MESSAGE;
  }

  if (recipients.length === 0) {
    fieldErrors.recipients = RECIPIENTS_REQUIRED_MESSAGE;
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
  };
}

export function buildCreateCampaignRequest(
  values: ComposeCampaignFormValues,
  recipients: ReadonlyArray<string>,
): CreateCampaignRequest {
  return {
    senderId: values.senderId.trim(),
    subject: values.subject.trim(),
    body: values.body.trim(),
    startTime: new Date(values.startTime).toISOString(),
    delaySeconds: Number(values.delaySeconds),
    hourlyLimit: Number(values.hourlyLimit),
    recipients: [...recipients],
  };
}

export function getComposeCampaignSubmissionError(
  error: ApiError,
): ComposeCampaignSubmissionError {
  const fieldErrors: ComposeCampaignFieldErrors = {};

  if (error.status === 400 && Array.isArray(error.details)) {
    for (const detail of error.details as Array<{
      path?: Array<string | number>;
      message?: string;
    }>) {
      const fieldName = detail.path?.[0];

      if (typeof fieldName === 'string' && FIELD_NAMES.has(fieldName as keyof ComposeCampaignFieldErrors) && detail.message) {
        fieldErrors[fieldName as keyof ComposeCampaignFieldErrors] = detail.message;
      }
    }
  }

  return {
    formError: mapSubmissionErrorMessage(error),
    fieldErrors,
  };
}

function mapSubmissionErrorMessage(error: ApiError): string {
  if (error.status === 400) {
    return 'Please review the highlighted fields and try again.';
  }

  if (error.status === 404) {
    return 'We could not find one of the required campaign resources.';
  }

  if (error.status === 409) {
    return 'This campaign conflicts with an existing campaign. Please try again.';
  }

  if (error.status && error.status >= 500) {
    return 'The server could not schedule this campaign right now. Please try again.';
  }

  return error.message || 'We could not schedule this campaign.';
}
