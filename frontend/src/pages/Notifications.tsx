import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected, markAsRead, markAllAsRead, refreshNotifications } = useSocket();

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [data, setData] = useState<any>({ today: [], earlier: [], all: [], unreadCount: 0, totalCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications({ status: filter });
      if (res.success) {
        setData(res);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkOne = async (id: string) => {
    await markAsRead(id);
    loadNotifications();
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
    loadNotifications();
  };

  const unreadCount = data.unreadCount || 0;
  const readCount = Math.max(0, (data.totalCount || 0) - unreadCount);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#111827]">Notifications</h2>
          <p className="text-xs md:text-sm text-[#6B7280] mt-1">Stay ahead of your next renewal.</p>
        </div>

        <button
          onClick={handleMarkAll}
          className="px-4 py-2 text-xs font-semibold text-[#111827] bg-white border border-[#D1D5DB] rounded-lg hover:bg-gray-50 transition-colors self-start sm:self-auto"
        >
          Mark all as read
        </button>
      </div>

      {/* Main Grid: Left List & Right Info Panels matching Screen 05 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filter tabs */}
          <div className="flex items-center space-x-2">
            {[
              { id: 'all', label: `All (${data.totalCount || 0})` },
              { id: 'unread', label: `Unread (${unreadCount})` },
              { id: 'read', label: `Read (${readCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === tab.id
                    ? 'bg-[#18181B] text-white shadow-sm'
                    : 'bg-white border border-[#E5E7EB] text-[#374151] hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-[#6B7280]">
              Loading notifications...
            </div>
          ) : data.all.length === 0 ? (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 text-center space-y-2">
              <h4 className="text-sm font-semibold text-[#111827]">No notifications</h4>
              <p className="text-xs text-[#6B7280]">You are all caught up!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* TODAY section */}
              {data.today.length > 0 && (
                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                    TODAY · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>

                  <div className="space-y-2.5">
                    {data.today.map((notif: any) => (
                      <div
                        key={notif._id}
                        className={`bg-white border border-[#E5E7EB] rounded-xl p-4 transition-all flex flex-col justify-between space-y-3 ${
                          !notif.isRead ? 'ring-1 ring-[#18181B]/10' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2.5">
                            {!notif.isRead && (
                              <span className="w-2 h-2 rounded-full bg-[#18181B] mt-1.5 shrink-0" />
                            )}
                            <div>
                              <h4 className="text-xs font-bold text-[#111827]">{notif.title}</h4>
                              <p className="text-xs text-[#6B7280] mt-0.5">{notif.message}</p>
                            </div>
                          </div>
                          <div className="text-[11px] text-[#9CA3AF]">
                            {new Date(notif.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-[#F3F4F6] text-xs">
                          {notif.subscription ? (
                            <button
                              onClick={() => navigate(`/subscriptions/${notif.subscription}`)}
                              className="font-medium text-[#111827] hover:underline flex items-center space-x-1"
                            >
                              <span>View subscription</span>
                              <span>→</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate('/preferences')}
                              className="font-medium text-[#111827] hover:underline flex items-center space-x-1"
                            >
                              <span>Manage budget</span>
                              <span>→</span>
                            </button>
                          )}

                          {!notif.isRead ? (
                            <button
                              onClick={() => handleMarkOne(notif._id)}
                              className="text-xs text-[#4B5563] hover:text-[#111827] font-medium"
                            >
                              Mark as read
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#9CA3AF]">Read</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EARLIER section */}
              {data.earlier.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                    EARLIER · SAVED HISTORY
                  </div>

                  <div className="space-y-2.5">
                    {data.earlier.map((notif: any) => (
                      <div
                        key={notif._id}
                        className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2.5">
                            {!notif.isRead && (
                              <span className="w-2 h-2 rounded-full bg-[#18181B] mt-1.5 shrink-0" />
                            )}
                            <div>
                              <h4 className="text-xs font-bold text-[#111827]">{notif.title}</h4>
                              <p className="text-xs text-[#6B7280] mt-0.5">{notif.message}</p>
                            </div>
                          </div>
                          <div className="text-[11px] text-[#9CA3AF]">
                            {new Date(notif.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-[#F3F4F6] text-xs">
                          {notif.subscription ? (
                            <button
                              onClick={() => navigate(`/subscriptions/${notif.subscription}`)}
                              className="font-medium text-[#111827] hover:underline flex items-center space-x-1"
                            >
                              <span>View subscription</span>
                              <span>→</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate('/preferences')}
                              className="font-medium text-[#111827] hover:underline flex items-center space-x-1"
                            >
                              <span>Manage budget</span>
                              <span>→</span>
                            </button>
                          )}

                          {!notif.isRead ? (
                            <button
                              onClick={() => handleMarkOne(notif._id)}
                              className="text-xs text-[#4B5563] hover:text-[#111827] font-medium"
                            >
                              Mark as read
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#9CA3AF]">Read</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (1 col): Info Cards */}
        <div className="space-y-5">
          {/* Card 1: Renewal reminders settings info */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-3.5">
            <h3 className="text-sm font-bold text-[#111827]">Renewal reminders</h3>
            <div>
              <p className="text-xs font-semibold text-[#111827]">Within 3 days of renewal</p>
              <p className="text-xs text-[#6B7280] mt-0.5">Reminders use your saved time zone.</p>
              <p className="text-xs font-medium text-[#111827] mt-1">{user?.timezone || 'America / Los Angeles'}</p>
            </div>

            <div className="space-y-1.5 text-xs text-[#6B7280] pt-1 border-t border-[#F3F4F6]">
              <p>Only active subscriptions are included.</p>
              <p>One alert per subscription renewal cycle.</p>
              <p>Read and unread alerts stay in your history.</p>
            </div>

            <button
              onClick={() => navigate('/preferences')}
              className="w-full mt-2 py-2 px-3 text-xs font-semibold text-[#111827] bg-white border border-[#D1D5DB] rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit preferences
            </button>
          </div>

          {/* Card 2: Connected · Alerts are up to date */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-2">
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <h4 className="text-xs font-bold text-[#111827]">
                {isConnected ? 'Connected · Alerts are up to date' : 'Reconnecting to alerts...'}
              </h4>
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              New alerts appear while you're online. Missed alerts remain available when you reconnect. Your history is saved.
            </p>
          </div>

          {/* Card 3: Tracking, not payment processing */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-2">
            <h4 className="text-xs font-bold text-[#111827]">Tracking, not payment processing</h4>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Renewal dates are based on your records. KYS does not verify or process payments.
            </p>
            <p className="text-xs font-medium text-[#111827] pt-1">
              Cancel with your provider directly.
            </p>
          </div>
        </div>
      </div>

      {/* Footer disclaimer */}
      <footer className="pt-4 border-t border-[#E5E7EB] text-center md:text-left">
        <p className="text-[11px] text-[#9CA3AF]">
          Demo notifications · Saved renewal-cycle alerts and budget alerts · All times in {user?.timezone || 'America/Los_Angeles'}.
        </p>
      </footer>
    </div>
  );
};

