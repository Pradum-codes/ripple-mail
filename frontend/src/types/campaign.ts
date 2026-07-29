export interface Campaign {
  id: number;
  userId: number;
  senderId: number;
  subject: string;
  body: string;
  startTime: string;
  delaySeconds: number;
  hourlyLimit: number;
  totalRecipients: number;
  createdAt: string;
}

export interface CreateCampaignRequest {
  senderId: string;
  subject: string;
  body: string;
  startTime: string;
  delaySeconds: number;
  hourlyLimit: number;
  recipients: string[];
}

export interface CreateCampaignResponse {
  campaignId: number;
  jobsCreated: number;
}

export interface CampaignQueryParams {
  page?: number;
  limit?: number;
  senderId?: number;
}
