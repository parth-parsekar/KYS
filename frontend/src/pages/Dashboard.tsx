import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { getCurrencySymbol } from '../utils/currencyUtils';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [res, eventRes] = await Promise.all([
        api.getAnalytics(),
        api.getEvents().catch(() => ({ success: false, data: [] })),
      ]);
      if (res.success) {
        setAnalytics(res.data);
      }
      if (eventRes && eventRes.success) {
        setEvents(eventRes.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-xs text-[#6B7280]">Loading dashboard analytics...</div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 text-center space-y-3">
          <h3 className="text-lg font-bold text-[#111827]">Could not load dashboard</h3>
          <p className="text-xs text-[#6B7280]">{error || 'Data temporarily unavailable.'}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-[#18181B] text-white text-xs font-semibold rounded-lg hover:bg-black"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { monthlySpending, annualProjection, activeCount, categoriesCount, upcomingRenewals, budget, categoryDistribution, historicalTrends } = analytics;
  const userCurrency = analytics?.currency || user?.preferredCurrency || 'USD';
  const sym = getCurrencySymbol(userCurrency);

  const prevMonthSpend = historicalTrends?.length >= 2 ? historicalTrends[historicalTrends.length - 2].amount : 0;
  const monthDiff = monthlySpending - prevMonthSpend;
  const monthDiffSubtext =
    monthDiff > 0
      ? `+${sym}${monthDiff.toFixed(2)} vs. last month`
      : monthDiff < 0
      ? `-${sym}${Math.abs(monthDiff).toFixed(2)} vs. last month`
      : `${sym}0.00 vs. last month`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">Dashboard</h2>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">A clear view of your recurring spending.</p>
        </div>
        <button
          onClick={() => navigate('/add')}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-[#18181B] text-white text-xs font-medium rounded-lg hover:bg-black transition-colors shadow-xs self-start sm:self-auto"
        >
          + Add subscription
        </button>
      </div>

      {/* 4 Stat Cards: 2-column on mobile, 4-column on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Monthly spending"
          value={`${sym}${monthlySpending.toFixed(2)}`}
          subtext={monthDiffSubtext}
        />
        <StatCard
          label="Annual projection"
          value={`${sym}${annualProjection.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext="Based on current subscriptions"
        />
        <StatCard
          label="Active subscriptions"
          value={activeCount}
          subtext={`Across ${categoriesCount} categories`}
        />
        <StatCard
          label="Upcoming renewals"
          value={upcomingRenewals.count}
          subtext="In the next 7 days"
        />
      </div>

      {/* Live Platform Events & Real-time Announcements */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base">📢</span>
            <h3 className="text-sm font-bold text-[#111827]">Live Events &amp; Real-Time Broadcasts</h3>
            <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live WebSocket Synced
            </span>
          </div>
          {user?.role === 'admin' ? (
            <button
              onClick={() => navigate('/admin')}
              className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Manage events in Admin Console</span>
              <span>→</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/notifications')}
              className="text-xs text-[#6B7280] hover:text-[#111827] font-medium flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View all notifications</span>
              <span>→</span>
            </button>
          )}
        </div>

        {events.length === 0 ? (
          <div className="p-4 bg-[#F9FAFB] rounded-lg text-xs text-[#6B7280] flex items-center justify-between">
            <span>All platform services running normally. No active maintenance or announcements scheduled.</span>
            <span className="text-[11px] text-[#9CA3AF]">Updated just now</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {events.slice(0, 4).map((evt) => (
              <div
                key={evt._id}
                className="p-3.5 bg-[#F9FAFB] hover:bg-gray-100/80 border border-[#E5E7EB] rounded-lg transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        evt.priority === 'high'
                          ? 'bg-red-100 text-red-700'
                          : evt.priority === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {evt.category || 'Platform Event'}
                    </span>
                    <span className="text-[11px] text-[#6B7280] font-medium">
                      {new Date(evt.eventDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#111827] mt-2">{evt.title}</h4>
                  <p className="text-[11px] text-[#4B5563] mt-1 line-clamp-2 leading-relaxed">
                    {evt.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Middle Row: Monthly expenditure chart & Monthly budget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly expenditure Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">Monthly expenditure</h3>
              <p className="text-xs text-[#6B7280] mt-0.5">Live subscription commitments & billing history</p>
            </div>
            <div className="text-xs border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-[#374151] bg-[#F9FAFB]">
              Last 12 months
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historicalTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${sym}${v}`} />
                <Tooltip
                  formatter={(val: any) => [`${sym}${val}`, 'Expenditure']}
                  contentStyle={{ backgroundColor: '#18181B', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                />
                <Bar
                  dataKey="amount"
                  fill="#94A3B8"
                  radius={[4, 4, 0, 0]}
                  // Highlighting latest bar
                  shape={(props: any) => {
                    const { fill, x, y, width, height, index } = props;
                    const isLast = index === historicalTrends.length - 1;
                    return <rect x={x} y={y} width={width} height={height} fill={isLast ? '#18181B' : '#94A3B8'} rx={4} ry={4} />;
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-[#9CA3AF] pt-2">
            {historicalTrends && historicalTrends.length > 0
              ? `${historicalTrends[0].month} ${historicalTrends[0].year} – ${historicalTrends[historicalTrends.length - 1].month} ${historicalTrends[historicalTrends.length - 1].year}`
              : 'Last 12 months'}
          </div>
        </div>

        {/* Monthly budget card (1 col) */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#111827]">Monthly budget</h3>
            <div className="mt-4">
              <span className="text-3xl font-bold text-[#111827]">{sym}{Math.round(budget.current)}</span>
              <span className="text-xs text-[#6B7280] ml-2">of {sym}{budget.limit} budget</span>
            </div>

            {/* Progress bar */}
            <div className="mt-5">
              <div className="w-full bg-[#E5E7EB] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#374151] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, budget.usedPercentage)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs text-[#6B7280] mt-2 font-medium">
                <span>{budget.usedPercentage}% used</span>
                <span>{sym}{budget.remaining} remaining</span>
              </div>
            </div>

            {budget.thresholdCrossed && (
              <div className="mt-6 text-xs text-[#4B5563]">
                {budget.alertThreshold}% budget threshold reached.
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-[#F3F4F6] flex items-center justify-between">
            <button
              onClick={() => navigate('/preferences')}
              className="text-xs font-semibold text-[#111827] hover:underline flex items-center space-x-1"
            >
              <span>Manage budget</span>
              <span>→</span>
            </button>
            <button
              onClick={() => navigate('/analytics')}
              className="text-xs font-semibold text-[#4B5563] hover:text-[#111827] flex items-center space-x-1"
            >
              <span>Past months & pending</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Upcoming renewals table & By Category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming renewals (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#F3F4F6]">
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">Upcoming renewals</h3>
              <p className="text-xs text-[#6B7280] mt-0.5">Next 7 days · {sym}{upcomingRenewals.totalAmount.toFixed(2)} due</p>
            </div>
            <button
              onClick={() => navigate('/subscriptions')}
              className="text-xs font-semibold text-[#111827] hover:underline flex items-center space-x-1"
            >
              <span>View all</span>
              <span>→</span>
            </button>
          </div>

          <div className="divide-y divide-[#F3F4F6] mt-1">
            {upcomingRenewals.subscriptions.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6B7280]">
                No renewals in the next 7 days.
              </div>
            ) : (
              upcomingRenewals.subscriptions.map((sub: any) => (
                <div
                  key={sub.id}
                  onClick={() => navigate(`/subscriptions/${sub.id}`)}
                  className="py-3 flex items-center justify-between hover:bg-[#F9FAFB] px-2 rounded-lg cursor-pointer transition-colors"
                >
                  {/* Mobile layout (< 640px) matching Screen 13 */}
                  <div className="flex sm:hidden items-center justify-between w-full">
                    <div>
                      <span className="text-xs font-semibold text-[#111827] block">{sub.serviceName}</span>
                      <span className="text-[11px] text-[#6B7280]">
                        {sub.category} · {new Date(sub.nextRenewalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-[#111827] text-right">
                      {getCurrencySymbol(sub.currency)}{sub.amount.toFixed(2)}
                    </div>
                  </div>

                  {/* Tablet & Desktop layout (>= 640px) */}
                  <div className="hidden sm:flex items-center justify-between w-full">
                    <div className="w-1/3">
                      <span className="text-xs font-semibold text-[#111827]">{sub.serviceName}</span>
                    </div>
                    <div className="w-1/3 text-xs text-[#6B7280]">{sub.category}</div>
                    <div className="w-1/4 text-xs text-[#6B7280]">
                      {new Date(sub.nextRenewalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-xs font-semibold text-[#111827] text-right">
                      {getCurrencySymbol(sub.currency)}{sub.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* By category (1 col) */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#111827] pb-4 border-b border-[#F3F4F6]">By category</h3>
          <div className="space-y-4 mt-4">
            {categoryDistribution.map((cat: any) => {
              const maxSpend = Math.max(...categoryDistribution.map((c: any) => c.amount), 1);
              const widthPct = Math.round((cat.amount / maxSpend) * 100);
              return (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#374151] font-normal">{cat.category}</span>
                    <span className="text-[#111827] font-semibold">{sym}{Math.round(cat.amount)}</span>
                  </div>
                  <div className="w-full bg-[#F3F4F6] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#4B5563] h-1.5 rounded-full"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer disclaimer matching Screen 01 */}
      <footer className="pt-4 border-t border-[#E5E7EB] text-center md:text-left">
        <p className="text-[11px] text-[#9CA3AF]">
          Active subscriptions only · All values unified in {userCurrency} · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </footer>
    </div>
  );
};

