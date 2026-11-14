import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, Radio } from 'lucide-react';
import { api } from '../api/client';

export const AdminEventsSection: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    eventDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    category: 'Platform Update',
    priority: 'medium',
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await api.getEvents();
      if (res.success) {
        setEvents(res.data || []);
      }
    } catch (err: any) {
      console.warn('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createEvent(form);
      if (res.success) {
        setFeedback(`🎉 Event "${form.title}" published! Notification sent to all users.`);
        setIsCreateModalOpen(false);
        setForm({
          title: '',
          description: '',
          eventDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
          category: 'Platform Update',
          priority: 'medium',
        });
        await loadEvents();
        setTimeout(() => setFeedback(null), 5000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create event');
    }
  };

  const openEdit = (evt: any) => {
    setEditingEvent(evt);
    setForm({
      title: evt.title,
      description: evt.description,
      eventDate: new Date(evt.eventDate).toISOString().split('T')[0],
      category: evt.category || 'Platform Update',
      priority: evt.priority || 'medium',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    try {
      const res = await api.updateEvent(editingEvent._id, form);
      if (res.success) {
        setFeedback(`✏️ Event "${form.title}" updated! Notification broadcast to users.`);
        setIsEditModalOpen(false);
        setEditingEvent(null);
        await loadEvents();
        setTimeout(() => setFeedback(null), 5000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update event');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to cancel and delete "${title}"? This will broadcast a cancellation alert to all users.`)) return;
    try {
      const res = await api.deleteEvent(id);
      if (res.success) {
        setFeedback(`🗑️ Event "${title}" deleted. Cancellation notification sent.`);
        await loadEvents();
        setTimeout(() => setFeedback(null), 5000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete event');
    }
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#111827]">Live Events &amp; Real-Time Broadcasts</h3>
            <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              {events.length} active
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Admin event lifecycle manager. Creating, updating, or deleting events sends instant notifications to all active users via WebSockets.
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

      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs rounded-lg flex items-center gap-2 animate-fadeIn">
          <span>{feedback}</span>
        </div>
      )}

      {/* Events Table */}
      <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
        <table className="w-full text-left text-xs min-w-[620px]">
          <thead>
            <tr className="border-b border-[#F3F4F6] text-[#6B7280]">
              <th className="py-2.5 font-medium">Event Title &amp; Details</th>
              <th className="py-2.5 font-medium">Category</th>
              <th className="py-2.5 font-medium">Scheduled Date</th>
              <th className="py-2.5 font-medium">Priority</th>
              <th className="py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-xs text-[#9CA3AF]">
                  Loading live events...
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-[#9CA3AF]">
                  No platform events created yet. Click <strong>Create Event</strong> to broadcast your first event.
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
                        onClick={() => openEdit(evt)}
                        className="p-1.5 hover:bg-gray-100 text-[#374151] hover:text-[#111827] rounded-md transition-colors"
                        title="Edit event"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(evt._id, evt.title)}
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

      {/* Create Event Modal (Requirement 1) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-[#E5E7EB]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
              <div className="flex items-center space-x-2">
                <span className="text-base">📢</span>
                <h3 className="text-sm font-bold text-[#111827]">Create &amp; Broadcast Event</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Platform Maintenance Window"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Description / Details</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide details about the event, expected duration, or announcements..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    required
                    value={form.eventDate}
                    onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
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
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
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
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#18181B] hover:bg-black rounded-lg transition-colors flex items-center space-x-1"
                >
                  <span>Publish &amp; Broadcast Event</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal (Requirement 2) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-[#E5E7EB]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
              <div className="flex items-center space-x-2">
                <span className="text-base">✏️</span>
                <h3 className="text-sm font-bold text-[#111827]">Edit &amp; Update Event</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Description / Details</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    required
                    value={form.eventDate}
                    onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                    className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
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
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
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
    </div>
  );
};
