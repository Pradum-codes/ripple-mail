import type { EmailStatus } from '@/types/emailJob';
import type { BadgeVariant } from '@/components/common/Badge';

export function getEmailStatusBadgeVariant(status: EmailStatus): BadgeVariant {
  switch (status) {
    case 'SENT':
      return 'success';
    case 'SCHEDULED':
      return 'info';
    case 'FAILED':
      return 'error';
    case 'PROCESSING':
    default:
      return 'warning';
  }
}
