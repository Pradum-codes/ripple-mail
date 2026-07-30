import { senderApi } from '@/api';
import type {
  CreateSenderRequest,
  Sender,
  SenderQueryParams,
  UpdateSenderRequest,
} from '@/types/sender';

export async function getSenders(params: SenderQueryParams = {}) {
  return senderApi.getSenders(params);
}

export async function createSender(payload: CreateSenderRequest): Promise<Sender> {
  return senderApi.createSender(payload);
}

export async function updateSender(
  id: number,
  payload: UpdateSenderRequest,
): Promise<Sender> {
  return senderApi.updateSender(id, payload);
}

export async function deleteSender(id: number): Promise<void> {
  return senderApi.deleteSender(id);
}
