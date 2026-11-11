import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { getCurrencySymbol } from '../utils/currencyUtils';

export const PreferencesBudget: React.FC = () => {
  const { user, updateProfile, refreshUser } = useAuth();

  // Profile preferences
  const [name, setName] = useState(user?.name || '');
  const [preferredCurrency, setPreferredCurrency] = useState(user?.preferredCurrency || 'USD');
  const [timezone, setTimezone] = useState(user?.timezone || 'America/Los_Angeles');

  // Budget settings
  const [monthlyLimit, setMonthlyLimit] = useState(user?.monthlyBudget?.toString() || '300.00');
  const [budgetCurrency, setBudgetCurrency] = useState(user?.preferredCurrency || 'USD');
  const [alertThreshold, setAlertThreshold] = useState(user?.alertThreshold?.toString() || '80');
  const [notifyOnThreshold, setNotifyOnThreshold] = useState(user?.notifyOnThreshold ?? true);

  // Live budget utilization state
  const [budgetStatus, setBudgetStatus] = useState<any>(null);
  const [prefMessage, setPrefMessage] = useState('');
  const [budgetMessage, setBudgetMessage] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPreferredCurrency(user.preferredCurrency || 'USD');
      setTimezone(user.timezone || 'America/Los_Angeles');
      setMonthlyLimit(user.monthlyBudget?.toString() || '300.00');
      setBudgetCurrency(user.preferredCurrency || 'USD');
      setAlertThreshold(user.alertThreshold?.toString() || '80');
      setNotifyOnThreshold(user.notifyOnThreshold ?? true);
    }
    loadBudgetStatus();
  }, [user]);

  const loadBudgetStatus = async () => {
    try {
      const res = await api.getBudget();
      if (res.success && res.budget) {
        setBudgetStatus(res.budget);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrefMessage('');
    try {
      await updateProfile({
        name,
        preferredCurrency,
        timezone,
      });
      setPrefMessage('Preferences saved successfully.');
      setTimeout(() => setPrefMessage(''), 3000);
    } catch (err: any) {
      setPrefMessage(err.message || 'Error updating preferences');
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setBudgetMessage('');
    try {
      const res = await api.updateBudget({
        monthlyLimit: parseFloat(monthlyLimit),
        alertThreshold: parseInt(alertThreshold, 10),
        notifyOnThreshold,
        currency: budgetCurrency,
      });
      if (res.success) {
        setBudgetMessage('Budget settings saved successfully.');
        await refreshUser();
        await loadBudgetStatus();
        setTimeout(() => setBudgetMessage(''), 3000);
      }
    } catch (err: any) {
      setBudgetMessage(err.message || 'Error updating budget');
    }
  };

  const currentSpend = budgetStatus ? Math.round(budgetStatus.currentSpend) : 248;
  const limitNum = parseFloat(monthlyLimit) || 300;
  const usedPct = limitNum > 0 ? Math.round((currentSpend / limitNum) * 100) : 0;
  const remaining = Math.max(0, limitNum - currentSpend);
  const thresholdNum = parseInt(alertThreshold, 10) || 80;
  const thresholdCrossed = usedPct >= thresholdNum;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">Preferences & budget</h2>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-1">Make KYS work for your currency, time zone and budget.</p>
      </div>

      {/* 2 Column Layout matching Screen 11 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
        {/* Left Column: Account preferences */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-[#111827]">Account preferences</h3>
          </div>

          {prefMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200">
              {prefMessage}
            </div>
          )}

          <form onSubmit={handleSavePreferences} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#111827]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Email · read only</label>
              <input
                type="email"
                value={user?.email || 'alex@example.com'}
                disabled
                className="w-full text-xs text-[#6B7280] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Preferred currency</label>
              <select
                value={preferredCurrency}
                onChange={(e) => {
                  setPreferredCurrency(e.target.value);
                  setBudgetCurrency(e.target.value);
                }}
                className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#111827]"
              >
                <option value="USD">USD — US Dollar ($)</option>
                <option value="EUR">EUR — Euro (€)</option>
                <option value="GBP">GBP — British Pound (£)</option>
                <option value="INR">INR — Indian Rupee (₹)</option>
                <option value="CAD">CAD — Canadian Dollar (CA$)</option>
                <option value="AUD">AUD — Australian Dollar (AU$)</option>
              </select>
              <p className="text-[11px] text-[#9CA3AF] mt-1">Spending and budget totals convert to your preferred currency.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Time zone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#111827]"
              >
                {[
                  'Asia/Kolkata',
                  'America/New_York',
                  'America/Chicago',
                  'America/Denver',
                  'America/Los_Angeles',
                  'Europe/London',
                  'Europe/Paris',
                  'Europe/Berlin',
                  'Asia/Dubai',
                  'Asia/Singapore',
                  'Asia/Tokyo',
                  'Australia/Sydney',
                  'UTC',
                ].includes(timezone) ? null : (
                  <option value={timezone}>{timezone} (Current)</option>
                )}
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Europe/Paris">Europe/Paris (CET)</option>
                <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Chicago">America/Chicago (CST)</option>
                <option value="America/Denver">America/Denver (MST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                <option value="UTC">UTC</option>
              </select>
              <p className="text-[11px] text-[#9CA3AF] mt-1">Renewals and reminders use this time zone.</p>
            </div>

            <div className="pt-1">
              <p className="text-xs text-[#374151] font-semibold">
                Role: {user?.role === 'admin' ? 'Administrator' : 'User'}
              </p>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                {user?.role === 'admin'
                  ? 'Administrator accounts have access to aggregate platform reporting.'
                  : 'Only authorized accounts can access administration.'}
              </p>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#18181B] rounded-lg hover:bg-black transition-colors"
              >
                Save preferences
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Monthly spending budget */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-[#111827]">Monthly spending budget</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">Set a limit and decide when KYS should warn you.</p>
          </div>

          {budgetMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200">
              {budgetMessage}
            </div>
          )}

          <form onSubmit={handleSaveBudget} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Monthly limit *</label>
                <input
                  type="number"
                  step="0.01"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  placeholder="300.00"
                  className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#111827]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Budget currency</label>
                <select
                  value={budgetCurrency}
                  onChange={(e) => setBudgetCurrency(e.target.value)}
                  className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#111827]"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="CAD">CAD (CA$)</option>
                  <option value="AUD">AUD (AU$)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Alert threshold (%) *</label>
              <input
                type="number"
                min="1"
                max="100"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#111827]"
                required
              />
              <p className="text-[11px] text-[#9CA3AF] mt-1">Choose a percentage between 1 and 100.</p>
            </div>

            <div className="flex items-start space-x-2.5 pt-1">
              <input
                type="checkbox"
                id="notifyCheckbox"
                checked={notifyOnThreshold}
                onChange={(e) => setNotifyOnThreshold(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-[#D1D5DB] text-[#18181B] focus:ring-0"
              />
              <label htmlFor="notifyCheckbox" className="text-xs text-[#374151]">
                <span className="font-semibold text-[#111827] block">Notify me when this threshold is crossed</span>
                <span className="text-[#6B7280]">Budget alerts are saved with your notifications.</span>
              </label>
            </div>

            {/* Current month preview box matching Screen 11 */}
            <div className="p-5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl space-y-3">
              <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Current month</span>
              <div className="text-2xl font-bold text-[#111827]">
                {getCurrencySymbol(budgetCurrency)}{currentSpend} of {getCurrencySymbol(budgetCurrency)}{Math.round(limitNum)}
              </div>

              <div className="w-full bg-[#E5E7EB] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#374151] h-2 rounded-full"
                  style={{ width: `${Math.min(100, usedPct)}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-[#6B7280]">
                <span>{usedPct}% used</span>
                <span>{getCurrencySymbol(budgetCurrency)}{remaining} remaining</span>
              </div>
            </div>

            {thresholdCrossed && (
              <p className="text-xs text-[#4B5563]">
                {thresholdNum}% threshold reached · Alert saved.
              </p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#18181B] rounded-lg hover:bg-black transition-colors"
              >
                Save budget
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer disclaimer */}
      <footer className="pt-4 border-t border-[#E5E7EB] text-center md:text-left">
        <p className="text-[11px] text-[#9CA3AF]">
          Subscription metadata only · No bank details, card numbers or payment credentials are collected.
        </p>
      </footer>
    </div>
  );
};

