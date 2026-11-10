import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { getCurrencySymbol } from '../utils/currencyUtils';

export const Subscriptions: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState('All categories');
  const [frequency, setFrequency] = useState('All billing frequencies');
  const [sort, setSort] = useState('Next renewal');
  const [statusTab, setStatusTab] = useState('All');

  useEffect(() => {
    loadSubscriptions();
  }, [category, frequency, sort, statusTab]);

  // Sync url search param if changed
  useEffect(() => {
    const s = searchParams.get('search');
    if (s !== null) {
      setSearch(s);
      loadSubscriptionsWithSearch(s);
    }
  }, [searchParams]);

  const loadSubscriptionsWithSearch = async (searchTerm: string) => {
    try {
      setLoading(true);
      const res = await api.getSubscriptions({
        category,
        frequency,
        status: statusTab === 'All' ? undefined : statusTab,
        search: searchTerm,
        sort,
      });
      if (res.success) {
        setSubscriptions(res.data);
        setMeta(res.meta);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptions = async () => {
    loadSubscriptionsWithSearch(search);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(search ? { search } : {});
    loadSubscriptions();
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      await api.exportSubscriptionsCsv();
    } catch (err: any) {
      alert(err.message || 'Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const counts = meta?.counts || { all: 0, active: 0, paused: 0, cancelled: 0, expired: 0 };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#111827]">My subscriptions</h2>
          <p className="text-xs md:text-sm text-[#6B7280] mt-1">All your subscriptions, in one place.</p>
        </div>
        <div className="flex items-center space-x-2.5 self-start md:self-auto">
          <button
            onClick={handleExportCsv}
            disabled={isExporting || subscriptions.length === 0}
            className="inline-flex items-center justify-center px-3.5 py-2.5 bg-white border border-[#D1D5DB] text-[#374151] hover:bg-gray-50 text-xs font-medium rounded-lg transition-colors shadow-sm disabled:opacity-40"
            title="Download your subscriptions as CSV (PRD 3.4)"
          >
            {isExporting ? 'Exporting...' : '↓ Export CSV'}
          </button>
          <button
            onClick={() => navigate('/add')}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-[#18181B] text-white text-xs font-medium rounded-lg hover:bg-black transition-colors shadow-sm"
          >
            + Add subscription
          </button>
        </div>
      </div>

      {/* Filter Row matching wireframe 02 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <form onSubmit={handleSearchSubmit} className="w-full">
          <input
            type="text"
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white text-xs text-[#111827] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#111827]"
          />
        </form>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-white text-xs text-[#111827] border border-[#E5E7EB] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#111827]"
        >
          <option value="All categories">All categories</option>
          <option value="Entertainment">Entertainment</option>
          <option value="Work tools">Work tools</option>
          <option value="Productivity">Productivity</option>
          <option value="Storage">Storage</option>
          <option value="Utilities">Utilities</option>
          <option value="Other">Other</option>
        </select>

        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className="w-full bg-white text-xs text-[#111827] border border-[#E5E7EB] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#111827]"
        >
          <option value="All billing frequencies">All billing frequencies</option>
          <option value="Weekly">Weekly</option>
          <option value="Monthly">Monthly</option>
          <option value="Quarterly">Quarterly</option>
          <option value="Yearly">Yearly</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full bg-white text-xs text-[#111827] border border-[#E5E7EB] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#111827]"
        >
          <option value="Next renewal">Next renewal</option>
          <option value="name">Service name</option>
          <option value="amount_asc">Amount: Low to High</option>
          <option value="amount_desc">Amount: High to Low</option>
        </select>
      </div>

      {/* Status Filter Tabs & Active Total Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'All', label: `All (${counts.all})` },
            { id: 'Active', label: `Active (${counts.active})` },
            { id: 'Paused', label: `Paused (${counts.paused})` },
            { id: 'Cancelled', label: `Cancelled (${counts.cancelled})` },
            { id: 'Expired', label: `Expired (${counts.expired})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusTab === tab.id
                  ? 'bg-[#18181B] text-white shadow-sm'
                  : 'bg-white border border-[#E5E7EB] text-[#374151] hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {meta && (
          <div className="text-xs text-[#6B7280] font-normal">
            Active total: <span className="font-semibold text-[#111827]">{getCurrencySymbol(meta.currency)}{meta.activeMonthlyTotal} / month</span> · <span className="font-semibold text-[#111827]">{getCurrencySymbol(meta.currency)}{meta.activeAnnualTotal} / year</span>
          </div>
        )}
      </div>

      {/* Subscriptions Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[#6B7280]">
          Loading subscriptions...
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 text-center max-w-md mx-auto space-y-3">
          <h3 className="text-sm font-semibold text-[#111827]">No subscriptions found</h3>
          <p className="text-xs text-[#6B7280]">
            Try adjusting your search or filters, or add a new subscription.
          </p>
          <button
            onClick={() => navigate('/add')}
            className="px-4 py-2 bg-[#18181B] text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors"
          >
            Add subscription
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptions.map((sub) => {
            const isActive = sub.status === 'Active';
            return (
              <div
                key={sub._id}
                onClick={() => navigate(`/subscriptions/${sub._id}`)}
                className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:border-[#CBD5E1] transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                {/* Card Top: Logo, Name, Category, View link */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center font-bold text-xs text-[#374151] uppercase">
                      {sub.serviceName.slice(0, 3)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#111827]">{sub.serviceName}</h4>
                      <p className="text-xs text-[#6B7280]">{sub.category}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[#111827] flex items-center space-x-0.5 hover:underline">
                    <span>View</span>
                    <span>→</span>
                  </span>
                </div>

                {/* Card Middle: Price & Frequency */}
                <div>
                  <div className="text-xl font-bold text-[#111827]">
                    {getCurrencySymbol(sub.currency)}{sub.amount.toFixed(2)} <span className="text-xs font-normal text-[#6B7280]">{sub.currency}</span>
                  </div>
                  <div className="text-xs text-[#6B7280] mt-0.5">
                    {sub.billingFrequency}
                  </div>
                </div>

                {/* Card Bottom: Renewal date / Excluded message + Status tag */}
                <div className="pt-3 border-t border-[#F3F4F6] flex items-center justify-between text-xs">
                  <span className="text-[#6B7280]">
                    {isActive
                      ? `Renews ${new Date(sub.nextRenewalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                      : 'Excluded from active totals'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      sub.status === 'Active'
                        ? 'text-[#111827] bg-[#F3F4F6]'
                        : sub.status === 'Paused'
                        ? 'text-[#92400E] bg-[#FEF3C7]'
                        : sub.status === 'Cancelled'
                        ? 'text-[#991B1B] bg-[#FEE2E2]'
                        : 'text-[#4B5563] bg-[#E5E7EB]'
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer disclaimer matching Screen 02 */}
      <footer className="pt-6 border-t border-[#E5E7EB] space-y-1">
        <p className="text-[11px] text-[#9CA3AF]">
          Monthly equivalents: yearly ÷ 12 · quarterly ÷ 3 · weekly × 52 ÷ 12. Only active records count.
        </p>
        <p className="text-[11px] text-[#9CA3AF]">
          Each currency is totalled separately; no implicit exchange-rate conversion. Demo subscription records.
        </p>
      </footer>
    </div>
  );
};

