import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Compass, ShieldCheck, Sparkles, UserCheck, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

const DEMO_USERS = [
  { name: 'Rajesh Sharma', email: 'rajesh@demo.com', role: 'Mumbai Wholesale Seller' },
  { name: 'Suresh Kumar', email: 'suresh@demo.com', role: 'Delhi Groceries Trader' },
  { name: 'Lakshmi Rao', email: 'lakshmi@demo.com', role: 'Bangalore Fresh Foods' },
  { name: 'Admin', email: 'admin@stockbridge.com', role: 'Platform Administrator' },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const executeLogin = async (loginEmail: string, loginPass: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', {
        email: loginEmail,
        password: loginPass,
      });

      const { user, accessToken, refreshToken } = res.data;
      login(user, accessToken, refreshToken);
      navigate('/');
    } catch (err: any) {
      console.error('Login failed', err);
      setError(err.response?.data?.error || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(email.trim(), password);
  };

  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      {/* Brand Icon */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-400 p-0.5 mx-auto shadow-lg shadow-teal-500/20">
          <div className="w-full h-full bg-[#0f1329] rounded-[14px] flex items-center justify-center">
            <Compass className="text-teal-400 w-6 h-6" />
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-white">Sign In to StockBridge</h1>
        <p className="text-xs text-slate-400">Access your B2B surplus trading dashboard</p>
      </div>

      {/* Main Login Form */}
      <div className="bg-[#1b2151] border border-[#3f4b81] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Registered Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rajesh@demo.com"
              required
              className="w-full bg-[#0f1329] border border-[#3f4b81] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#0f1329] border border-[#3f4b81] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/60 flex items-center gap-1.5">
              <AlertCircle size={14} /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-bold text-sm rounded-xl shadow-lg shadow-teal-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LogIn size={16} />
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* 1-Click Demo Accounts Selector */}
        <div className="pt-4 border-t border-[#3f4b81]/60 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1">
            <Sparkles size={13} /> 1-Click Demo Accounts (password: password123)
          </span>

          <div className="grid grid-cols-2 gap-2">
            {DEMO_USERS.map((user) => (
              <button
                key={user.email}
                onClick={() => executeLogin(user.email, 'password123')}
                disabled={loading}
                className="p-2.5 bg-[#0f1329] hover:bg-[#20275e] border border-[#3f4b81] rounded-xl text-left transition-all text-xs cursor-pointer group"
              >
                <span className="font-semibold text-white group-hover:text-teal-300 block truncate">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-400 truncate block">
                  {user.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400">
        New merchant business?{' '}
        <Link to="/register" className="text-teal-400 font-semibold hover:underline">
          Register for an account
        </Link>
      </div>
    </div>
  );
};
