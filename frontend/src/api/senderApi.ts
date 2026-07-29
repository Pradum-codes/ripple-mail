import { apiClient } from './client';
import type { PaginatedResponse } from '@/types/api';
import type { Sender, SenderQueryParams } from '@/types/sender';

async function getSenders(params: SenderQueryParams = {}): Promise<PaginatedResponse<Sender>> {
  const response = await apiClient.get<PaginatedResponse<Sender>>('/senders', {
    params,
  });

  return response.data;
}

export const senderApi = {
  getSenders,
};

export { getSenders };
