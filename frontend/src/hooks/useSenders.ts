import { useEffect, useState } from 'react';
import { normalizeApiError, senderApi } from '@/api';
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

  async function loadSenders() {
    setLoading(true);
    setError(null);

    try {
      const response = await senderApi.getSenders();
      setSenders(response.data);
    } catch (caughtError) {
      const normalizedError = normalizeApiError(caughtError);
      const message = normalizedError.message || 'Failed to load senders.';
      setError(message);
      setSenders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSenders();
  }, []);

  return {
    senders,
    loading,
    error,
    refresh: loadSenders,
  };
}

export default useSenders;
