import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { AdminWaitlistSection } from '../components/AdminWaitlistSection';
import { AdminEventsSection } from '../components/AdminEventsSection';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [timeframe, setTimeframe] = useState('30d');
  const [selectedAdminMonth, setSelectedAdminMonth] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Waitlist state for stat card
  const [waitlist, setWaitlist] = useState<any[]>([]);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/empty-states?reason=admin-required');
      return;
    }
    loadAdminDashboard('30d');
    loadWaitlist();
  }, [user]);

  const loadAdminDashboard = async (tf: string = timeframe) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getAdminDashboard({ timeframe: tf });
      if (res.success) {
        setAdminData(res.data);
        if (res.data.trend && res.data.trend.length > 0) {
          setSelectedAdminMonth(res.data.trend[res.data.trend.length - 1].month);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Access denied or error loading admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadWaitlist = async () => {
    try {
      const res = await api.getAdminWaitlist();
      if (res.success) {
        setWaitlist(res.waitlist || []);
      }
    } catch (e) {
      console.warn('Could not load waitlist:', e);
    }
  };

  const handleTimeframeChange = (newTf: string) => {
    setTimeframe(newTf);
    loadAdminDashboard(newTf);
  };

  const handleExport = async () => {
    try {
      const apiTarget = import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api/admin/export`
        : '/api/admin/export';
      const res = await fetch(apiTarget, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('kys_token')}`,
        },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kys-platform-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-[#6B7280]">
        Loading admin metrics...
      </div>
    );
  }

  if (error || !adminData) {
    const isActuallyAdmin = user?.role === 'admin';
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4">
        <h3 className="text-base font-bold text-[#111827]">
          {isActuallyAdmin ? 'Unable to load admin metrics' : 'Admin access required'}
        </h3>
        <p className="text-xs text-[#6B7280]">
          {error || (isActuallyAdmin ? 'Connecting to live platform services...' : 'Your account does not have administrator privileges.')}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          {isActuallyAdmin && (
            <button
              onClick={() => {
                loadAdminDashboard(timeframe);
                loadWaitlist();
              }}
              className="px-4 py-2 bg-[#18181B] text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors"
            >
              Try again
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-white text-[#111827] border border-[#D1D5DB] text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const { totalUsers, activeSubscriptions, newUsers, subsPerUser, trend, categoryDistribution, platformSummary } = adminData;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header matching Screen 06 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">Admin dashboard</h2>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
            Administrator: <span className="font-semibold text-[#111827]">{user?.name || adminData.adminUser?.name || 'Parth Parsekar'}</span> ({user?.email || adminData.adminUser?.email || 'admin@kys.app'}) · Real-time platform metrics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Interactive Timeframe selector */}
          <div className="flex items-center bg-[#F3F4F6] p-1 rounded-lg border border-[#E5E7EB] overflow-x-auto">
            {[
              { id: '30d', label: '30 days' },
              { id: '90d', label: '90 days' },
              { id: '6m', label: '6 months' },
              { id: '12m', label: '12 months' },
              { id: 'all', label: 'All time' },
            ].map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => handleTimeframeChange(tf.id)}
                className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium ${
                  timeframe === tf.id
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            className="text-xs font-semibold text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3.5 py-2 hover:bg-gray-50 transition-colors shadow-xs"
          >
            Export data
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total users"
          value={totalUsers.toLocaleString()}
          subtext={`+${newUsers} in the selected period`}
        />
        <StatCard
          label="Waitlist requests"
          value={waitlist.length}
          subtext={waitlist.length > 0 ? `${waitlist.length} awaiting your review` : 'All users approved'}
        />
        <StatCard
          label="Active subscriptions"
          value={activeSubscriptions.toLocaleString()}
          subtext={`Across ${categoryDistribution.length} categories`}
        />
        <StatCard
          label="Subscriptions per user"
          value={subsPerUser}
          subtext="Platform-wide average"
        />
      </div>

      {/* New User Waitlist & Access Approvals Section */}
      <AdminWaitlistSection onRefreshStats={() => loadAdminDashboard(timeframe)} />

      {/* Live Events & Real-time Announcements */}
      <AdminEventsSection />

      {/* Middle Row: Active Subscriptions 6/12-month chart & Platform Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">Active subscriptions</h3>
              <p className="text-xs text-[#6B7280] mt-0.5">Click any month bar to inspect platform volume</p>
            </div>
            {selectedAdminMonth && (
              <span className="text-xs font-medium text-[#111827] bg-[#F3F4F6] px-2.5 py-1 rounded-md">
                Selected: {selectedAdminMonth}
              </span>
            )}
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trend}
                onClick={(state: any) => {
                  if (state && state.activePayload && state.activePayload[0]) {
                    setSelectedAdminMonth(state.activePayload[0].payload.month);
                  }
                }}
              >
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: '#F3F4F6' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#18181B] text-white text-xs rounded-lg p-2.5 shadow-lg space-y-1">
                          <p className="font-semibold">{data.label}</p>
                          <p className="text-gray-300">Active subscriptions: {data.count}</p>
                          <p className="text-gray-300">Paid volume: ${data.volume.toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#18181B"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right (1 col): Platform Summary & Selected Month drilldown */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#111827]">Platform summary</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">Key operational indicators</p>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#F3F4F6]">
              <span className="text-[#6B7280]">Users with subscriptions</span>
              <span className="font-semibold text-[#111827]">{platformSummary.usersWithSubscriptions}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-[#F3F4F6]">
              <span className="text-[#6B7280]">Users without subscriptions</span>
              <span className="font-semibold text-[#111827]">{platformSummary.usersWithoutSubscriptions}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-[#F3F4F6]">
              <span className="text-[#6B7280]">Most-tracked service</span>
              <span className="font-semibold text-[#111827]">{platformSummary.mostTrackedService}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B7280]">Reporting currency</span>
              <span className="font-semibold text-[#111827]">{platformSummary.reportingCurrency}</span>
            </div>
          </div>

          <div className="bg-[#F8F9FA] rounded-lg p-3 text-xs space-y-1">
            <p className="font-semibold text-[#111827]">
              {selectedAdminMonth ? `Month drilldown: ${selectedAdminMonth}` : 'Platform Health'}
            </p>
            <p className="text-[11px] text-[#6B7280]">
              {selectedAdminMonth && adminData.monthlyDrilldown?.[selectedAdminMonth]
                ? `${adminData.monthlyDrilldown[selectedAdminMonth].activeSubscriptions} active subs · $${adminData.monthlyDrilldown[selectedAdminMonth].paidVolume} billing volume`
                : '100% database connectivity across all cluster nodes.'}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Table: Subscription distribution by category */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
        <h3 className="text-sm font-semibold text-[#111827]">Subscription distribution by category</h3>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Aggregate platform data only · No access to personal spending details
        </p>

        <div className="mt-4 overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <table className="w-full text-left text-xs min-w-[480px]">
            <thead>
              <tr className="border-b border-[#F3F4F6] text-[#6B7280]">
                <th className="py-3 font-medium">Category</th>
                <th className="py-3 font-medium">Active subscriptions</th>
                <th className="py-3 font-medium">Share of total</th>
                <th className="py-3 font-medium w-1/3">Distribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {categoryDistribution.map((item: any) => (
                <tr key={item.category}>
                  <td className="py-3.5 font-semibold text-[#111827]">{item.category}</td>
                  <td className="py-3.5 text-[#374151]">{item.activeCount.toLocaleString()}</td>
                  <td className="py-3.5 text-[#374151]">{item.sharePercentage}%</td>
                  <td className="py-3.5">
                    <div className="w-full bg-[#F3F4F6] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#4B5563] h-2 rounded-full"
                        style={{ width: `${item.sharePercentage}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer disclaimer */}
      <footer className="pt-4 border-t border-[#E5E7EB] text-center md:text-left">
        <p className="text-[11px] text-[#9CA3AF]">
          Admin-only · Example platform data · No user-private subscription or spending records exposed.
        </p>
      </footer>
    </div>
  );
};
