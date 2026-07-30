import Papa, { type ParseStepResult } from 'papaparse';

export interface RecipientUploadSummary {
  valid: number;
  invalid: number;
  duplicatesRemoved: number;
  totalAccepted: number;
}

export interface ParsedRecipientUpload {
  fileName: string;
  validRecipients: ReadonlyArray<string>;
  invalidRecipients: ReadonlyArray<string>;
  duplicateRecipients: ReadonlyArray<string>;
  summary: RecipientUploadSummary;
}

const SUPPORTED_EXTENSIONS = ['csv', 'txt'];
const SUPPORTED_MIME_TYPES = new Set([
  'text/csv',
  'text/plain',
  'application/csv',
  'application/vnd.ms-excel',
]);

const HEADER_CANDIDATES = new Set(['email', 'emails', 'recipient', 'recipients', 'e-mail']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isSupportedRecipientFile(file: File): boolean {
  const fileName = file.name.toLowerCase();
  const extension = fileName.includes('.') ? fileName.split('.').pop() ?? '' : '';

  return (
    SUPPORTED_EXTENSIONS.includes(extension) ||
    SUPPORTED_MIME_TYPES.has(file.type.toLowerCase())
  );
}

export function parseRecipientUploadFile(file: File): Promise<ParsedRecipientUpload> {
  return new Promise((resolve, reject) => {
    const validRecipients: string[] = [];
    const invalidRecipients: string[] = [];
    const duplicateRecipients: string[] = [];
    const seenRecipients = new Set<string>();

    let hasAnyNonEmptyCell = false;
    let firstMeaningfulCellSeen = false;

    Papa.parse<string[]>(file, {
      worker: true,
      skipEmptyLines: 'greedy',
      step: (results: ParseStepResult<string[]>) => {
        const row = Array.isArray(results.data) ? results.data : [];
        const firstCell = String(row[0] ?? '').trim();

        if (!firstCell) {
          return;
        }

        hasAnyNonEmptyCell = true;

        if (!firstMeaningfulCellSeen) {
          firstMeaningfulCellSeen = true;
          const normalizedHeader = normalizeRecipient(firstCell);

          if (HEADER_CANDIDATES.has(normalizedHeader)) {
            return;
          }
        }

        const normalizedEmail = normalizeRecipient(firstCell);

        if (!normalizedEmail) {
          return;
        }

        if (!isValidRecipient(normalizedEmail)) {
          invalidRecipients.push(normalizedEmail);
          return;
        }

        if (seenRecipients.has(normalizedEmail)) {
          duplicateRecipients.push(normalizedEmail);
          return;
        }

        seenRecipients.add(normalizedEmail);
        validRecipients.push(normalizedEmail);
      },
      complete: () => {
        if (!hasAnyNonEmptyCell || (validRecipients.length === 0 && invalidRecipients.length === 0)) {
          reject(new Error('The uploaded file does not contain any recipient emails.'));
          return;
        }

        resolve({
          fileName: file.name,
          validRecipients,
          invalidRecipients,
          duplicateRecipients,
          summary: {
            valid: validRecipients.length,
            invalid: invalidRecipients.length,
            duplicatesRemoved: duplicateRecipients.length,
            totalAccepted: validRecipients.length,
          },
        });
      },
      error: (error: Error) => {
        reject(new Error(error.message || 'Failed to parse the uploaded file.'));
      },
    });
  });
}

function normalizeRecipient(value: string): string {
  return value.trim().toLowerCase();
}

function isValidRecipient(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}
