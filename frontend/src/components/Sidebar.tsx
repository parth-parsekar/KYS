import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useSocket();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-[#E5E7EB] text-[#111827] font-semibold'
        : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827]'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col h-screen fixed left-0 top-0 z-20 select-none">
      {/* Brand Header */}
      <div className="p-6 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">KYS</h1>
        <p className="text-xs text-[#6B7280] font-normal mt-0.5">Know Your Subscription</p>
      </div>

      {/* Nav List */}
      <div className="flex-1 px-4 py-2 space-y-6 overflow-y-auto">
        <div>
          <div className="text-[11px] font-semibold text-[#9CA3AF] tracking-wider uppercase mb-2 px-3.5">
            WORKSPACE
          </div>
          <nav className="space-y-1">
            <NavLink to="/" end className={navItemClass}>
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/subscriptions" className={navItemClass}>
              <span>My subscriptions</span>
            </NavLink>
            <NavLink to="/add" className={navItemClass}>
              <span>Add subscription</span>
            </NavLink>
            <NavLink to="/analytics" className={navItemClass}>
              <span>Analytics</span>
            </NavLink>
            <NavLink to="/notifications" className={navItemClass}>
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-extrabold shadow-xs">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          </nav>
        </div>

        <div className="pt-2 border-t border-[#E5E7EB]">
          <nav className="space-y-1">
            <NavLink to="/preferences" className={navItemClass}>
              <span>Preferences & budget</span>
            </NavLink>

            {/* Admin variant */}
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={navItemClass}>
                <span>Admin &amp; Events</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">
                  Admin
                </span>
              </NavLink>
            )}

            <NavLink to="/empty-states" className={navItemClass}>
              <span>Empty & recovery states</span>
            </NavLink>
          </nav>
        </div>
      </div>

      {/* Footer / User section */}
      <div className="p-4 border-t border-[#E5E7EB] space-y-3">
        <button
          onClick={handleSignOut}
          className="w-full text-left px-3.5 py-1.5 text-xs text-[#6B7280] hover:text-[#111827] transition-colors"
        >
          Sign out
        </button>

        <div className="pt-2 border-t border-[#F3F4F6] px-3.5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#111827] leading-snug">
              {user?.name || 'Alex Morgan'}
              {user?.role === 'admin' && (
                <span className="text-xs font-normal text-[#6B7280]"> · Admin</span>
              )}
            </p>
            <p className="text-xs text-[#6B7280]">
              {user?.role === 'admin' ? 'Administrator' : 'Personal workspace'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

