import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, Clock, Users, UserPlus, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api/client';

interface AdminWaitlistSectionProps {
  onRefreshStats?: () => void;
  showAdminLink?: boolean;
}

export const AdminWaitlistSection: React.FC<AdminWaitlistSectionProps> = ({
  onRefreshStats,
  showAdminLink = false,
}) => {
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [allUsersList, setAllUsersList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Quick Add User modal state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [addUserLoading, setAddUserLoading] = useState(false);

  useEffect(() => {
    loadWaitlist();
  }, []);

  const loadWaitlist = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminWaitlist();
      if (res.success) {
        setWaitlist(res.waitlist || []);
        setAllUsersList(res.recentUsers || []);
      }
    } catch (e: any) {
      console.warn('Could not load waitlist:', e);
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleApprove = async (userId: string, userName: string) => {
    try {
      setActionLoadingId(userId);
      const res = await api.approveUser(userId);
      if (res.success) {
        showFeedback('success', `Approved registration for ${userName}! User can now sign in.`);
        await loadWaitlist();
        if (onRefreshStats) onRefreshStats();
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to approve user');
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
        showFeedback('success', `Rejected registration for ${userName}.`);
        await loadWaitlist();
        if (onRefreshStats) onRefreshStats();
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to reject user');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email || !newUserForm.password) return;
    try {
      setAddUserLoading(true);
      const res = await (api as any).createUser(newUserForm);
      if (res.success) {
        showFeedback('success', `Created & approved ${newUserForm.name} (${newUserForm.email})!`);
        setIsAddUserOpen(false);
        setNewUserForm({ name: '', email: '', password: '', role: 'user' });
        await loadWaitlist();
        if (onRefreshStats) onRefreshStats();
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to create user');
    } finally {
      setAddUserLoading(false);
    }
  };

  const currentList = activeTab === 'pending' ? waitlist : allUsersList;
  const filteredList = currentList.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#111827]" />
            <h3 className="text-sm font-bold text-[#111827]">
              New user waitlist &amp; access approvals
            </h3>
            {waitlist.length > 0 ? (
              <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                {waitlist.length} pending
              </span>
            ) : (
              <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                All approved
              </span>
            )}
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Review and moderate incoming registrations before granting login access to the platform.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs: Pending vs Recent/Past Users */}
          <div className="flex items-center gap-1 bg-[#F3F4F6] p-1 rounded-lg border border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                activeTab === 'pending'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Pending ({waitlist.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Recent users ({allUsersList.length})
            </button>
          </div>

          {/* Quick Add User Button */}
          <button
            type="button"
            onClick={() => setIsAddUserOpen(true)}
            className="text-xs font-semibold text-white bg-[#18181B] hover:bg-black rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add user</span>
          </button>

          {showAdminLink && (
            <a
              href="/admin"
              className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold flex items-center gap-1 ml-1"
            >
              <span>Admin Console →</span>
            </a>
          )}
        </div>
      </div>

      {/* Action Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 text-xs rounded-lg flex items-center gap-2 border transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-xs">
        <Search className="w-3.5 h-3.5 text-[#9CA3AF]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeTab === 'pending' ? 'waitlist' : 'past users'} by name or email...`}
          className="bg-transparent text-xs text-[#111827] placeholder-[#9CA3AF] w-full focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-[11px] text-[#9CA3AF] hover:text-[#111827]"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
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
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#6B7280]">
                  {loading ? (
                    'Loading waitlist data...'
                  ) : searchQuery ? (
                    `No users matched "${searchQuery}".`
                  ) : activeTab === 'pending' ? (
                    'No pending waitlist requests. All registered users have been approved.'
                  ) : (
                    'No users found in platform directory.'
                  )}
                </td>
              </tr>
            ) : (
              filteredList.map((u: any) => {
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
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 ${
                          isPending
                            ? 'bg-amber-100 text-amber-800'
                            : isRejected
                            ? 'bg-red-100 text-red-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
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
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] rounded-md transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>{isLoadingThis ? 'Saving...' : '✓ Accept'}</span>
                            </button>
                          )}
                          {(!isRejected || isApproved) && (
                            <button
                              type="button"
                              disabled={isLoadingThis}
                              onClick={() => handleReject(u._id, u.name)}
                              className="px-2.5 py-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-medium text-[11px] rounded-md transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              <UserX className="w-3 h-3" />
                              <span>✕ Reject</span>
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

      {/* Quick Add User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 border border-[#E5E7EB] animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#111827]" />
                <h3 className="text-sm font-bold text-[#111827]">Directly Add &amp; Register User</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Lee"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="jordan@example.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Platform Role</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full text-xs text-[#111827] bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-[#111827]"
                >
                  <option value="user">Standard User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F3F4F6]">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#4B5563] hover:text-[#111827] rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addUserLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#18181B] hover:bg-black rounded-lg transition-colors disabled:opacity-50"
                >
                  {addUserLoading ? 'Creating user...' : 'Add & Pre-Approve User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
