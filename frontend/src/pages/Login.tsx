import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Unable to sign in. Check your details and try again.');
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

      {/* Main Grid: Left Value Prop & Right Sign In Form */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center my-8">
        {/* Left Side Value Props matching Screen 07 */}
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

        {/* Right Side Card: Sign In Box matching Screen 07 */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm space-y-6 max-w-md w-full mx-auto">
          <div>
            <h3 className="text-2xl font-bold text-[#111827]">Welcome back</h3>
            <p className="text-xs text-[#6B7280] mt-1">Sign in to your KYS workspace.</p>
          </div>

          {error && (
            <div
              className={`p-3.5 text-xs rounded-lg border ${
                error.toLowerCase().includes('waitlist') || error.toLowerCase().includes('approval')
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="shrink-0 text-sm">
                  {error.toLowerCase().includes('waitlist') || error.toLowerCase().includes('approval')
                    ? '⏳'
                    : '⚠️'}
                </span>
                <span className="leading-relaxed">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Email address</label>
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
              <label className="block text-xs font-medium text-[#374151] mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full text-xs text-[#111827] bg-white border border-[#D1D5DB] rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#111827]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-xs font-semibold text-white bg-[#18181B] rounded-lg hover:bg-black transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              to="/register"
              className="text-xs font-medium text-[#111827] hover:underline"
            >
              New to KYS? Create an account →
            </Link>
          </div>

          {/* Privacy Callout Box */}
          <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl space-y-0.5">
            <h5 className="text-xs font-bold text-[#111827]">Your workspace is private.</h5>
            <p className="text-[11px] text-[#6B7280]">You can only view and manage your own records.</p>
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

