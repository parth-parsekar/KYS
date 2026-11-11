import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../api/client';
import { StatCard } from '../components/StatCard';
import { getCurrencySymbol } from '../utils/currencyUtils';

const DONUT_COLORS = ['#334155', '#64748B', '#94A3B8', '#CBD5E1', '#E2E8F0'];

export const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('USD');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const [itemStatusFilter, setItemStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalytics();
      if (res.success) {
        setData(res.data);
        if (res.data.currency) setCurrency(res.data.currency);
        if (res.data.monthlyBreakdowns && res.data.monthlyBreakdowns.length > 0) {
          setSelectedMonthIndex(res.data.monthlyBreakdowns.length - 1);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-xs text-[#6B7280]">
        Loading analytics visualizations...
      </div>
    );
  }

  const {
    monthlySpending,
    annualProjection,
    upcomingRenewals,
    budget,
    categoryDistribution,
    historicalTrends,
  } = data;
  const sym = getCurrencySymbol(currency);

  const pieData = categoryDistribution.map((item: any) => ({
    name: item.category,
    value: item.amount,
    percentage: item.percentage,
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header with Date Range & Currency */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">Analytics</h2>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">Understand where your money goes.</p>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 self-start sm:self-auto">
          <div className="text-xs bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#374151]">
            Dec 2025 – Nov 2026
          </div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="text-xs bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#374151] focus:outline-none"
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

      {/* 4 Stat Cards: 2-col on mobile, 4-col on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Active monthly total"
          value={`${sym}${monthlySpending.toFixed(2)}`}
          subtext="Monthly equivalents"
        />
        <StatCard
          label="Annualized total"
          value={`${sym}${annualProjection.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext="Current active subscriptions"
        />
        <StatCard
          label="Upcoming expenditure"
          value={`${sym}${upcomingRenewals.totalAmount.toFixed(2)}`}
          subtext={`${upcomingRenewals.count} renewals in the next 7 days`}
        />
        <StatCard
          label="Budget remaining"
          value={`${sym}${budget.remaining.toFixed(2)}`}
          subtext={`${budget.usedPercentage}% of ${sym}${budget.limit} used`}
        />
      </div>

      {/* Main Grid: Left Column (Charts) & Right Column (Distribution & Budget) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Spending trends · 12 months (Line Chart) */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#111827]">Spending trends · 12 months</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">Synthetic demo billing events · Not verified payments</p>

            <div className="h-60 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${sym}${v}`} />
                  <Tooltip
                    formatter={(val: any) => [`${sym}${val}`, 'Monthly trend']}
                    contentStyle={{ backgroundColor: '#18181B', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#1E232A"
                    strokeWidth={2}
                    dot={{ fill: '#1E232A', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-[#9CA3AF] pt-2">
              {(() => {
                const prev = historicalTrends?.length >= 2 ? historicalTrends[historicalTrends.length - 2].amount : 0;
                const prevName = historicalTrends?.length >= 2 ? historicalTrends[historicalTrends.length - 2].month : 'previous month';
                const diff = monthlySpending - prev;
                if (prev === 0 && monthlySpending === 0) return 'No spending recorded in previous months.';
                if (prev === 0) return `Change: +${sym}${diff.toFixed(2)} vs. ${prevName}`;
                const pct = ((diff / prev) * 100).toFixed(1);
                return diff >= 0
                  ? `Change: +${sym}${diff.toFixed(2)} (+${pct}%) vs. ${prevName}`
                  : `Change: -${sym}${Math.abs(diff).toFixed(2)} (${pct}%) vs. ${prevName}`;
              })()}
            </p>
          </div>

          {/* Monthly expenditure (Bar Chart) - Interactive */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[#111827]">Monthly expenditure</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">Click any month bar to inspect its paid vs. pending subscriptions</p>
              </div>
              <span className="text-[11px] font-medium text-[#4B5563] bg-[#F3F4F6] px-2.5 py-1 rounded-md self-start sm:self-auto">
                Interactive historical explorer
              </span>
            </div>

            <div className="h-60 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={historicalTrends}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  onClick={(state: any) => {
                    if (state && typeof state.activeTooltipIndex === 'number') {
                      setSelectedMonthIndex(state.activeTooltipIndex);
                    }
                  }}
                  className="cursor-pointer"
                >
                  <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${sym}${v}`} />
                  <Tooltip
                    formatter={(val: any) => [`${sym}${val}`, 'Expenditure']}
                    contentStyle={{ backgroundColor: '#18181B', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                  <Bar
                    dataKey="amount"
                    shape={(props: any) => {
                      const { x, y, width, height, index } = props;
                      const isSelected = selectedMonthIndex === index;
                      const isLast = index === historicalTrends.length - 1;
                      return (
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          fill={isSelected ? '#18181B' : isLast ? '#374151' : '#94A3B8'}
                          stroke={isSelected ? '#000000' : 'none'}
                          strokeWidth={isSelected ? 2 : 0}
                          rx={3}
                          ry={3}
                        />
                      );
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Horizontal interactive month selector tabs */}
            <div className="pt-4 border-t border-[#F3F4F6] mt-3">
              <p className="text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider mb-2">Select past month to inspect:</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
                {data.monthlyBreakdowns?.map((mb: any, idx: number) => {
                  const isSelected = selectedMonthIndex === idx;
                  return (
                    <button
                      key={mb.label}
                      type="button"
                      onClick={() => setSelectedMonthIndex(idx)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-md whitespace-nowrap transition-all border ${
                        isSelected
                          ? 'bg-[#18181B] text-white border-[#18181B] shadow-sm'
                          : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-gray-50'
                      }`}
                    >
                      {mb.month} {mb.year.toString().slice(-2)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Historical Month Detail Card */}
          {selectedMonthIndex !== null && data.monthlyBreakdowns && data.monthlyBreakdowns[selectedMonthIndex] && (() => {
            const currentMonthData = data.monthlyBreakdowns[selectedMonthIndex];
            const filteredItems = currentMonthData.items?.filter((item: any) => {
              if (itemStatusFilter === 'paid') return item.status === 'Paid';
              if (itemStatusFilter === 'pending') return item.status === 'Pending' || item.status === 'Scheduled';
              return true;
            }) || [];

            return (
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3F4F6] pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-[#111827]">
                        {currentMonthData.label} Detailed Breakdown
                      </h3>
                      <span className="text-[11px] bg-gray-100 text-[#374151] px-2 py-0.5 rounded font-medium">
                        {currentMonthData.items?.length || 0} subscriptions
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Review paid cycles and pending/upcoming subscriptions for this period
                    </p>
                  </div>

                  {/* Filter tabs: All, Paid, Pending */}
                  <div className="flex items-center space-x-1.5 bg-[#F9FAFB] p-1 rounded-lg border border-[#E5E7EB] self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setItemStatusFilter('all')}
                      className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium ${
                        itemStatusFilter === 'all'
                          ? 'bg-white text-[#111827] shadow-xs'
                          : 'text-[#6B7280] hover:text-[#111827]'
                      }`}
                    >
                      All ({currentMonthData.items?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemStatusFilter('paid')}
                      className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium ${
                        itemStatusFilter === 'paid'
                          ? 'bg-emerald-50 text-emerald-800 shadow-xs'
                          : 'text-[#6B7280] hover:text-[#111827]'
                      }`}
                    >
                      Paid ({currentMonthData.paidCount || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemStatusFilter('pending')}
                      className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium ${
                        itemStatusFilter === 'pending'
                          ? 'bg-amber-50 text-amber-800 shadow-xs'
                          : 'text-[#6B7280] hover:text-[#111827]'
                      }`}
                    >
                      Pending ({currentMonthData.pendingCount || 0})
                    </button>
                  </div>
                </div>

                {/* 3 Summary Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
                    <span className="text-[11px] font-medium text-[#6B7280]">Total Paid in {currentMonthData.month}</span>
                    <p className="text-lg font-bold text-emerald-700 mt-0.5">
                      {sym}{currentMonthData.totalPaid.toFixed(2)}
                    </p>
                    <span className="text-[10px] text-[#9CA3AF]">{currentMonthData.paidCount} fulfilled payments</span>
                  </div>

                  <div className="p-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
                    <span className="text-[11px] font-medium text-[#6B7280]">Pending / Due</span>
                    <p className="text-lg font-bold text-amber-700 mt-0.5">
                      {sym}{currentMonthData.totalPending.toFixed(2)}
                    </p>
                    <span className="text-[10px] text-[#9CA3AF]">{currentMonthData.pendingCount} pending or scheduled</span>
                  </div>

                  <div className="p-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
                    <span className="text-[11px] font-medium text-[#6B7280]">Total Monthly Commitment</span>
                    <p className="text-lg font-bold text-[#111827] mt-0.5">
                      {sym}{currentMonthData.totalSpent.toFixed(2)}
                    </p>
                    <span className="text-[10px] text-[#9CA3AF]">Paid + Pending equivalents</span>
                  </div>
                </div>

                {/* Subscription items table for this month */}
                <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                  <table className="w-full text-left text-xs min-w-[520px]">
                    <thead>
                      <tr className="border-b border-[#F3F4F6] text-[#6B7280]">
                        <th className="py-2.5 font-medium">Service</th>
                        <th className="py-2.5 font-medium">Category</th>
                        <th className="py-2.5 font-medium">Billing cycle</th>
                        <th className="py-2.5 font-medium">Billing date</th>
                        <th className="py-2.5 font-medium">Status</th>
                        <th className="py-2.5 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6]">
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-xs text-[#9CA3AF]">
                            No {itemStatusFilter === 'all' ? '' : itemStatusFilter} subscription items recorded for {currentMonthData.label}.
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map((item: any, idx: number) => {
                          const isPaid = item.status === 'Paid';
                          const isPending = item.status === 'Pending';
                          return (
                            <tr key={`${item.id}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                              <td className="py-3 font-semibold text-[#111827]">
                                {item.serviceName}
                              </td>
                              <td className="py-3 text-[#4B5563]">{item.category}</td>
                              <td className="py-3 text-[#6B7280]">{item.billingFrequency}</td>
                              <td className="py-3 text-[#6B7280]">
                                {new Date(item.billingDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </td>
                              <td className="py-3">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    isPaid
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : isPending
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                              <td className="py-3 text-right font-semibold text-[#111827]">
                                {sym}{item.convertedAmount ? item.convertedAmount.toFixed(2) : item.amount.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right Column (1 col) */}
        <div className="space-y-6">
          {/* Category distribution (Donut Chart) */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#111827]">Category distribution</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">Active monthly equivalents · {currency}</p>

            <div className="h-52 w-full relative flex items-center justify-center my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`${sym}${val}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center pointer-events-none">
                <div className="text-lg font-bold text-[#111827]">{sym}{Math.round(monthlySpending)}</div>
                <div className="text-[10px] text-[#6B7280]">/ month</div>
              </div>
            </div>

            {/* Custom Legend matching wireframe 04 */}
            <div className="space-y-2.5 pt-2">
              {categoryDistribution.map((item: any, idx: number) => (
                <div key={item.category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-sm inline-block"
                      style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                    />
                    <span className="text-[#374151] font-medium">{item.category}</span>
                  </div>
                  <div className="text-[#6B7280]">
                    {sym}{Math.round(item.amount)} · {item.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget tracking card */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">Budget tracking</h3>
              <div className="text-2xl font-bold text-[#111827] mt-3">
                {sym}{Math.round(budget.current)} of {sym}{budget.limit}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="w-full bg-[#E5E7EB] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#374151] h-2 rounded-full"
                  style={{ width: `${Math.min(100, budget.usedPercentage)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs text-[#6B7280]">
                <span>{budget.usedPercentage}% used</span>
                <span>{sym}{budget.remaining} remaining</span>
              </div>
            </div>

            <div className="text-xs text-[#4B5563] pt-1">
              <p className="font-semibold text-[#111827]">{budget.alertThreshold}% threshold reached</p>
              <p className="text-[#6B7280] mt-0.5">Your alert threshold is configurable.</p>
            </div>

            <button
              onClick={() => navigate('/preferences')}
              className="w-full py-2.5 px-4 text-xs font-semibold text-[#111827] bg-white border border-[#D1D5DB] rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit budget & threshold
            </button>
          </div>
        </div>
      </div>

      {/* Footer disclaimer */}
      <footer className="pt-4 border-t border-[#E5E7EB] text-center md:text-left">
        <p className="text-[11px] text-[#9CA3AF]">
          Active-only totals · Each currency is reported separately · No bank connection or verified payment data.
        </p>
      </footer>
    </div>
  );
};

