import React from 'react';
import { useNavigate } from 'react-router-dom';

export const EmptyStates: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header matching Screen 12 */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#111827]">Empty & recovery states</h2>
        <p className="text-xs md:text-sm text-[#6B7280] mt-1">Helpful feedback when there is no data or a connection fails.</p>
      </div>

      {/* 3x3 Grid matching Screen 12 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. No subscriptions yet */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">No subscriptions yet</h3>
            <p className="text-xs text-[#4B5563] mt-2">Add a service to see spending and renewals.</p>
            <p className="text-xs text-[#6B7280] mt-3">Your monthly total is $0 until you add one.</p>
          </div>
          <button
            onClick={() => navigate('/add')}
            className="w-full py-2.5 text-xs font-semibold text-white bg-[#18181B] rounded-lg hover:bg-black transition-colors"
          >
            Add subscription
          </button>
        </div>

        {/* 2. No catalog matches */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">No catalog matches</h3>
            <p className="text-xs text-[#4B5563] mt-2">Try another service name or category.</p>
            <p className="text-xs text-[#6B7280] mt-3">You can always add a custom service.</p>
          </div>
          <button
            onClick={() => navigate('/add')}
            className="w-full py-2.5 text-xs font-semibold text-[#111827] bg-white border border-[#D1D5DB] rounded-lg hover:bg-gray-50 transition-colors"
          >
            Add custom service
          </button>
        </div>

        {/* 3. No billing history */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">No billing history</h3>
            <p className="text-xs text-[#4B5563] mt-2">There are no recorded billing events yet.</p>
            <p className="text-xs text-[#6B7280] mt-3">Use labelled demo data, or record an event.</p>
          </div>
          <button
            onClick={() => navigate('/subscriptions')}
            className="w-full py-2.5 text-xs font-semibold text-[#111827] bg-white border border-[#D1D5DB] rounded-lg hover:bg-gray-50 transition-colors"
          >
            View demo history
          </button>
        </div>

        {/* 4. Could not save subscription */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Could not save subscription</h3>
            <p className="text-xs text-[#4B5563] mt-2">The service is temporarily unavailable.</p>
            <p className="text-xs text-[#6B7280] mt-3">Your form values are kept. Try again.</p>
          </div>
          <button
            onClick={() => navigate('/add')}
            className="w-full py-2.5 text-xs font-semibold text-[#111827] bg-white border border-[#D1D5DB] rounded-lg hover:bg-gray-50 transition-colors"
          >
            Retry save
          </button>
        </div>

        {/* 5. Reconnecting to notifications */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Reconnecting to notifications</h3>
            <p className="text-xs text-[#4B5563] mt-2">Live updates are temporarily unavailable.</p>
            <p className="text-xs text-[#6B7280] mt-3">Saved history remains; missed alerts sync later.</p>
          </div>
          <button
            onClick={() => navigate('/notifications')}
            className="w-full py-2.5 text-xs font-semibold text-[#111827] bg-white border border-[#D1D5DB] rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reconnect
          </button>
        </div>

        {/* 6. Your session has expired */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Your session has expired</h3>
            <p className="text-xs text-[#4B5563] mt-2">Sign in again to continue securely.</p>
            <p className="text-xs text-[#6B7280] mt-3">No other user's records are shown.</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2.5 text-xs font-semibold text-[#111827] bg-white border border-[#D1D5DB] rounded-lg hover:bg-gray-50 transition-colors"
          >
            Sign in
          </button>
        </div>

        {/* 7. Admin access required */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Admin access required</h3>
            <p className="text-xs text-[#4B5563] mt-2">Your account does not have the Admin role.</p>
            <p className="text-xs text-[#6B7280] mt-3">Return to your personal workspace.</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 text-xs font-semibold text-[#111827] bg-white border border-[#D1D5DB] rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to dashboard
          </button>
        </div>

        {/* 8. Check subscription details */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Check subscription details</h3>
            <p className="text-xs text-[#4B5563] mt-2">Amount must be greater than zero.</p>
            <p className="text-xs text-[#6B7280] mt-3">Renewal must not be before the start date.</p>
          </div>
          <button
            onClick={() => navigate('/add')}
            className="w-full py-2.5 text-xs font-semibold text-[#111827] bg-white border border-[#D1D5DB] rounded-lg hover:bg-gray-50 transition-colors"
          >
            Review fields
          </button>
        </div>

        {/* 9. Unable to sign in */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Unable to sign in</h3>
            <p className="text-xs text-[#4B5563] mt-2">The email or password is incorrect.</p>
            <p className="text-xs text-[#6B7280] mt-3">Check your details and try again.</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2.5 text-xs font-semibold text-[#111827] bg-white border border-[#D1D5DB] rounded-lg hover:bg-gray-50 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>

      {/* Footer disclaimer */}
      <footer className="pt-4 border-t border-[#E5E7EB] text-center md:text-left">
        <p className="text-[11px] text-[#9CA3AF]">
          Alternative empty, validation and recovery states · Each appears only in the relevant situation.
        </p>
      </footer>
    </div>
  );
};
