import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { detectDefaultCurrency, detectDefaultTimezone } from '../utils/currencyUtils';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredCurrency, setPreferredCurrency] = useState(detectDefaultCurrency());
  const [timezone, setTimezone] = useState(detectDefaultTimezone());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        name,
        email,
        password,
        preferredCurrency,
        timezone,
      });
      if (res?.pendingApproval) {
        setIsPendingApproval(true);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between p-4 sm:p-8 lg:p-12">
      {/* Brand */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">KYS</h1>
      </div>

      {/* Main Grid matching Screen 08 */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center my-8">
        {/* Left Side */}
        <div className="space-y-10">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#111827] tracking-tight leading-tight">
              Know what you’re<br />subscribed to.
            </h2>
            <p className="text-sm md:text-base text-[#6B7280] mt-4 font-normal">
              One place for subscriptions, spending and renewals.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <span className="text-xs font-bold text-[#9CA3AF] mt-0.5">01</span>
              <div>
                <h4 className="text-sm font-bold text-[#111827]">Track every subscription</h4>
                <p className="text-xs text-[#6B7280] mt-0.5">Quick-add popular services or enter your own.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <span className="text-xs font-bold text-[#9CA3AF] mt-0.5">02</span>
              <div>
                <h4 className="text-sm font-bold text-[#111827]">Understand your spending</h4>
                <p className="text-xs text-[#6B7280] mt-0.5">See monthly totals, budgets and 12-month trends.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <span className="text-xs font-bold text-[#9CA3AF] mt-0.5">03</span>
              <div>
                <h4 className="text-sm font-bold text-[#111827]">Stay ahead of renewals</h4>
                <p className="text-xs text-[#6B7280] mt-0.5">Get reminders within three days of renewal.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E7EB]">
            <p className="text-xs text-[#6B7280]">
              No bank connections. No card numbers. No payment processing.
            </p>
          </div>
        </div>

        {/* Right Side Register Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm space-y-5 max-w-md w-full mx-auto">
          {isPendingApproval ? (
            <div className="space-y-6 py-4 text-center">
              <div className="w-14 h-14 bg-amber-50 border border-amber-200 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold shadow-xs">
                ⏳
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-[#111827]">You're on the waitlist!</h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Your account for <strong className="text-[#111827]">{email}</strong> has been registered.
                  An administrator has been alerted in real time to review and approve your access request.
                </p>
              </div>

              <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl p-4 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#374151]">
                  <span className="text-[#6B7280]">Account Name:</span>
                  <span className="font-semibold">{name}</span>
                </div>
                <div className="flex items-center justify-between text-[#374151]">
                  <span className="text-[#6B7280]">Status:</span>
                  <span className="bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                    Pending Admin Approval
                  </span>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-[#18181B] rounded-lg hover:bg-black transition-colors"
                >
                  Return to sign in →
                </button>
                <p className="text-[11px] text-[#9CA3AF]">
                  You will be able to sign in as soon as the administrator approves your request.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-2xl font-bold text-[#111827]">Create your account</h3>
                <p className="text-xs text-[#6B7280] mt-1">Start with a personal, private workspace.</p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Full name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#111827]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Email address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#111827]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Password *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#111827]"
                    required
                  />
                  <p className="text-[11px] text-[#9CA3AF] mt-1">Must be at least 6 characters</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1">Currency</label>
                    <select
                      value={preferredCurrency}
                      onChange={(e) => setPreferredCurrency(e.target.value)}
                      className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#111827]"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="AUD">AUD ($)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1">Timezone</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#111827]"
                    >
                      {[
                        'Asia/Kolkata',
                        'Europe/London',
                        'Europe/Paris',
                        'Europe/Berlin',
                        'America/New_York',
                        'America/Chicago',
                        'America/Denver',
                        'America/Los_Angeles',
                        'Asia/Dubai',
                        'Asia/Singapore',
                        'Asia/Tokyo',
                        'Australia/Sydney',
                        'UTC',
                      ].includes(timezone) ? null : (
                        <option value={timezone}>{timezone} (Detected)</option>
                      )}
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="Europe/London">Europe/London (GMT/BST)</option>
                      <option value="Europe/Paris">Europe/Paris (CET)</option>
                      <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="America/Chicago">America/Chicago (CST)</option>
                      <option value="America/Denver">America/Denver (MST)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                      <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>

                <div className="text-[11px] text-[#9CA3AF] pt-1">
                  <p className="font-medium text-[#4B5563]">New registrations enter the administrator waitlist.</p>
                  <p>You can sign in once approved by the platform admin.</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-[#18181B] rounded-lg hover:bg-black transition-colors disabled:opacity-50"
                >
                  {loading ? 'Submitting registration...' : 'Join Waitlist & Register'}
                </button>
              </form>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs font-medium text-[#111827] hover:underline"
                >
                  Already have an account? Sign in →
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center md:text-left pt-6 text-[11px] text-[#9CA3AF]">
        KYS is a subscription tracker — not a payment processor.
      </footer>
    </div>
  );
};
