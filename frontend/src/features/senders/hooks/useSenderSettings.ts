import { useCallback, useEffect, useMemo, useState } from 'react';
import { normalizeApiError } from '@/api';
import type { Sender } from '@/types/sender';
import {
  createSender,
  deleteSender,
  getSenders,
  updateSender,
} from '../api/sendersApi';
import type { SenderDisplayMetadata, SenderDisplayRecord, SenderMutationInput } from '../types';

type SenderSettingsState = {
  senders: ReadonlyArray<SenderDisplayRecord>;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  deletingSenderId: number | null;
  isSubmitting: boolean;
  refresh: () => Promise<void>;
  create: (payload: SenderMutationInput) => Promise<Sender>;
  update: (id: number, payload: SenderMutationInput) => Promise<Sender>;
  remove: (id: number) => Promise<void>;
  clearError: () => void;
};

export function useSenderSettings(): SenderSettingsState {
  const [senders, setSenders] = useState<ReadonlyArray<Sender>>([]);
  const [metadataById, setMetadataById] = useState<Record<number, SenderDisplayMetadata>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingSenderId, setDeletingSenderId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mergeSenders = useMemo(
    () =>
      senders.map((sender) => ({
        ...sender,
        ...metadataById[sender.id],
      })),
    [metadataById, senders],
  );

  const loadSenders = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError(null);

    try {
      const response = await getSenders();
      setSenders(response.data);
    } catch (caughtError) {
      const normalizedError = normalizeApiError(caughtError);
      setError(normalizedError.message || 'Failed to load senders.');
      if (isInitialLoad) {
        setSenders([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadSenders(true);
  }, [loadSenders]);

  const refresh = useCallback(async () => {
    await loadSenders(false);
  }, [loadSenders]);

  const create = useCallback(async (payload: SenderMutationInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const createdSender = await createSender({
        email: payload.email,
        smtpHost: payload.smtpHost,
        smtpPort: payload.smtpPort,
        username: payload.username,
        password: payload.password ?? '',
      });

      setMetadataById((current) => ({
        ...current,
        [createdSender.id]: {
          name: payload.name,
          smtpHost: payload.smtpHost,
          smtpPort: payload.smtpPort,
          verificationStatus: 'verified',
        },
      }));

      void refresh();
      return createdSender;
    } catch (caughtError) {
      throw normalizeApiError(caughtError);
    } finally {
      setIsSubmitting(false);
    }
  }, [refresh]);

  const update = useCallback(async (id: number, payload: SenderMutationInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const updatedSender = await updateSender(id, {
        email: payload.email,
        smtpHost: payload.smtpHost,
        smtpPort: payload.smtpPort,
        username: payload.username,
        ...(payload.password ? { password: payload.password } : {}),
      });

      setMetadataById((current) => ({
        ...current,
        [id]: {
          name: payload.name,
          smtpHost: payload.smtpHost,
          smtpPort: payload.smtpPort,
          verificationStatus: 'verified',
        },
      }));

      void refresh();
      return updatedSender;
    } catch (caughtError) {
      throw normalizeApiError(caughtError);
    } finally {
      setIsSubmitting(false);
    }
  }, [refresh]);

  const remove = useCallback(async (id: number) => {
    setDeletingSenderId(id);
    setError(null);

    try {
      await deleteSender(id);
      setMetadataById((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      void refresh();
    } catch (caughtError) {
      throw normalizeApiError(caughtError);
    } finally {
      setDeletingSenderId(null);
    }
  }, [refresh]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    senders: mergeSenders,
    loading,
    refreshing,
    error,
    deletingSenderId,
    isSubmitting,
    refresh,
    create,
    update,
    remove,
    clearError,
  };
}
