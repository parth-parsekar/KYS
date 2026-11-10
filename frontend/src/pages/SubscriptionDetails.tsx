import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { ConfirmationModal, ModalType } from '../components/ConfirmationModal';
import { RecordBillingModal } from '../components/RecordBillingModal';
import { calculateNextRenewal } from '../utils/dateUtils';
import { getCurrencySymbol } from '../utils/currencyUtils';

export const SubscriptionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<any>(null);
  const [billingEvents, setBillingEvents] = useState<any[]>([]);
  const [monthlyEquivalent, setMonthlyEquivalent] = useState<number>(0);

  // Edit form states
  const [editServiceName, setEditServiceName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCurrency, setEditCurrency] = useState('USD');
  const [editFrequency, setEditFrequency] = useState('Monthly');
  const [editStatus, setEditStatus] = useState('Active');
  const [editStartDate, setEditStartDate] = useState('');
  const [editNextRenewalDate, setEditNextRenewalDate] = useState('');

  // Modals state
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (id) {
      loadSubscription(id);
    }
  }, [id]);

  const loadSubscription = async (subId: string) => {
    try {
      setLoading(true);
      const res = await api.getSubscriptionById(subId);
      if (res.success && res.subscription) {
        setSub(res.subscription);
        setBillingEvents(res.billingEvents || []);
        setMonthlyEquivalent(res.monthlyEquivalent);

        // Populate edit form
        setEditServiceName(res.subscription.serviceName);
        setEditCategory(res.subscription.category);
        setEditAmount(res.subscription.amount.toString());
        setEditCurrency(res.subscription.currency);
        setEditFrequency(res.subscription.billingFrequency);
        setEditStatus(res.subscription.status);
        setEditStartDate(new Date(res.subscription.startDate).toISOString().split('T')[0]);
        setEditNextRenewalDate(new Date(res.subscription.nextRenewalDate).toISOString().split('T')[0]);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error loading subscription' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sub) return;
    try {
      const res = await api.updateSubscription(sub._id, {
        serviceName: editServiceName,
        category: editCategory,
        amount: parseFloat(editAmount),
        currency: editCurrency,
        billingFrequency: editFrequency,
        status: editStatus,
        startDate: editStartDate,
        nextRenewalDate: editNextRenewalDate,
      });
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: 'Changes saved successfully.' });
        loadSubscription(sub._id);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Could not update subscription' });
    }
  };

  const handleModalConfirm = async (payload?: { nextRenewalDate?: string }) => {
    if (!sub || !modalType) return;
    try {
      if (modalType === 'pause') {
        await api.pauseSubscription(sub._id);
        setFeedbackMsg({ type: 'success', text: `${sub.serviceName} paused.` });
      } else if (modalType === 'resume') {
        await api.resumeSubscription(sub._id, payload?.nextRenewalDate);
        setFeedbackMsg({ type: 'success', text: `${sub.serviceName} resumed.` });
      } else if (modalType === 'cancel') {
        await api.cancelSubscription(sub._id);
        setFeedbackMsg({ type: 'success', text: `${sub.serviceName} marked as cancelled.` });
      } else if (modalType === 'delete') {
        await api.deleteSubscription(sub._id);
        navigate('/subscriptions');
        return;
      }
      loadSubscription(sub._id);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Operation failed' });
    }
  };

  const handleRecordBilling = async (eventData: any) => {
    if (!sub) return;
    const res = await api.recordBillingEvent(sub._id, eventData);
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: 'Billing event recorded.' });
      loadSubscription(sub._id);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-[#6B7280]">
        Loading subscription details...
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4">
        <h3 className="text-base font-bold text-[#111827]">Subscription Not Found</h3>
        <p className="text-xs text-[#6B7280]">This subscription may have been removed or belongs to another user.</p>
        <button
          onClick={() => navigate('/subscriptions')}
          className="px-4 py-2 bg-[#18181B] text-white text-xs font-semibold rounded-lg"
        >
          Back to subscriptions
        </button>
      </div>
    );
  }

  const shortId = `KYS-${sub._id.toString().slice(-4).toUpperCase()}`;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#111827]">Subscription details</h2>
        <p className="text-xs md:text-sm text-[#6B7280] mt-1">View, update and manage your subscription.</p>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3 text-xs rounded-lg border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {feedbackMsg.text}
        </div>
      )}

      {/* 2-Column layout matching Screen 09 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Details Card & Billing History */}
        <div className="space-y-6">
          {/* Main Info Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-5">
            <div className="flex items-start justify-between">
              <h3 className="text-2xl font-bold text-[#111827]">{sub.serviceName}</h3>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                  sub.status === 'Active'
                    ? 'bg-[#F3F4F6] text-[#111827]'
                    : sub.status === 'Paused'
                    ? 'bg-amber-100 text-amber-800'
                    : sub.status === 'Cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {sub.status}
              </span>
            </div>

            <div>
              <div className="text-3xl font-bold text-[#111827]">
                {getCurrencySymbol(sub.currency)}{sub.amount.toFixed(2)} <span className="text-sm font-normal text-[#6B7280]">{sub.currency}</span> <span className="text-base font-normal text-[#6B7280]">/ {sub.billingFrequency.toLowerCase()}</span>
              </div>
            </div>

            {/* Metadata Table */}
            <div className="divide-y divide-[#F3F4F6] text-xs pt-2">
              <div className="py-2.5 flex justify-between">
                <span className="text-[#6B7280]">Category</span>
                <span className="font-medium text-[#111827]">{sub.category}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#6B7280]">Start date</span>
                <span className="font-medium text-[#111827]">
                  {new Date(sub.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#6B7280]">Next renewal</span>
                <span className="font-medium text-[#111827]">
                  {new Date(sub.nextRenewalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#6B7280]">Monthly equivalent</span>
                <span className="font-semibold text-[#111827]">{getCurrencySymbol(sub.currency)}{monthlyEquivalent.toFixed(2)} {sub.currency}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#6B7280]">Subscription ID</span>
                <span className="font-mono text-[#111827]">{shortId}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#6B7280]">Owner · read only</span>
                <span className="text-[#111827]">You · U-1024</span>
              </div>
            </div>

            <div className="text-[11px] text-[#9CA3AF]">
              Created {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · Updated {new Date(sub.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>

            {/* Quick Action buttons */}
            <div className="pt-2 flex items-center space-x-2">
              {sub.status === 'Active' ? (
                <button
                  type="button"
                  onClick={() => setModalType('pause')}
                  className="flex-1 py-2 text-xs font-semibold text-[#374151] bg-white border border-[#D1D5DB] rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Pause
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setModalType('resume')}
                  className="flex-1 py-2 text-xs font-semibold text-[#111827] bg-[#F3F4F6] border border-[#D1D5DB] rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Resume
                </button>
              )}

              {sub.status !== 'Cancelled' && (
                <button
                  type="button"
                  onClick={() => setModalType('cancel')}
                  className="flex-1 py-2 text-xs font-semibold text-[#374151] bg-white border border-[#D1D5DB] rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Mark cancelled
                </button>
              )}

              <button
                type="button"
                onClick={() => setModalType('delete')}
                className="flex-1 py-2 text-xs font-semibold text-[#DC2626] bg-white border border-[#FCA5A5] rounded-lg hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Billing History Card matching Screen 09 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Billing history</h3>
              <p className="text-xs text-[#6B7280] mt-0.5">Demo events · Not verified payments</p>
            </div>

            <div className="divide-y divide-[#F3F4F6]">
              {billingEvents.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#6B7280]">
                  There are no recorded billing events yet.
                </div>
              ) : (
                billingEvents.map((evt: any) => (
                  <div key={evt._id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-[#111827]">
                        {new Date(evt.billingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-[#9CA3AF] text-[11px] ml-2">({evt.eventType})</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-[#111827]">{getCurrencySymbol(evt.currency || sub.currency)}{evt.billingAmount.toFixed(2)}</span>
                      <span className="text-[11px] text-[#6B7280] capitalize">{evt.dataSource}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setIsBillingModalOpen(true)}
              className="w-full py-2.5 text-xs font-semibold text-[#111827] bg-white border border-[#D1D5DB] rounded-lg hover:bg-gray-50 transition-colors"
            >
              Record a billing event
            </button>

            <p className="text-[11px] text-[#9CA3AF] text-center">
              User-entered events must be explicitly confirmed.
            </p>
          </div>
        </div>

        {/* Right Column: Edit Subscription Form */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-[#111827]">Edit subscription</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">Changes affect tracking only, not your provider.</p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Service name *
                </label>
                <input
                  type="text"
                  value={editServiceName}
                  onChange={(e) => setEditServiceName(e.target.value)}
                  className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 focus:outline-none focus:border-[#111827]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Category *
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 focus:outline-none focus:border-[#111827]"
                >
                  <option value="Entertainment">Entertainment</option>
                  <option value="Work tools">Work tools</option>
                  <option value="Productivity">Productivity</option>
                  <option value="Storage">Storage</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 focus:outline-none focus:border-[#111827]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Currency *
                </label>
                <select
                  value={editCurrency}
                  onChange={(e) => setEditCurrency(e.target.value)}
                  className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 focus:outline-none focus:border-[#111827]"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Billing frequency *
                </label>
                <select
                  value={editFrequency}
                  onChange={(e) => {
                    const newFreq = e.target.value;
                    setEditFrequency(newFreq);
                    if (editStartDate) {
                      setEditNextRenewalDate(calculateNextRenewal(editStartDate, newFreq));
                    }
                  }}
                  className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 focus:outline-none focus:border-[#111827]"
                >
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Status *
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 focus:outline-none focus:border-[#111827]"
                >
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Start date *
                </label>
                <input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setEditStartDate(newStart);
                    if (newStart) {
                      setEditNextRenewalDate(calculateNextRenewal(newStart, editFrequency));
                    }
                  }}
                  className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 focus:outline-none focus:border-[#111827]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Next renewal date *
                </label>
                <input
                  type="date"
                  value={editNextRenewalDate}
                  onChange={(e) => setEditNextRenewalDate(e.target.value)}
                  className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 focus:outline-none focus:border-[#111827]"
                  required
                />
              </div>
            </div>

            <div className="text-[11px] text-[#9CA3AF] space-y-0.5 pt-1">
              <p>Frequencies: Weekly · Monthly · Quarterly · Yearly</p>
              <p>Statuses: Active · Paused · Cancelled · Expired</p>
            </div>

            {/* Warning callout box */}
            <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl space-y-1">
              <p className="text-xs font-bold text-[#111827]">
                Cancellation in KYS only changes this tracking record.
              </p>
              <p className="text-xs text-[#6B7280]">
                Contact {sub.serviceName} directly to cancel your actual service.
              </p>
            </div>

            {/* Discard & Save changes */}
            <div className="pt-4 flex items-center justify-between space-x-3">
              <button
                type="button"
                onClick={() => loadSubscription(sub._id)}
                className="px-5 py-2.5 text-xs font-semibold text-[#374151] bg-white border border-[#D1D5DB] rounded-lg hover:bg-gray-50 transition-colors"
              >
                Discard
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#18181B] rounded-lg hover:bg-black transition-colors shadow-sm"
              >
                Save changes
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation & Billing Modals */}
      {modalType && (
        <ConfirmationModal
          isOpen={Boolean(modalType)}
          type={modalType}
          serviceName={sub.serviceName}
          defaultRenewalDate={sub.nextRenewalDate}
          onClose={() => setModalType(null)}
          onConfirm={handleModalConfirm}
        />
      )}

      {isBillingModalOpen && (
        <RecordBillingModal
          isOpen={isBillingModalOpen}
          serviceName={sub.serviceName}
          defaultAmount={sub.amount}
          currency={sub.currency}
          onClose={() => setIsBillingModalOpen(false)}
          onRecord={handleRecordBilling}
        />
      )}

      {/* Footer */}
      <footer className="pt-4 border-t border-[#E5E7EB] text-center md:text-left">
        <p className="text-[11px] text-[#9CA3AF]">
          Private record · Only the owner can view or change this subscription · Example data.
        </p>
      </footer>
    </div>
  );
};

