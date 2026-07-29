import { useCallback, useEffect, useState } from 'react';
import { campaignApi } from '@/api';
import type { EmailJob } from '@/types/emailJob';

export interface EmailJobWithSubject extends EmailJob {
  subject: string;
}

export interface UseEmailJobsOptions {
  fetchJobs: () => Promise<ReadonlyArray<EmailJob>>;
  errorMessage: string;
}

export interface UseEmailJobsResult {
  emails: ReadonlyArray<EmailJobWithSubject>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

async function enrichJobsWithSubjects(
  jobs: ReadonlyArray<EmailJob>,
): Promise<ReadonlyArray<EmailJobWithSubject>> {
  const campaignIds = Array.from(new Set(jobs.map((job) => job.campaignId)));

  const campaigns = await Promise.all(
    campaignIds.map(async (campaignId) => {
      const campaign = await campaignApi.getCampaign(campaignId);
      return [campaign.id, campaign.subject] as const;
    }),
  );

  const campaignSubjectMap = new Map(campaigns);

  return jobs.map((job) => ({
    ...job,
    subject: campaignSubjectMap.get(job.campaignId) ?? `Campaign #${job.campaignId}`,
  }));
}

function useEmailJobs({ fetchJobs, errorMessage }: UseEmailJobsOptions): UseEmailJobsResult {
  const [emails, setEmails] = useState<ReadonlyArray<EmailJobWithSubject>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmailJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const jobs = await fetchJobs();
      const jobsWithSubjects = await enrichJobsWithSubjects(jobs);
      setEmails(jobsWithSubjects);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : errorMessage;
      setError(message);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }, [errorMessage, fetchJobs]);

  useEffect(() => {
    void loadEmailJobs();
  }, [loadEmailJobs]);

  return {
    emails,
    loading,
    error,
    refresh: loadEmailJobs,
  };
}

export default useEmailJobs;
