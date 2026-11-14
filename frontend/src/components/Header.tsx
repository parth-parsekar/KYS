import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

interface HeaderProps {
  breadcrumb?: string;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ breadcrumb, onOpenMobileMenu }) => {
  const { user } = useAuth();
  const { unreadCount, recentNotifications, markAsRead, markAllAsRead, refreshNotifications } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    if (!isDropdownOpen) {
      refreshNotifications();
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/subscriptions?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

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

  const formatTimestamp = (dateStr: string) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <header className="bg-white border-b border-[#E5E7EB] h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
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

        {/* Tablet Search Bar */}
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

        {/* Right Actions - Mobile */}
        <div className="flex items-center space-x-2 shrink-0 relative" ref={dropdownRef}>
          {/* Notification Bell Button */}
          <button
            onClick={toggleDropdown}
            className="p-2 text-[#374151] hover:text-[#111827] rounded-lg hover:bg-gray-100 transition-colors relative"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
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
        <div className="flex items-center space-x-5">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 bg-[#F3F4F6] text-xs text-[#111827] placeholder-[#9CA3AF] px-3.5 py-2 rounded-lg border border-transparent focus:border-[#D1D5DB] focus:bg-white focus:outline-none transition-all"
            />
          </form>

          {/* Notification Bell with Badge & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="relative p-2 text-[#4B5563] hover:text-[#111827] hover:bg-gray-100 rounded-xl transition-all flex items-center justify-center"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-[#374151]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-sm animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown (Requirement 6) */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-84 sm:w-96 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xl py-2 z-50 overflow-hidden transform transition-all animate-fadeIn">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6]">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-medium text-[#2563EB] hover:text-[#1D4ED8] flex items-center space-x-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-[#F3F4F6]">
                  {recentNotifications && recentNotifications.length > 0 ? (
                    recentNotifications.slice(0, 6).map((notif: any) => (
                      <div
                        key={notif._id}
                        onClick={() => notif._id && !notif.isRead && markAsRead(notif._id)}
                        className={`p-3.5 hover:bg-gray-50 transition-colors cursor-pointer flex items-start space-x-3 ${
                          !notif.isRead ? 'bg-[#F9FAFB]' : ''
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                            notif.title?.includes('New Event')
                              ? 'bg-emerald-100 text-emerald-700'
                              : notif.title?.includes('Updated')
                              ? 'bg-amber-100 text-amber-700'
                              : notif.title?.includes('Cancelled')
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {notif.title?.includes('New Event')
                            ? '✨'
                            : notif.title?.includes('Updated')
                            ? '✏️'
                            : notif.title?.includes('Cancelled')
                            ? '🗑️'
                            : '🔔'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4
                              className={`text-xs truncate ${
                                !notif.isRead ? 'font-bold text-[#111827]' : 'font-medium text-[#374151]'
                              }`}
                            >
                              {notif.title}
                            </h4>
                            {!notif.isRead && (
                              <span className="w-2 h-2 rounded-full bg-red-600 shrink-0 ml-1"></span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#6B7280] line-clamp-2 mt-0.5 leading-relaxed">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-[#9CA3AF] block mt-1">
                            {formatTimestamp(notif.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-[#9CA3AF]">
                      No notifications yet
                    </div>
                  )}
                </div>

                {/* Footer link to view all */}
                <div className="p-2 border-t border-[#F3F4F6] bg-[#FAFAFA] text-center">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate('/notifications');
                    }}
                    className="text-xs font-semibold text-[#111827] hover:text-[#2563EB] inline-flex items-center space-x-1.5 py-1"
                  >
                    <span>View all notifications</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="text-xs font-medium text-[#111827] pl-1 border-l border-gray-200 pl-4">
            {getShortName()}
          </div>
        </div>
      </div>
    </header>
  );
};
