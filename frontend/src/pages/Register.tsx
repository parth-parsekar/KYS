import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredCurrency, setPreferredCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('America/Los_Angeles');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        preferredCurrency,
        timezone,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between p-6 md:p-12">
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
                placeholder="you@example.com"
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
                placeholder="Create a secure password"
                className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#111827]"
                required
              />
              <p className="text-[11px] text-[#9CA3AF] mt-1">Your password is never displayed or shared.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Preferred currency</label>
                <select
                  value={preferredCurrency}
                  onChange={(e) => setPreferredCurrency(e.target.value)}
                  className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#111827]"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Time zone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#111827]"
                >
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                </select>
              </div>
            </div>

            <div className="text-[11px] text-[#9CA3AF] pt-1">
              <p className="font-medium text-[#4B5563]">New accounts have the User role.</p>
              <p>Administrator access is assigned separately.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-xs font-semibold text-white bg-[#18181B] rounded-lg hover:bg-black transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
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
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center md:text-left pt-6 text-[11px] text-[#9CA3AF]">
        KYS is a subscription tracker — not a payment processor.
      </footer>
    </div>
  );
};
