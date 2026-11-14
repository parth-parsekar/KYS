import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Calendar, Edit2, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { AdminEventsSection } from '../components/AdminEventsSection';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [timeframe, setTimeframe] = useState('30d');
  const [selectedAdminMonth, setSelectedAdminMonth] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Waitlist state
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [allUsersList, setAllUsersList] = useState<any[]>([]);
  const [waitlistTab, setWaitlistTab] = useState<'pending' | 'all'>('pending');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Events state
  const [events, setEvents] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    eventDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    category: 'Platform Update',
    priority: 'medium',
  });

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/empty-states?reason=admin-required');
      return;
    }
    loadAdminDashboard('30d');
    loadWaitlist();
    loadEvents();
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
        setAllUsersList(res.recentUsers || []);
      }
    } catch (e) {
      console.warn('Could not load waitlist:', e);
    }
  };

  const loadEvents = async () => {
    try {
      const res = await api.getEvents();
      if (res.success) {
        setEvents(res.data || []);
      }
    } catch (e) {
      console.warn('Could not load events:', e);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createEvent(eventForm);
      if (res.success) {
        setActionFeedback(`Created event "${eventForm.title}" and broadcast real-time notification!`);
        setIsCreateModalOpen(false);
        setEventForm({
          title: '',
          description: '',
          eventDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
          category: 'Platform Update',
          priority: 'medium',
        });
        await loadEvents();
        setTimeout(() => setActionFeedback(null), 5000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create event');
    }
  };

  const openEditModal = (evt: any) => {
    setEditingEvent(evt);
    setEventForm({
      title: evt.title,
      description: evt.description,
      eventDate: new Date(evt.eventDate).toISOString().split('T')[0],
      category: evt.category || 'Platform Update',
      priority: evt.priority || 'medium',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    try {
      const res = await api.updateEvent(editingEvent._id, eventForm);
      if (res.success) {
        setActionFeedback(`Updated event "${eventForm.title}" and broadcast update to all users!`);
        setIsEditModalOpen(false);
        setEditingEvent(null);
        await loadEvents();
        setTimeout(() => setActionFeedback(null), 5000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update event');
    }
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete and cancel "${title}"? This will send a cancellation notification to all users.`)) return;
    try {
      const res = await api.deleteEvent(id);
      if (res.success) {
        setActionFeedback(`Deleted event "${title}" and broadcast cancellation notification.`);
        await loadEvents();
        setTimeout(() => setActionFeedback(null), 5000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete event');
    }
  };

  const handleApprove = async (userId: string, userName: string) => {
    try {
      setActionLoadingId(userId);
      const res = await api.approveUser(userId);
      if (res.success) {
        setActionFeedback(`Approved ${userName} successfully! User can now sign in.`);
        await loadWaitlist();
        await loadAdminDashboard();
        setTimeout(() => setActionFeedback(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve user');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to reject access for ${userName}?`)) return;
    try {
      setActionLoadingId(userId);
      const res = await api.rejectUser(userId);
      if (res.success) {
        setActionFeedback(`Rejected registration for ${userName}.`);
        await loadWaitlist();
        await loadAdminDashboard();
        setTimeout(() => setActionFeedback(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reject user');
    } finally {
      setActionLoadingId(null);
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

      {/* Live Events & System Broadcasts (CRUD) */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#111827]">Live Events &amp; Real-Time Broadcasts</h3>
              <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                {events.length} active
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Create, update, or cancel platform events. Any modification immediately dispatches a real-time WebSocket notification to all active users.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#18181B] hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>

        {/* Events Table */}
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <table className="w-full text-left text-xs min-w-[620px]">
            <thead>
              <tr className="border-b border-[#F3F4F6] text-[#6B7280]">
                <th className="py-2.5 font-medium">Event Title &amp; Description</th>
                <th className="py-2.5 font-medium">Category</th>
                <th className="py-2.5 font-medium">Scheduled Date</th>
                <th className="py-2.5 font-medium">Priority</th>
                <th className="py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[#9CA3AF]">
                    No events published yet. Click <strong>Create Event</strong> to broadcast an event.
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-[#111827]">{evt.title}</div>
                      <div className="text-[11px] text-[#6B7280] line-clamp-1">{evt.description}</div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">
                        {evt.category}
                      </span>
                    </td>
                    <td className="py-3 text-[#374151]">
                      {new Date(evt.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          evt.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : evt.priority === 'medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {evt.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => openEditModal(evt)}
                          className="p-1.5 hover:bg-gray-100 text-[#374151] hover:text-[#111827] rounded-md transition-colors"
                          title="Edit event"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(evt._id, evt.title)}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-md transition-colors"
                          title="Delete event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-[#E5E7EB] animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold text-[#111827]">Create Platform Event &amp; Broadcast</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled System Maintenance Window"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Description / Details</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the event, downtime duration, or special announcement details..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={eventForm.eventDate}
                    onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Category</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  >
                    <option value="Platform Update">Platform Update</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Special Offer">Special Offer</option>
                    <option value="Community">Community</option>
                    <option value="Billing">Billing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Priority</label>
                  <select
                    value={eventForm.priority}
                    onChange={(e) => setEventForm({ ...eventForm, priority: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F3F4F6]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#4B5563] hover:text-[#111827] rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#18181B] hover:bg-black rounded-lg transition-colors"
                >
                  Publish &amp; Broadcast Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-[#E5E7EB] animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold text-[#111827]">Edit Platform Event</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Description / Details</label>
                <textarea
                  required
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={eventForm.eventDate}
                    onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Category</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  >
                    <option value="Platform Update">Platform Update</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Special Offer">Special Offer</option>
                    <option value="Community">Community</option>
                    <option value="Billing">Billing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Priority</label>
                  <select
                    value={eventForm.priority}
                    onChange={(e) => setEventForm({ ...eventForm, priority: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F3F4F6]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#4B5563] hover:text-[#111827] rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Save &amp; Broadcast Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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

      {/* Live Events & System Broadcasts (CRUD) */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#111827]">Live Events &amp; Real-Time Broadcasts</h3>
              <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                {events.length} active
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Create, update, or cancel platform events. Any modification immediately dispatches a real-time WebSocket notification to all active users.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#18181B] hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>

        {/* Events Table */}
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <table className="w-full text-left text-xs min-w-[620px]">
            <thead>
              <tr className="border-b border-[#F3F4F6] text-[#6B7280]">
                <th className="py-2.5 font-medium">Event Title &amp; Description</th>
                <th className="py-2.5 font-medium">Category</th>
                <th className="py-2.5 font-medium">Scheduled Date</th>
                <th className="py-2.5 font-medium">Priority</th>
                <th className="py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[#9CA3AF]">
                    No events published yet. Click <strong>Create Event</strong> to broadcast an event.
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-[#111827]">{evt.title}</div>
                      <div className="text-[11px] text-[#6B7280] line-clamp-1">{evt.description}</div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">
                        {evt.category}
                      </span>
                    </td>
                    <td className="py-3 text-[#374151]">
                      {new Date(evt.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          evt.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : evt.priority === 'medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {evt.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => openEditModal(evt)}
                          className="p-1.5 hover:bg-gray-100 text-[#374151] hover:text-[#111827] rounded-md transition-colors"
                          title="Edit event"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(evt._id, evt.title)}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-md transition-colors"
                          title="Delete event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-[#E5E7EB] animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold text-[#111827]">Create Platform Event &amp; Broadcast</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled System Maintenance Window"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Description / Details</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the event, downtime duration, or special announcement details..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={eventForm.eventDate}
                    onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Category</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  >
                    <option value="Platform Update">Platform Update</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Special Offer">Special Offer</option>
                    <option value="Community">Community</option>
                    <option value="Billing">Billing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Priority</label>
                  <select
                    value={eventForm.priority}
                    onChange={(e) => setEventForm({ ...eventForm, priority: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F3F4F6]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#4B5563] hover:text-[#111827] rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#18181B] hover:bg-black rounded-lg transition-colors"
                >
                  Publish &amp; Broadcast Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-[#E5E7EB] animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold text-[#111827]">Edit Platform Event</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Description / Details</label>
                <textarea
                  required
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={eventForm.eventDate}
                    onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Category</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  >
                    <option value="Platform Update">Platform Update</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Special Offer">Special Offer</option>
                    <option value="Community">Community</option>
                    <option value="Billing">Billing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Priority</label>
                  <select
                    value={eventForm.priority}
                    onChange={(e) => setEventForm({ ...eventForm, priority: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F3F4F6]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#4B5563] hover:text-[#111827] rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Save &amp; Broadcast Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#111827]">New user waitlist &amp; access approvals</h3>
              {waitlist.length > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {waitlist.length} pending
                </span>
              )}
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Review and moderate incoming registrations before granting login access to the platform.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#F3F4F6] p-1 rounded-lg border border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setWaitlistTab('pending')}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                waitlistTab === 'pending'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Pending ({waitlist.length})
            </button>
            <button
              type="button"
              onClick={() => setWaitlistTab('all')}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                waitlistTab === 'all'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Recent users ({allUsersList.length})
            </button>
          </div>
        </div>

        {actionFeedback && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs rounded-lg flex items-center gap-2">
            <span>✅</span>
            <span>{actionFeedback}</span>
          </div>
        )}

        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <table className="w-full text-left text-xs min-w-[580px]">
            <thead>
              <tr className="border-b border-[#F3F4F6] text-[#6B7280]">
                <th className="py-2.5 font-medium">User</th>
                <th className="py-2.5 font-medium">Role</th>
                <th className="py-2.5 font-medium">Status</th>
                <th className="py-2.5 font-medium">Registered</th>
                <th className="py-2.5 font-medium text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {(waitlistTab === 'pending' ? waitlist : allUsersList).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#6B7280]">
                    {waitlistTab === 'pending'
                      ? 'No pending waitlist requests. All registered users have been approved.'
                      : 'No users found.'}
                  </td>
                </tr>
              ) : (
                (waitlistTab === 'pending' ? waitlist : allUsersList).map((u: any) => {
                  const status = u.approvalStatus || 'approved';
                  const isPending = status === 'pending';
                  const isRejected = status === 'rejected';
                  const isApproved = status === 'approved';
                  const isLoadingThis = actionLoadingId === u._id;

                  return (
                    <tr key={u._id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-3 font-semibold text-[#111827]">
                        <div>{u.name}</div>
                        <div className="text-[11px] font-normal text-[#6B7280]">{u.email}</div>
                      </td>
                      <td className="py-3 text-[#374151]">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 ${
                          isPending
                            ? 'bg-amber-100 text-amber-800'
                            : isRejected
                            ? 'bg-red-100 text-red-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {isPending ? 'Pending Approval' : isRejected ? 'Rejected' : 'Approved'}
                        </span>
                      </td>
                      <td className="py-3 text-[#6B7280]">
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 text-right">
                        {u.role === 'admin' ? (
                          <span className="text-[11px] text-[#9CA3AF]">Administrator</span>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {(!isApproved || isRejected) && (
                              <button
                                type="button"
                                disabled={isLoadingThis}
                                onClick={() => handleApprove(u._id, u.name)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] rounded-md transition-colors disabled:opacity-50"
                              >
                                {isLoadingThis ? 'Saving...' : '✓ Accept'}
                              </button>
                            )}
                            {(!isRejected || isApproved) && (
                              <button
                                type="button"
                                disabled={isLoadingThis}
                                onClick={() => handleReject(u._id, u.name)}
                                className="px-2.5 py-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-medium text-[11px] rounded-md transition-colors disabled:opacity-50"
                              >
                                ✕ Reject
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Events & Announcements Section */}
      <AdminEventsSection />

      {/* Live Events & System Broadcasts (CRUD) */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#111827]">Live Events &amp; Real-Time Broadcasts</h3>
              <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                {events.length} active
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Create, update, or cancel platform events. Any modification immediately dispatches a real-time WebSocket notification to all active users.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#18181B] hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>

        {/* Events Table */}
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <table className="w-full text-left text-xs min-w-[620px]">
            <thead>
              <tr className="border-b border-[#F3F4F6] text-[#6B7280]">
                <th className="py-2.5 font-medium">Event Title &amp; Description</th>
                <th className="py-2.5 font-medium">Category</th>
                <th className="py-2.5 font-medium">Scheduled Date</th>
                <th className="py-2.5 font-medium">Priority</th>
                <th className="py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[#9CA3AF]">
                    No events published yet. Click <strong>Create Event</strong> to broadcast an event.
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-[#111827]">{evt.title}</div>
                      <div className="text-[11px] text-[#6B7280] line-clamp-1">{evt.description}</div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">
                        {evt.category}
                      </span>
                    </td>
                    <td className="py-3 text-[#374151]">
                      {new Date(evt.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          evt.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : evt.priority === 'medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {evt.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => openEditModal(evt)}
                          className="p-1.5 hover:bg-gray-100 text-[#374151] hover:text-[#111827] rounded-md transition-colors"
                          title="Edit event"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(evt._id, evt.title)}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-md transition-colors"
                          title="Delete event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-[#E5E7EB] animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold text-[#111827]">Create Platform Event &amp; Broadcast</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled System Maintenance Window"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Description / Details</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the event, downtime duration, or special announcement details..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={eventForm.eventDate}
                    onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Category</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  >
                    <option value="Platform Update">Platform Update</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Special Offer">Special Offer</option>
                    <option value="Community">Community</option>
                    <option value="Billing">Billing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Priority</label>
                  <select
                    value={eventForm.priority}
                    onChange={(e) => setEventForm({ ...eventForm, priority: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F3F4F6]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#4B5563] hover:text-[#111827] rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#18181B] hover:bg-black rounded-lg transition-colors"
                >
                  Publish &amp; Broadcast Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-[#E5E7EB] animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold text-[#111827]">Edit Platform Event</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Description / Details</label>
                <textarea
                  required
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={eventForm.eventDate}
                    onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Category</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  >
                    <option value="Platform Update">Platform Update</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Special Offer">Special Offer</option>
                    <option value="Community">Community</option>
                    <option value="Billing">Billing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Priority</label>
                  <select
                    value={eventForm.priority}
                    onChange={(e) => setEventForm({ ...eventForm, priority: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F3F4F6]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#4B5563] hover:text-[#111827] rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Save &amp; Broadcast Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Live Events & System Broadcasts (CRUD) */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#111827]">Live Events &amp; Real-Time Broadcasts</h3>
              <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                {events.length} active
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Create, update, or cancel platform events. Any modification immediately dispatches a real-time WebSocket notification to all active users.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#18181B] hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>

        {/* Events Table */}
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <table className="w-full text-left text-xs min-w-[620px]">
            <thead>
              <tr className="border-b border-[#F3F4F6] text-[#6B7280]">
                <th className="py-2.5 font-medium">Event Title &amp; Description</th>
                <th className="py-2.5 font-medium">Category</th>
                <th className="py-2.5 font-medium">Scheduled Date</th>
                <th className="py-2.5 font-medium">Priority</th>
                <th className="py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[#9CA3AF]">
                    No events published yet. Click <strong>Create Event</strong> to broadcast an event.
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-[#111827]">{evt.title}</div>
                      <div className="text-[11px] text-[#6B7280] line-clamp-1">{evt.description}</div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">
                        {evt.category}
                      </span>
                    </td>
                    <td className="py-3 text-[#374151]">
                      {new Date(evt.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          evt.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : evt.priority === 'medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {evt.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => openEditModal(evt)}
                          className="p-1.5 hover:bg-gray-100 text-[#374151] hover:text-[#111827] rounded-md transition-colors"
                          title="Edit event"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(evt._id, evt.title)}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-md transition-colors"
                          title="Delete event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-[#E5E7EB] animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold text-[#111827]">Create Platform Event &amp; Broadcast</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled System Maintenance Window"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Description / Details</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the event, downtime duration, or special announcement details..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={eventForm.eventDate}
                    onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Category</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  >
                    <option value="Platform Update">Platform Update</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Special Offer">Special Offer</option>
                    <option value="Community">Community</option>
                    <option value="Billing">Billing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Priority</label>
                  <select
                    value={eventForm.priority}
                    onChange={(e) => setEventForm({ ...eventForm, priority: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F3F4F6]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#4B5563] hover:text-[#111827] rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#18181B] hover:bg-black rounded-lg transition-colors"
                >
                  Publish &amp; Broadcast Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-[#E5E7EB] animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold text-[#111827]">Edit Platform Event</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Description / Details</label>
                <textarea
                  required
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={eventForm.eventDate}
                    onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Category</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  >
                    <option value="Platform Update">Platform Update</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Special Offer">Special Offer</option>
                    <option value="Community">Community</option>
                    <option value="Billing">Billing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Priority</label>
                  <select
                    value={eventForm.priority}
                    onChange={(e) => setEventForm({ ...eventForm, priority: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F3F4F6]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#4B5563] hover:text-[#111827] rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Save &amp; Broadcast Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Live Events & System Broadcasts (CRUD) */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#111827]">Live Events &amp; Real-Time Broadcasts</h3>
              <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                {events.length} active
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Create, update, or cancel platform events. Any modification immediately dispatches a real-time WebSocket notification to all active users.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#18181B] hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>

        {/* Events Table */}
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <table className="w-full text-left text-xs min-w-[620px]">
            <thead>
              <tr className="border-b border-[#F3F4F6] text-[#6B7280]">
                <th className="py-2.5 font-medium">Event Title &amp; Description</th>
                <th className="py-2.5 font-medium">Category</th>
                <th className="py-2.5 font-medium">Scheduled Date</th>
                <th className="py-2.5 font-medium">Priority</th>
                <th className="py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[#9CA3AF]">
                    No events published yet. Click <strong>Create Event</strong> to broadcast an event.
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-[#111827]">{evt.title}</div>
                      <div className="text-[11px] text-[#6B7280] line-clamp-1">{evt.description}</div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">
                        {evt.category}
                      </span>
                    </td>
                    <td className="py-3 text-[#374151]">
                      {new Date(evt.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          evt.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : evt.priority === 'medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {evt.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => openEditModal(evt)}
                          className="p-1.5 hover:bg-gray-100 text-[#374151] hover:text-[#111827] rounded-md transition-colors"
                          title="Edit event"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(evt._id, evt.title)}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-md transition-colors"
                          title="Delete event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-[#E5E7EB] animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold text-[#111827]">Create Platform Event &amp; Broadcast</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled System Maintenance Window"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Description / Details</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the event, downtime duration, or special announcement details..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={eventForm.eventDate}
                    onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Category</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  >
                    <option value="Platform Update">Platform Update</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Special Offer">Special Offer</option>
                    <option value="Community">Community</option>
                    <option value="Billing">Billing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Priority</label>
                  <select
                    value={eventForm.priority}
                    onChange={(e) => setEventForm({ ...eventForm, priority: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F3F4F6]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#4B5563] hover:text-[#111827] rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#18181B] hover:bg-black rounded-lg transition-colors"
                >
                  Publish &amp; Broadcast Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-[#E5E7EB] animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
              <h3 className="text-sm font-bold text-[#111827]">Edit Platform Event</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Description / Details</label>
                <textarea
                  required
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={eventForm.eventDate}
                    onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Category</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  >
                    <option value="Platform Update">Platform Update</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Special Offer">Special Offer</option>
                    <option value="Community">Community</option>
                    <option value="Billing">Billing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Priority</label>
                  <select
                    value={eventForm.priority}
                    onChange={(e) => setEventForm({ ...eventForm, priority: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F3F4F6]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#4B5563] hover:text-[#111827] rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Save &amp; Broadcast Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer disclaimer */}
      <footer className="pt-4 border-t border-[#E5E7EB] text-center md:text-left">
        <p className="text-[11px] text-[#9CA3AF]">
          Admin-only · Example platform data · No user-private subscription or spending records exposed.
        </p>
      </footer>
    </div>
  );
};
