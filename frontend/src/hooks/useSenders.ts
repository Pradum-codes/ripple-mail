import { useCallback, useEffect, useState } from 'react';
import { senderApi } from '@/api';
import type { Sender } from '@/types/sender';

export interface UseSendersResult {
  senders: ReadonlyArray<Sender>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function useSenders(): UseSendersResult {
  const [senders, setSenders] = useState<ReadonlyArray<Sender>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSenders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await senderApi.getSenders();
      setSenders(response.data);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Failed to load senders.';
      setError(message);
      setSenders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSenders();
  }, [loadSenders]);

  return {
    senders,
    loading,
    error,
    refresh: loadSenders,
  };
}

export default useSenders;
