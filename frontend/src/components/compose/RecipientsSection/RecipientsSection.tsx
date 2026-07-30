import { Upload, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import Button from '@/components/common/Button';
import ComposeFieldRow from '../ComposeFieldRow';
import type { UseRecipientUploadResult } from '@/hooks/useRecipientUpload';

export interface RecipientsSectionProps extends UseRecipientUploadResult {
  disabled?: boolean;
  recipientsError?: string;
}

function RecipientsSection({
  fileName,
  validRecipients,
  invalidRecipients,
  duplicateRecipients,
  previewRecipients,
  summary,
  error,
  isDragging,
  isParsing,
  inputRef,
  openPicker,
  removeFile,
  handleInputChange,
  handleDrop,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  disabled = false,
  recipientsError,
}: RecipientsSectionProps) {
  const remainingCount = summary ? Math.max(summary.valid - previewRecipients.length, 0) : 0;

  return (
    <ComposeFieldRow label="To">
      <div className="space-y-3">
        <div
          className={cn(
            'flex flex-wrap items-center gap-2 border-b pb-2 transition-colors',
            isDragging ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-200',
            disabled && 'pointer-events-none opacity-60',
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        >
          {validRecipients.length > 0 ? (
            <span className="inline-flex h-8 items-center rounded-full border border-emerald-500 bg-emerald-50 px-3 text-sm text-slate-700">
              {summary?.totalAccepted ?? validRecipients.length} recipient
              {(summary?.totalAccepted ?? validRecipients.length) === 1 ? '' : 's'} loaded
            </span>
          ) : (
            <span className="inline-flex h-8 items-center rounded-full border border-dashed border-slate-300 bg-slate-50 px-3 text-sm text-slate-400">
              Upload a CSV or TXT file
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            {isParsing ? <span className="text-xs text-slate-400">Parsing…</span> : null}
            {fileName ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeFile}
                disabled={disabled}
                leftIcon={<X className="size-4" aria-hidden="true" />}
                className="h-8 rounded-md px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                Remove file
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={openPicker}
              disabled={disabled}
              leftIcon={<Upload className="size-4" aria-hidden="true" />}
              className="h-8 rounded-md px-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
            >
              Upload List
            </Button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            className="sr-only"
            onChange={handleInputChange}
            aria-label="Upload recipient CSV or TXT file"
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {recipientsError ? <p className="text-sm text-red-600">{recipientsError}</p> : null}

        {summary ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900">Recipients</p>
                <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-600 md:grid-cols-4">
                  <p>
                    <span className="font-medium text-slate-900">Valid:</span> {summary.valid}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Duplicates Removed:</span>{' '}
                    {summary.duplicatesRemoved}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Invalid:</span> {summary.invalid}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Total Accepted:</span>{' '}
                    {summary.totalAccepted}
                  </p>
                </div>
              </div>
              {fileName ? (
                <p className="text-xs text-slate-400">File: {fileName}</p>
              ) : null}
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Preview
              </p>
              <div className="flex flex-wrap gap-2">
                {previewRecipients.map((recipient) => (
                  <span
                    key={recipient}
                    className="inline-flex h-8 items-center rounded-full border border-emerald-500 bg-emerald-50 px-3 text-sm text-slate-700"
                  >
                    {recipient}
                  </span>
                ))}
                {remainingCount > 0 ? (
                  <span className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-500">
                    ...and {remainingCount} more
                  </span>
                ) : null}
              </div>
            </div>

            {invalidRecipients.length > 0 || duplicateRecipients.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                {invalidRecipients.length > 0 ? (
                  <p>
                    Invalid emails ignored: <span className="font-medium">{invalidRecipients.length}</span>
                  </p>
                ) : null}
                {duplicateRecipients.length > 0 ? (
                  <p>
                    Duplicate emails removed: <span className="font-medium">{duplicateRecipients.length}</span>
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </ComposeFieldRow>
  );
}

export default RecipientsSection;
