import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

interface HeaderProps {
  breadcrumb?: string;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ breadcrumb, onOpenMobileMenu }) => {
  const { user } = useAuth();
  const { unreadCount } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/subscriptions?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Compute breadcrumb if not explicitly provided
  const getBreadcrumb = () => {
    if (breadcrumb) return breadcrumb;
    const path = location.pathname;
    const workspacePrefix = user?.role === 'admin' && path.startsWith('/admin') ? 'Administration' : 'Personal workspace';

    if (path === '/') return `${workspacePrefix} / Dashboard`;
    if (path === '/subscriptions') return `${workspacePrefix} / My subscriptions`;
    if (path.startsWith('/subscriptions/')) return `${workspacePrefix} / Subscription details`;
    if (path === '/add') return `${workspacePrefix} / Add subscription`;
    if (path === '/analytics') return `${workspacePrefix} / Analytics`;
    if (path === '/notifications') return `${workspacePrefix} / Notifications`;
    if (path === '/preferences') return `${workspacePrefix} / Preferences & budget`;
    if (path === '/admin') return `Administration / Dashboard`;
    if (path === '/empty-states') return `${workspacePrefix} / Empty & recovery states`;
    return `${workspacePrefix} / Dashboard`;
  };

  const getShortName = () => {
    if (!user?.name) return user?.role === 'admin' ? 'Admin' : 'Workspace';
    const parts = user.name.split(' ');
    const formatted = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
    return user?.role === 'admin' ? `${formatted} (Admin)` : formatted;
  };

  return (
    <header className="bg-white border-b border-[#E5E7EB] h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
      {/* Mobile & Tablet View Top Bar (< 1024px) */}
      <div className="flex lg:hidden items-center justify-between w-full gap-2">
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 -ml-1 text-[#111827] hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
            aria-label="Open navigation menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-baseline space-x-2 truncate">
            <h1 className="text-xl font-bold tracking-tight text-[#111827]">KYS</h1>
            <span className="hidden sm:inline text-xs text-[#6B7280] truncate font-normal">
              {getBreadcrumb()}
            </span>
          </div>
        </div>

        {/* Tablet Search Bar (hidden on small phones, visible on tablets >= 640px) */}
        <div className="hidden sm:block flex-1 max-w-xs mx-2">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#F3F4F6] text-xs text-[#111827] placeholder-[#9CA3AF] px-3 py-1.5 rounded-lg border border-transparent focus:border-[#D1D5DB] focus:bg-white focus:outline-none transition-all"
            />
          </form>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => navigate('/notifications')}
            className="text-xs font-medium text-[#374151] hover:text-[#111827] px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors relative"
            title="Notifications"
          >
            Alerts
            {unreadCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#18181B] text-white">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={onOpenMobileMenu}
            className="text-xs font-semibold text-[#111827] px-2.5 py-1.5 border border-[#E5E7EB] rounded-lg hover:bg-gray-50 transition-colors"
          >
            Menu
          </button>
        </div>
      </div>

      {/* Desktop view (>= 1024px) */}
      <div className="hidden lg:flex items-center justify-between w-full">
        {/* Breadcrumb */}
        <div className="text-xs text-[#6B7280] font-normal tracking-wide">
          {getBreadcrumb()}
        </div>

        {/* Search, Alerts & User info */}
        <div className="flex items-center space-x-6">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-72 bg-[#F3F4F6] text-xs text-[#111827] placeholder-[#9CA3AF] px-3.5 py-2 rounded-lg border border-transparent focus:border-[#D1D5DB] focus:bg-white focus:outline-none transition-all"
            />
          </form>

          <button
            onClick={() => navigate('/notifications')}
            className="text-xs text-[#374151] hover:text-[#111827] font-medium transition-colors"
          >
            Alerts ({unreadCount})
          </button>

          <div className="text-xs font-medium text-[#111827] pl-1">
            {getShortName()}
          </div>
        </div>
      </div>
    </header>
  );
};

