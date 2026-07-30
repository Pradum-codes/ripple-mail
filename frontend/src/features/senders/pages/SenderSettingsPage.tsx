import { useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { normalizeApiError } from '@/api';
import SenderSettingsTable from '../components/SenderSettingsTable';
import SenderFormModal from '../components/SenderFormModal';
import SenderDeleteModal from '../components/SenderDeleteModal';
import { useSenderSettings } from '../hooks/useSenderSettings';
import type { SenderDisplayRecord } from '../types';

function SenderSettingsPage() {
  const {
    senders,
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
  } = useSenderSettings();

  const [activeModal, setActiveModal] = useState<'create' | 'edit' | null>(null);
  const [selectedSender, setSelectedSender] = useState<SenderDisplayRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SenderDisplayRecord | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const emptyState = useMemo(
    () => ({
      title: 'No sender accounts found.',
      description: 'Create a sender account to manage outgoing email settings.',
      action: {
        label: 'Add Sender',
        onClick: () => {
          setActiveModal('create');
          setSelectedSender(null);
        },
        icon: <Plus className="size-4" aria-hidden="true" />,
      },
    }),
    [],
  );

  function openCreateModal() {
    clearError();
    setLocalError(null);
    setSuccessMessage(null);
    setSelectedSender(null);
    setActiveModal('create');
  }

  function openEditModal(sender: SenderDisplayRecord) {
    clearError();
    setLocalError(null);
    setSuccessMessage(null);
    setSelectedSender(sender);
    setActiveModal('edit');
  }

  function openDeleteModal(sender: SenderDisplayRecord) {
    clearError();
    setLocalError(null);
    setSuccessMessage(null);
    setDeleteTarget(sender);
  }

  async function handleCreate(payload: Parameters<typeof create>[0]) {
    await create(payload);
  }

  async function handleUpdate(payload: Parameters<typeof update>[1]) {
    if (!selectedSender) {
      throw new Error('No sender selected for editing.');
    }

    await update(selectedSender.id, payload);
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    await remove(deleteTarget.id);
    setSuccessMessage('Sender account deleted successfully.');
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Sender Settings</h1>
            <p className="text-sm text-slate-500">
              Manage sender accounts used for composing and scheduling campaigns.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void refresh();
              }}
              disabled={loading || refreshing || isSubmitting || deletingSenderId !== null}
              leftIcon={<RefreshCw className={refreshing ? 'size-4 animate-spin' : 'size-4'} aria-hidden="true" />}
            >
              Refresh
            </Button>
            <Button
              type="button"
              onClick={openCreateModal}
              disabled={loading || refreshing || isSubmitting || deletingSenderId !== null}
              leftIcon={<Plus className="size-4" aria-hidden="true" />}
            >
              Add Sender
            </Button>
          </div>
        </div>
      </section>

      {successMessage ? (
        <section role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
          <p className="font-medium">{successMessage}</p>
        </section>
      ) : null}

      {localError ? (
        <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
          <p className="font-medium">Unable to complete the request.</p>
          <p className="mt-1 text-sm">{localError}</p>
        </section>
      ) : null}

      {error ? (
        <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
          <p className="font-medium">Unable to load sender accounts.</p>
          <p className="mt-1 text-sm">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void refresh();
            }}
            leftIcon={<RefreshCw className="size-4" aria-hidden="true" />}
            className="mt-4 border-red-200 text-red-700 hover:bg-red-100 focus-visible:ring-red-500"
          >
            Retry
          </Button>
        </section>
      ) : senders.length === 0 && !loading ? (
        <EmptyState
          title={emptyState.title}
          description={emptyState.description}
          action={emptyState.action}
        />
      ) : (
        <SenderSettingsTable
          rows={senders}
          loading={loading}
          refreshing={refreshing}
          actionsDisabled={loading || refreshing || isSubmitting || deletingSenderId !== null}
          deletingSenderId={deletingSenderId}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
        />
      )}

      <SenderFormModal
        isOpen={activeModal !== null}
        mode={activeModal ?? 'create'}
        sender={selectedSender}
        onClose={() => {
          setActiveModal(null);
          setSelectedSender(null);
        }}
        onSubmit={activeModal === 'create' ? handleCreate : handleUpdate}
        onSuccess={(message) => {
          setSuccessMessage(message);
          setLocalError(null);
        }}
      />

      <SenderDeleteModal
        isOpen={deleteTarget !== null}
        sender={deleteTarget}
        deleting={deleteTarget ? deletingSenderId === deleteTarget.id : false}
        onClose={() => {
          setDeleteTarget(null);
        }}
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          try {
            await handleDelete();
          } catch (caughtError) {
            const errorMessage = normalizeApiError(caughtError).message;
            setLocalError(errorMessage);
          }
        }}
      />
    </div>
  );
}

export default SenderSettingsPage;
