export type EmailStatus = 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED';

export interface EmailJob {
  id: number;
  campaignId: number;
  recipient: string;
  scheduledAt: string;
  sentAt: string | null;
  bullJobId: string | null;
  status: EmailStatus;
  failureReason: string | null;
  retryCount: number;
  createdAt: string;
}

export interface EmailJobQueryParams {
  page?: number;
  limit?: number;
  campaignId?: number;
}
