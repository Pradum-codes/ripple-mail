import { useCallback, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type RefObject } from 'react';
import {
  isSupportedRecipientFile,
  parseRecipientUploadFile,
  type ParsedRecipientUpload,
} from '@/utils/recipientUpload';

export interface UseRecipientUploadResult {
  fileName: string | null;
  validRecipients: ReadonlyArray<string>;
  invalidRecipients: ReadonlyArray<string>;
  duplicateRecipients: ReadonlyArray<string>;
  previewRecipients: ReadonlyArray<string>;
  summary: ParsedRecipientUpload['summary'] | null;
  error: string | null;
  isDragging: boolean;
  isParsing: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  openPicker: () => void;
  removeFile: () => void;
  handleInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleDrop: (event: DragEvent<HTMLElement>) => void;
  handleDragOver: (event: DragEvent<HTMLElement>) => void;
  handleDragEnter: (event: DragEvent<HTMLElement>) => void;
  handleDragLeave: (event: DragEvent<HTMLElement>) => void;
}

function useRecipientUpload(): UseRecipientUploadResult {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [validRecipients, setValidRecipients] = useState<ReadonlyArray<string>>([]);
  const [invalidRecipients, setInvalidRecipients] = useState<ReadonlyArray<string>>([]);
  const [duplicateRecipients, setDuplicateRecipients] = useState<ReadonlyArray<string>>([]);
  const [summary, setSummary] = useState<ParsedRecipientUpload['summary'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const clearState = useCallback(() => {
    setFileName(null);
    setValidRecipients([]);
    setInvalidRecipients([]);
    setDuplicateRecipients([]);
    setSummary(null);
    setError(null);
    setIsDragging(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  const handleFile = useCallback(
    async (file: File | undefined | null) => {
      if (!file) {
        return;
      }

      if (!isSupportedRecipientFile(file)) {
        clearState();
        setError('Please upload a .csv or .txt file.');
        return;
      }

      setIsParsing(true);
      setError(null);

      try {
        const parsed = await parseRecipientUploadFile(file);
        setFileName(parsed.fileName);
        setValidRecipients(parsed.validRecipients);
        setInvalidRecipients(parsed.invalidRecipients);
        setDuplicateRecipients(parsed.duplicateRecipients);
        setSummary(parsed.summary);
      } catch (caughtError) {
        clearState();
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'We could not parse that file.',
        );
      } finally {
        setIsParsing(false);
      }
    },
    [clearState],
  );

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const removeFile = useCallback(() => {
    clearState();
  }, [clearState]);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0] ?? null;
      void handleFile(selectedFile);
    },
    [handleFile],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const droppedFile = event.dataTransfer.files?.[0] ?? null;
      void handleFile(droppedFile);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
  }, []);

  const handleDragEnter = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const previewRecipients = useMemo(() => validRecipients.slice(0, 10), [validRecipients]);

  return {
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
  };
}

export default useRecipientUpload;
