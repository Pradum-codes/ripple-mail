import { useCallback } from 'react';
import { emailJobApi } from '@/api';
import useEmailJobs, { type EmailJobWithSubject } from './useEmailJobs';

export interface UseSentEmailsResult {
  emails: ReadonlyArray<EmailJobWithSubject>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function useSentEmails(): UseSentEmailsResult {
  const fetchJobs = useCallback(
    async () => (await emailJobApi.getSentEmails()).data,
    [],
  );

  return useEmailJobs({
    fetchJobs,
    errorMessage: 'Failed to load sent emails.',
  });
}

export default useSentEmails;
