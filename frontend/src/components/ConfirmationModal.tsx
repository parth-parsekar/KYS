import React, { useState } from 'react';

export type ModalType = 'pause' | 'resume' | 'cancel' | 'delete';

interface ConfirmationModalProps {
  isOpen: boolean;
  type: ModalType;
  serviceName: string;
  defaultRenewalDate?: string;
  onClose: () => void;
  onConfirm: (payload?: { nextRenewalDate?: string }) => Promise<void>;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  type,
  serviceName,
  defaultRenewalDate,
  onClose,
  onConfirm,
}) => {
  const [renewalDate, setRenewalDate] = useState(
    defaultRenewalDate
      ? new Date(defaultRenewalDate).toISOString().split('T')[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAction = async () => {
    setIsSubmitting(true);
    try {
      if (type === 'resume') {
        await onConfirm({ nextRenewalDate: renewalDate });
      } else {
        await onConfirm();
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'pause':
        return `Pause ${serviceName}?`;
      case 'resume':
        return `Resume ${serviceName}?`;
      case 'cancel':
        return `Mark ${serviceName} as cancelled?`;
      case 'delete':
        return `Delete ${serviceName} record?`;
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'pause':
        return `This pauses tracking, not the ${serviceName} service. Paused records are excluded from totals and alerts.`;
      case 'resume':
        return `Tracking resumes with the next renewal date below.`;
      case 'cancel':
        return `This will not cancel your subscription with ${serviceName}. Visit ${serviceName} directly to stop billing.`;
      case 'delete':
        return `Permanently remove this KYS tracking record. This cannot be undone and will not cancel ${serviceName}.`;
    }
  };

  const getConfirmText = () => {
    switch (type) {
      case 'pause':
        return 'Pause tracking';
      case 'resume':
        return 'Resume tracking';
      case 'cancel':
        return 'Mark as cancelled';
      case 'delete':
        return 'Delete record';
    }
  };

  const getCancelText = () => {
    switch (type) {
      case 'pause':
        return 'Cancel';
      case 'resume':
        return 'Keep paused';
      case 'cancel':
        return 'Keep active';
      case 'delete':
        return 'Keep record';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div>
          <h3 className="text-xl font-bold text-[#111827]">{getTitle()}</h3>
          <p className="text-xs text-[#4B5563] mt-2 leading-relaxed">{getDescription()}</p>
        </div>

        {type === 'resume' && (
          <div className="pt-2">
            <label className="block text-xs font-medium text-[#374151] mb-1">
              Next renewal date
            </label>
            <input
              type="date"
              value={renewalDate}
              onChange={(e) => setRenewalDate(e.target.value)}
              className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:outline-none focus:border-[#111827]"
            />
          </div>
        )}

        <div className="pt-4 flex items-center justify-between space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-xs font-semibold text-[#374151] bg-white border border-[#D1D5DB] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {getCancelText()}
          </button>
          <button
            type="button"
            onClick={handleAction}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-[#18181B] rounded-lg hover:bg-black transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : getConfirmText()}
          </button>
        </div>
      </div>
    </div>
  );
};
