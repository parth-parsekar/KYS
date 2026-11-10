import React, { useState } from 'react';

interface RecordBillingModalProps {
  isOpen: boolean;
  serviceName: string;
  defaultAmount: number;
  currency: string;
  onClose: () => void;
  onRecord: (payload: {
    billingAmount: number;
    currency: string;
    billingDate: string;
    billingStatus: string;
    eventType: string;
    notes?: string;
  }) => Promise<void>;
}

export const RecordBillingModal: React.FC<RecordBillingModalProps> = ({
  isOpen,
  serviceName,
  defaultAmount,
  currency,
  onClose,
  onRecord,
}) => {
  const [amount, setAmount] = useState(defaultAmount.toString());
  const [billingDate, setBillingDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('Paid');
  const [eventType, setEventType] = useState('Renewal');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRecord({
        billingAmount: num,
        currency,
        billingDate,
        billingStatus: status,
        eventType,
        notes,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4">
        <div>
          <h3 className="text-xl font-bold text-[#111827]">Record a billing event</h3>
          <p className="text-xs text-[#4B5563] mt-1">
            Manual user-entered event for {serviceName}.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">
              Billing amount ({currency}) *
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:outline-none focus:border-[#111827]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">
              Billing date *
            </label>
            <input
              type="date"
              value={billingDate}
              onChange={(e) => setBillingDate(e.target.value)}
              className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:outline-none focus:border-[#111827]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:outline-none focus:border-[#111827]"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Event type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:outline-none focus:border-[#111827]"
              >
                <option value="Renewal">Renewal</option>
                <option value="Initial">Initial</option>
                <option value="Adjustment">Adjustment</option>
                <option value="Manual">Manual</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Notes (optional)</label>
            <input
              type="text"
              placeholder="e.g. Card invoice reference"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:outline-none focus:border-[#111827]"
            />
          </div>

          <div className="pt-3 flex items-center justify-between space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-xs font-semibold text-[#374151] bg-white border border-[#D1D5DB] rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-[#18181B] rounded-lg hover:bg-black transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Record event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

