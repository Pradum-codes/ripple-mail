import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import type { SenderDisplayRecord } from '../types';

export interface SenderDeleteModalProps {
  isOpen: boolean;
  sender: SenderDisplayRecord | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  deleting: boolean;
}

function SenderDeleteModal({
  isOpen,
  sender,
  onClose,
  onConfirm,
  deleting,
}: SenderDeleteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title="Delete Sender"
      onClose={deleting ? () => undefined : onClose}
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              void onConfirm();
            }}
            loading={deleting}
          >
            Delete Sender
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-700">
          Are you sure you want to delete this sender account?
        </p>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p className="font-medium text-slate-900">{sender?.name ?? sender?.username ?? 'Sender'}</p>
          <p>{sender?.email}</p>
        </div>
        <p className="text-sm text-slate-500">
          If campaigns still reference this sender, the backend may reject the deletion.
        </p>
      </div>
    </Modal>
  );
}

export default SenderDeleteModal;
