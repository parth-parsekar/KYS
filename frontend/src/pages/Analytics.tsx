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

const DONUT_COLORS = ['#334155', '#64748B', '#94A3B8', '#CBD5E1', '#E2E8F0'];

export const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('USD');

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

  const pieData = categoryDistribution.map((item: any) => ({
    name: item.category,
    value: item.amount,
    percentage: item.percentage,
  }));

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header with Date Range & Currency */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#111827]">Analytics</h2>
          <p className="text-xs md:text-sm text-[#6B7280] mt-1">Understand where your money goes.</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-xs bg-white border border-[#E5E7EB] rounded-lg px-3.5 py-2 text-[#374151]">
            Dec 2025 – Nov 2026
          </div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="text-xs bg-white border border-[#E5E7EB] rounded-lg px-3.5 py-2 text-[#374151] focus:outline-none"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active monthly total"
          value={`$${monthlySpending.toFixed(2)}`}
          subtext="Monthly equivalents"
        />
        <StatCard
          label="Annualized total"
          value={`$${annualProjection.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext="Current active subscriptions"
        />
        <StatCard
          label="Upcoming expenditure"
          value={`$${upcomingRenewals.totalAmount.toFixed(2)}`}
          subtext={`${upcomingRenewals.count} renewals in the next 7 days`}
        />
        <StatCard
          label="Budget remaining"
          value={`$${budget.remaining.toFixed(2)}`}
          subtext={`${budget.usedPercentage}% of $${budget.limit} used`}
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
                  <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(val: any) => [`$${val}`, 'Monthly trend']}
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
                if (prev === 0) return `Change: +$${diff.toFixed(2)} vs. ${prevName}`;
                const pct = ((diff / prev) * 100).toFixed(1);
                return diff >= 0
                  ? `Change: +$${diff.toFixed(2)} (+${pct}%) vs. ${prevName}`
                  : `Change: -$${Math.abs(diff).toFixed(2)} (${pct}%) vs. ${prevName}`;
              })()}
            </p>
          </div>

          {/* Monthly expenditure (Bar Chart) */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#111827]">Monthly expenditure</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">Synthetic demo billing events · USD · Dec 2025 – Nov 2026</p>

            <div className="h-60 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historicalTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(val: any) => [`$${val}`, 'Expenditure']}
                    contentStyle={{ backgroundColor: '#18181B', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                  <Bar
                    dataKey="amount"
                    fill="#94A3B8"
                    shape={(props: any) => {
                      const { x, y, width, height, index } = props;
                      const isLast = index === historicalTrends.length - 1;
                      return <rect x={x} y={y} width={width} height={height} fill={isLast ? '#18181B' : '#94A3B8'} rx={3} ry={3} />;
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-[#9CA3AF] pt-2">
              Demo totals are illustrative, not actual payment history.
            </p>
          </div>
        </div>

        {/* Right Column (1 col) */}
        <div className="space-y-6">
          {/* Category distribution (Donut Chart) */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#111827]">Category distribution</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">Active monthly equivalents · USD</p>

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
                  <Tooltip formatter={(val: any) => [`$${val}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center pointer-events-none">
                <div className="text-lg font-bold text-[#111827]">${Math.round(monthlySpending)}</div>
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
                    ${Math.round(item.amount)} · {item.percentage}%
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
                ${Math.round(budget.current)} of ${budget.limit}
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
                <span>${budget.remaining} remaining</span>
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

