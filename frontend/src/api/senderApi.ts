import { apiClient } from './client';
import type { PaginatedResponse } from '@/types/api';
import type {
  CreateSenderRequest,
  Sender,
  SenderQueryParams,
  UpdateSenderRequest,
} from '@/types/sender';

async function getSenders(params: SenderQueryParams = {}): Promise<PaginatedResponse<Sender>> {
  const response = await apiClient.get<PaginatedResponse<Sender>>('/senders', {
    params,
  });

  return response.data;
}

async function createSender(payload: CreateSenderRequest): Promise<Sender> {
  const response = await apiClient.post<Sender>('/senders', payload);

  return response.data;
}

async function updateSender(
  id: number,
  payload: UpdateSenderRequest,
): Promise<Sender> {
  const response = await apiClient.patch<Sender>(`/senders/${id}`, payload);

  return response.data;
}

async function deleteSender(id: number): Promise<void> {
  await apiClient.delete(`/senders/${id}`);
}

export const senderApi = {
  getSenders,
  createSender,
  updateSender,
  deleteSender,
};

export { createSender, deleteSender, getSenders, updateSender };
