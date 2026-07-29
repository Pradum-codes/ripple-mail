import { apiClient } from './client';
import type {
  PaginatedResponse,
} from '@/types/api';
import type {
  Campaign,
  CampaignQueryParams,
  CreateCampaignRequest,
  CreateCampaignResponse,
} from '@/types/campaign';

async function getCampaigns(params: CampaignQueryParams = {}): Promise<PaginatedResponse<Campaign>> {
  const response = await apiClient.get<PaginatedResponse<Campaign>>('/campaigns', {
    params,
  });

  return response.data;
}

async function createCampaign(
  payload: CreateCampaignRequest,
): Promise<CreateCampaignResponse> {
  const response = await apiClient.post<CreateCampaignResponse>('/campaigns', payload);

  return response.data;
}

async function getCampaign(id: number): Promise<Campaign> {
  const response = await apiClient.get<Campaign>(`/campaigns/${id}`);

  return response.data;
}

export const campaignApi = {
  getCampaigns,
  createCampaign,
  getCampaign,
};

export { getCampaigns, createCampaign, getCampaign };
