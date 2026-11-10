import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useSocket();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end md:hidden">
      <div className="w-full max-w-sm bg-white h-full overflow-y-auto flex flex-col p-6 shadow-2xl">
        {/* Top bar */}
        <div className="flex items-center justify-between pb-6 border-b border-[#E5E7EB]">
          <h2 className="text-xl font-bold tracking-tight text-[#111827]">KYS</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleNav('/notifications')}
              className="text-xs font-medium text-[#4B5563]"
            >
              Alerts ({unreadCount})
            </button>
            <button
              onClick={onClose}
              className="text-xs font-semibold px-2.5 py-1 border border-[#E5E7EB] rounded text-[#111827]"
            >
              Close
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="py-5">
          <h3 className="text-2xl font-bold text-[#111827]">Navigation</h3>
          <p className="text-xs text-[#6B7280] mt-1">
            {user?.name || 'Alex Morgan'} · {user?.role === 'admin' ? 'Administrator' : 'Personal workspace'}
          </p>
        </div>

        {/* Primary nav buttons matching wireframe 23 */}
        <div className="space-y-3 flex-1">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 space-y-2.5">
            <button
              onClick={() => handleNav('/')}
              className="w-full text-left px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm font-medium text-[#111827] hover:bg-gray-50 transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={() => handleNav('/subscriptions')}
              className="w-full text-left px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm font-medium text-[#111827] hover:bg-gray-50 transition-colors"
            >
              My subscriptions
            </button>
            <button
              onClick={() => handleNav('/add')}
              className="w-full text-left px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm font-medium text-[#111827] hover:bg-gray-50 transition-colors"
            >
              Add subscription
            </button>
            <button
              onClick={() => handleNav('/analytics')}
              className="w-full text-left px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm font-medium text-[#111827] hover:bg-gray-50 transition-colors"
            >
              Analytics
            </button>
            <button
              onClick={() => handleNav('/notifications')}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm font-medium text-[#111827] hover:bg-gray-50 transition-colors"
            >
              <span>Notifications ({unreadCount})</span>
            </button>
            <button
              onClick={() => handleNav('/preferences')}
              className="w-full text-left px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm font-medium text-[#111827] hover:bg-gray-50 transition-colors"
            >
              Preferences & budget
            </button>
          </div>

          {/* Sign out button */}
          <div className="border border-[#E5E7EB] rounded-xl p-3 bg-white">
            <button
              onClick={handleSignOut}
              className="w-full text-left text-sm text-[#4B5563] hover:text-[#111827] px-2 py-1"
            >
              Sign out
            </button>
          </div>

          {/* Administrator variant card matching wireframe 23 */}
          {user?.role === 'admin' && (
            <div className="border border-[#E5E7EB] rounded-xl p-4 bg-white space-y-3">
              <h4 className="text-sm font-semibold text-[#111827]">Administrator variant</h4>
              <p className="text-xs text-[#6B7280]">
                This section appears only for authorized Admin accounts.
              </p>
              <button
                onClick={() => handleNav('/admin')}
                className="w-full text-left px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm font-medium text-[#111827] hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <span>Admin dashboard</span>
                <span>→</span>
              </button>
            </div>
          )}
        </div>

        <div className="pt-4 text-center">
          <p className="text-[11px] text-[#9CA3AF]">
            Standard User accounts do not see administration links.
          </p>
        </div>
      </div>
    </div>
  );
};
