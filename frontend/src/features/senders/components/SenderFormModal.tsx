import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import { normalizeApiError } from '@/api';
import {
  buildSenderMutationInput,
  getFieldErrorsFromApiError,
  getInitialSenderFormValues,
  getSenderErrorMessage,
  validateSenderForm,
} from '../utils/senderForm';
import type {
  SenderDisplayRecord,
  SenderFormErrors,
  SenderFormValues,
  SenderMutationInput,
} from '../types';

export interface SenderFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  sender?: SenderDisplayRecord | null;
  onClose: () => void;
  onSubmit: (payload: SenderMutationInput) => Promise<unknown>;
  onSuccess: (message: string) => void;
}

function SenderFormModal({
  isOpen,
  mode,
  sender,
  onClose,
  onSubmit,
  onSuccess,
}: SenderFormModalProps) {
  const initialValues = useMemo(
    () =>
      getInitialSenderFormValues(mode, sender ? {
        name: sender.name ?? '',
        email: sender.email ?? '',
        smtpHost: sender.smtpHost ?? '',
        smtpPort: sender.smtpPort !== undefined ? String(sender.smtpPort) : '',
        username: sender.username ?? '',
      } : undefined),
    [mode, sender],
  );

  const [values, setValues] = useState<SenderFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<SenderFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setValues(initialValues);
    setFieldErrors({});
    setSubmitError(null);
    setSubmitting(false);
  }, [initialValues, isOpen]);

  function updateField<K extends keyof SenderFormValues>(field: K, value: SenderFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setSubmitError(null);
    setFieldErrors((current) => {
      if (!(field in current)) {
        return current;
      }

      const next = { ...current };
      delete next[field as keyof SenderFormErrors];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const validationErrors = validateSenderForm(values, mode);

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setSubmitError('Please review the highlighted fields and try again.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = buildSenderMutationInput(values, mode);
      await onSubmit(payload);
      onSuccess(mode === 'create' ? 'Sender account created successfully.' : 'Sender account updated successfully.');
      onClose();
    } catch (caughtError) {
      const apiError = normalizeApiError(caughtError);
      setFieldErrors((current) => ({
        ...current,
        ...getFieldErrorsFromApiError(apiError),
      }));
      setSubmitError(getSenderErrorMessage(apiError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title={mode === 'create' ? 'Add Sender' : 'Edit Sender'}
      onClose={submitting ? () => undefined : onClose}
      className="max-w-2xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button
            type="button"
          variant="outline"
            onClick={submitting ? () => undefined : onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" form="sender-form" loading={submitting}>
            {mode === 'create' ? 'Create Sender' : 'Save Changes'}
          </Button>
        </div>
      }
    >
      <form id="sender-form" className="space-y-4" onSubmit={handleSubmit}>
        {submitError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        ) : null}

        <Input
          label="Name"
          value={values.name}
          onChange={(event) => updateField('name', event.target.value)}
          placeholder="Optional display name"
          error={fieldErrors.name}
        />
        <Input
          label="Email"
          type="email"
          value={values.email}
          onChange={(event) => updateField('email', event.target.value)}
          required
          error={fieldErrors.email}
        />
        <Input
          label="SMTP Host"
          value={values.smtpHost}
          onChange={(event) => updateField('smtpHost', event.target.value)}
          required
          error={fieldErrors.smtpHost}
        />
        <Input
          label="SMTP Port"
          type="number"
          min={1}
          max={65535}
          value={values.smtpPort}
          onChange={(event) => updateField('smtpPort', event.target.value)}
          required
          error={fieldErrors.smtpPort}
        />
        <Input
          label="Username"
          value={values.username}
          onChange={(event) => updateField('username', event.target.value)}
          required
          error={fieldErrors.username}
        />
        <Input
          label="Password"
          type="password"
          value={values.password}
          onChange={(event) => updateField('password', event.target.value)}
          required={mode === 'create'}
          helperText={mode === 'edit' ? 'Leave blank to keep the existing password.' : undefined}
          error={fieldErrors.password}
        />
      </form>
    </Modal>
  );
}

export default SenderFormModal;
