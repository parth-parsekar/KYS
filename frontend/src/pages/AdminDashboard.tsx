import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/empty-states?reason=admin-required');
      return;
    }
    loadAdminDashboard();
  }, [user]);

  const loadAdminDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminDashboard();
      if (res.success) {
        setAdminData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Access denied or error loading admin dashboard');
    } finally {
      setLoading(false);
    }
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
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4">
        <h3 className="text-base font-bold text-[#111827]">Admin access required</h3>
        <p className="text-xs text-[#6B7280]">{error || 'Your account does not have the Admin role.'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-[#18181B] text-white text-xs font-semibold rounded-lg"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  const { totalUsers, activeSubscriptions, newUsers, subsPerUser, trend, categoryDistribution, platformSummary } = adminData;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header matching Screen 06 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#111827]">Admin dashboard</h2>
          <p className="text-xs md:text-sm text-[#6B7280] mt-1">
            Administrator: <span className="font-semibold text-[#111827]">{user?.name || adminData.adminUser?.name || 'Parth Parsekar'}</span> ({user?.email || adminData.adminUser?.email || 'admin@kys.app'}) · Real-time platform metrics
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-xs bg-white border border-[#E5E7EB] rounded-lg px-3.5 py-2 text-[#374151]">
            Last 30 days
          </div>
          <button
            onClick={handleExport}
            className="text-xs font-semibold text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3.5 py-2 hover:bg-gray-50 transition-colors"
          >
            Export data
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total users"
          value={totalUsers.toLocaleString()}
          subtext={`+${newUsers} in the last 30 days`}
        />
        <StatCard
          label="Active subscriptions"
          value={activeSubscriptions.toLocaleString()}
          subtext={`Across ${categoryDistribution.length} categories`}
        />
        <StatCard
          label="New users"
          value={newUsers}
          subtext="Joined in the last 30 days"
        />
        <StatCard
          label="Subscriptions per user"
          value={subsPerUser}
          subtext="Average across all users"
        />
      </div>

      {/* Middle Row: Active Subscriptions 6-month chart & Platform Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#111827]">Active subscriptions</h3>
          <p className="text-xs text-[#6B7280] mt-0.5">Platform-wide totals · Last 6 months</p>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(val: any) => [val, 'Active Subscriptions']}
                  contentStyle={{ backgroundColor: '#18181B', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                />
                <Bar
                  dataKey="count"
                  fill="#94A3B8"
                  shape={(props: any) => {
                    const { x, y, width, height, index } = props;
                    const isLast = index === trend.length - 1;
                    return <rect x={x} y={y} width={width} height={height} fill={isLast ? '#18181B' : '#94A3B8'} rx={3} ry={3} />;
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right (1 col): Platform summary */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#111827]">Platform summary</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">User and subscription activity</p>

            <div className="divide-y divide-[#F3F4F6] text-xs mt-4">
              <div className="py-3 flex justify-between">
                <span className="text-[#6B7280]">Users with subscriptions</span>
                <span className="font-semibold text-[#111827]">{platformSummary.usersWithSubscriptions.toLocaleString()}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#6B7280]">Users without subscriptions</span>
                <span className="font-semibold text-[#111827]">{platformSummary.usersWithoutSubscriptions}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#6B7280]">Most tracked service</span>
                <span className="font-semibold text-[#111827]">{platformSummary.mostTrackedService}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#6B7280]">Reporting currency</span>
                <span className="font-semibold text-[#111827]">{platformSummary.reportingCurrency}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Table: Subscription distribution by category */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
        <h3 className="text-sm font-semibold text-[#111827]">Subscription distribution by category</h3>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Aggregate platform data only · No access to personal spending details
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
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

