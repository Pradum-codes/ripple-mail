import type { Sender } from '@/types/sender';

export function formatSenderLabel(sender: Sender): string {
  return `${sender.username} • ${sender.email}`;
}
