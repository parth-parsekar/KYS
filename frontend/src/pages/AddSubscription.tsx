import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { calculateNextRenewal, formatLocalDate } from '../utils/dateUtils';
import { getCurrencySymbol, convertCurrency, detectDefaultCurrency } from '../utils/currencyUtils';

export const AddSubscription: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const userPreferredCurr = user?.preferredCurrency || detectDefaultCurrency();

  const [activeTab, setActiveTab] = useState<'catalog' | 'custom'>('catalog');
  const [catalog, setCatalog] = useState<any[]>([]);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<any | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('All categories');
  const [mobileViewTab, setMobileViewTab] = useState<'catalog' | 'form'>('catalog');

  // Form fields
  const [serviceName, setServiceName] = useState('');
  const [category, setCategory] = useState('Entertainment');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(userPreferredCurr);
  const [billingFrequency, setBillingFrequency] = useState('Monthly');
  const [startDate, setStartDate] = useState(formatLocalDate(new Date()));
  const [nextRenewalDate, setNextRenewalDate] = useState(
    calculateNextRenewal(formatLocalDate(new Date()), 'Monthly')
  );
  const [status, setStatus] = useState('Active');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Keep form currency and amounts synced with user's preferred currency once auth loads
  useEffect(() => {
    if (user?.preferredCurrency) {
      setCurrency(user.preferredCurrency);
      if (selectedCatalogItem) {
        const converted = convertCurrency(
          selectedCatalogItem.suggestedPrice,
          selectedCatalogItem.currency || 'USD',
          user.preferredCurrency
        );
        setAmount(converted.toFixed(2));
      }
    }
  }, [user?.preferredCurrency]);

  useEffect(() => {
    loadCatalog();
  }, [catalogCategory]);

  const loadCatalog = async () => {
    try {
      const res = await api.getCatalog({
        category: catalogCategory === 'All categories' ? undefined : catalogCategory,
        search: catalogSearch,
      });
      if (res.success && res.services) {
        setCatalog(res.services);
        if (!selectedCatalogItem && res.services.length > 0) {
          selectService(res.services[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectService = (item: any) => {
    setSelectedCatalogItem(item);
    setServiceName(item.name);
    setCategory(item.category);
    const targetCurrency = user?.preferredCurrency || detectDefaultCurrency();
    setCurrency(targetCurrency);
    const converted = convertCurrency(item.suggestedPrice, item.currency || 'USD', targetCurrency);
    setAmount(converted.toFixed(2));
    const freq = item.billingFrequency || 'Monthly';
    setBillingFrequency(freq);
    setNextRenewalDate(calculateNextRenewal(startDate, freq));
    setMobileViewTab('form');
  };

  const handleCatalogSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCatalog();
  };

  const handleTabChange = (tab: 'catalog' | 'custom') => {
    setActiveTab(tab);
    setMobileViewTab('form');
    if (tab === 'custom') {
      setSelectedCatalogItem(null);
      setServiceName('');
      setAmount('');
      setCurrency(user?.preferredCurrency || detectDefaultCurrency());
    } else if (catalog.length > 0) {
      selectService(catalog[0]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!serviceName.trim()) {
      setError('Service name is required');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }

    if (new Date(nextRenewalDate) < new Date(startDate)) {
      setError('Renewal date must not be before the start date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createSubscription({
        serviceName,
        category,
        amount: numAmount,
        currency,
        billingFrequency,
        startDate,
        nextRenewalDate,
        status,
        customService: activeTab === 'custom',
      });

      if (res.success) {
        setSuccessMsg('Subscription added successfully!');
        setTimeout(() => {
          navigate('/subscriptions');
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || 'Could not save subscription. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">Add subscription</h2>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-1">Track a new service in just a few steps.</p>
      </div>

      {/* Mobile Step Switcher (< 1024px) */}
      <div className="flex lg:hidden bg-[#F3F4F6] p-1 rounded-lg border border-[#E5E7EB]">
        <button
          type="button"
          onClick={() => setMobileViewTab('catalog')}
          className={`flex-1 text-xs py-2 font-semibold rounded-md transition-all ${
            mobileViewTab === 'catalog'
              ? 'bg-white text-[#111827] shadow-xs'
              : 'text-[#6B7280]'
          }`}
        >
          1. Browse Catalog
        </button>
        <button
          type="button"
          onClick={() => setMobileViewTab('form')}
          className={`flex-1 text-xs py-2 font-semibold rounded-md transition-all ${
            mobileViewTab === 'form'
              ? 'bg-white text-[#111827] shadow-xs'
              : 'text-[#6B7280]'
          }`}
        >
          2. Confirm & Save {serviceName ? `(${serviceName})` : ''}
        </button>
      </div>

      {/* Main 2-column Layout matching Screen 03 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Quick-add a service */}
        <div className={`bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 space-y-5 ${mobileViewTab === 'catalog' ? 'block' : 'hidden lg:block'}`}>
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Quick-add a service</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">1. Choose a service · 2. Confirm details · 3. Save</p>
          </div>

          {/* Search catalog */}
          <form onSubmit={handleCatalogSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search services..."
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              className="w-full bg-white text-xs text-[#111827] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#111827]"
            />
          </form>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            {['All categories', 'Entertainment', 'Work tools', 'Productivity', 'Storage'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCatalogCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  catalogCategory === cat
                    ? 'border-[#18181B] bg-[#18181B] text-white'
                    : 'border-[#E5E7EB] text-[#374151] hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Catalog grid (2 cols) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {catalog.map((item) => {
              const isSelected = selectedCatalogItem?.name === item.name;
              const targetCurrency = user?.preferredCurrency || detectDefaultCurrency();
              const convertedPrice = convertCurrency(
                item.suggestedPrice,
                item.currency || 'USD',
                targetCurrency
              );
              const sym = getCurrencySymbol(targetCurrency);
              return (
                <div
                  key={item.name}
                  onClick={() => selectService(item)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#18181B] ring-1 ring-[#18181B] bg-[#F9FAFB]'
                      : 'border-[#E5E7EB] hover:border-[#CBD5E1] bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#111827]">{item.name}</h4>
                      <p className="text-[11px] text-[#6B7280]">{item.category}</p>
                    </div>
                    <span className="text-xs text-[#6B7280] font-semibold">
                      {isSelected ? 'Selected' : '+'}
                    </span>
                  </div>
                  <div className="mt-3 text-xs font-semibold text-[#111827]">
                    {sym}{convertedPrice.toFixed(2)} {targetCurrency} / {item.billingFrequency.toLowerCase()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Suggested prices disclaimer box */}
          <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl space-y-1">
            <h5 className="text-xs font-bold text-[#111827]">Suggested prices only — not your actual bill.</h5>
            <p className="text-xs text-[#6B7280]">
              Confirm your plan, amount and currency before saving.
            </p>
          </div>

          <div className="pt-2 text-xs text-[#6B7280]">
            Missing a service? Use{' '}
            <button
              type="button"
              onClick={() => handleTabChange('custom')}
              className="text-[#111827] font-semibold underline"
            >
              Custom entry
            </button>{' '}
            to add your own.
          </div>
        </div>

        {/* Right Column: Edit / Confirmation form */}
        <div className={`bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 space-y-6 ${mobileViewTab === 'form' ? 'block' : 'hidden lg:block'}`}>
          {/* Top Toggle Tabs */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleTabChange('catalog')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'catalog'
                  ? 'bg-[#18181B] text-white'
                  : 'bg-white border border-[#E5E7EB] text-[#374151] hover:bg-gray-50'
              }`}
            >
              Catalog service
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('custom')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'custom'
                  ? 'bg-[#18181B] text-white'
                  : 'bg-white border border-[#E5E7EB] text-[#374151] hover:bg-gray-50'
              }`}
            >
              Custom entry
            </button>
          </div>

          <p className="text-xs text-[#6B7280]">
            {activeTab === 'catalog' && selectedCatalogItem
              ? `Prefilled from ${selectedCatalogItem.name} · All values are editable`
              : 'Enter custom subscription details below'}
          </p>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Service Name & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Service name *
                </label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g. Netflix, GitHub"
                  className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#111827]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#111827]"
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

            {/* Amount & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="23.00"
                  className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#111827]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Currency *
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#111827]"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
            </div>

            {/* Billing frequency buttons matching wireframe 03 */}
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1.5">
                Billing frequency *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['Weekly', 'Monthly', 'Quarterly', 'Yearly'].map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => {
                      setBillingFrequency(freq);
                      setNextRenewalDate(calculateNextRenewal(startDate, freq));
                    }}
                    className={`py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                      billingFrequency === freq
                        ? 'bg-[#18181B] text-white border-[#18181B]'
                        : 'bg-white border-[#D1D5DB] text-[#374151] hover:bg-gray-50'
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>

            {/* Start date & Next renewal date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Start date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setStartDate(newStart);
                    setNextRenewalDate(calculateNextRenewal(newStart, billingFrequency));
                  }}
                  className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#111827]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Next renewal date *
                </label>
                <input
                  type="date"
                  value={nextRenewalDate}
                  onChange={(e) => setNextRenewalDate(e.target.value)}
                  className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#111827]"
                  required
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">
                Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#111827]"
              >
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Expired">Expired</option>
              </select>
              <p className="text-[11px] text-[#9CA3AF] mt-1">
                Active · Paused · Cancelled · Expired
              </p>
            </div>

            {/* Info callout matching Screen 03 */}
            <div className="pt-2 text-xs text-[#6B7280] space-y-1">
              <p className="font-medium text-[#374151]">Renewal alerts arrive within 3 days of renewal.</p>
              <p>Only active subscriptions generate reminders.</p>
              <p>We store subscription details, never bank or card data.</p>
            </div>

            {/* Action buttons */}
            <div className="pt-4 flex items-center justify-between space-x-3">
              <button
                type="button"
                onClick={() => navigate('/subscriptions')}
                className="px-5 py-2.5 text-xs font-semibold text-[#374151] bg-white border border-[#D1D5DB] rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#18181B] rounded-lg hover:bg-black transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save subscription'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer disclaimer */}
      <footer className="pt-4 border-t border-[#E5E7EB] text-center md:text-left">
        <p className="text-[11px] text-[#9CA3AF]">
          Catalog defaults are suggestions. KYS does not charge, verify payments or cancel third-party services.
        </p>
      </footer>
    </div>
  );
};

