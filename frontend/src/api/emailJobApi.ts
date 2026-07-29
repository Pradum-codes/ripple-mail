import { apiClient } from './client';
import type { PaginatedResponse } from '@/types/api';
import type { EmailJob, EmailJobQueryParams } from '@/types/emailJob';

async function getScheduledEmails(
  params: EmailJobQueryParams = {},
): Promise<PaginatedResponse<EmailJob>> {
  const response = await apiClient.get<PaginatedResponse<EmailJob>>('/emails/scheduled', {
    params,
  });

  return response.data;
}

async function getSentEmails(
  params: EmailJobQueryParams = {},
): Promise<PaginatedResponse<EmailJob>> {
  const response = await apiClient.get<PaginatedResponse<EmailJob>>('/emails/sent', {
    params,
  });

  return response.data;
}

async function getFailedEmails(
  params: EmailJobQueryParams = {},
): Promise<PaginatedResponse<EmailJob>> {
  const response = await apiClient.get<PaginatedResponse<EmailJob>>('/emails/failed', {
    params,
  });

  return response.data;
}

export const emailJobApi = {
  getScheduledEmails,
  getSentEmails,
  getFailedEmails,
};

export { getScheduledEmails, getSentEmails, getFailedEmails };
