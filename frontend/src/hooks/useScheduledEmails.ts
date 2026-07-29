import { useCallback } from 'react';
import { emailJobApi } from '@/api';
import useEmailJobs, { type EmailJobWithSubject } from './useEmailJobs';

export interface UseScheduledEmailsResult {
  emails: ReadonlyArray<EmailJobWithSubject>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function useScheduledEmails(): UseScheduledEmailsResult {
  const fetchJobs = useCallback(
    async () => (await emailJobApi.getScheduledEmails()).data,
    [],
  );

  return useEmailJobs({
    fetchJobs,
    errorMessage: 'Failed to load scheduled emails.',
  });
}

export default useScheduledEmails;
