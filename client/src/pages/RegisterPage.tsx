import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Compass, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    businessName: '',
    address: 'Andheri West, Mumbai',
    lat: 19.076,
    lng: 72.877,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/register', {
        ...formData,
        lat: Number(formData.lat),
        lng: Number(formData.lng),
      });

      const { user, accessToken, refreshToken } = res.data;
      login(user, accessToken, refreshToken);
      navigate('/');
    } catch (err: any) {
      console.error('Registration failed', err);
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-400 p-0.5 mx-auto shadow-lg shadow-purple-500/20">
          <div className="w-full h-full bg-[#0F0B1A] rounded-[14px] flex items-center justify-center">
            <Compass className="text-purple-400 w-6 h-6" />
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-white">Register Merchant Account</h1>
        <p className="text-xs text-slate-400">Join the verified B2B surplus liquidation network</p>
      </div>

      <div className="bg-[#1A1330] border border-[#2B1F4D] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Contact Person Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ramesh Patel"
                required
                className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Business / Entity Name *
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="e.g. Patel Wholesale Traders"
                required
                className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="merchant@domain.com"
                required
                className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="9876543210"
                className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Secure Password (min 6 chars) *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Warehouse / Shop Location Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Andheri West, Mumbai"
              className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors"
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
            className="w-full py-3 px-4 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-navy-950 font-bold text-sm rounded-xl shadow-lg shadow-purple-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <UserPlus size={16} />
            {loading ? 'Creating Account...' : 'Complete Merchant Registration'}
          </button>
        </form>
      </div>

      <div className="text-center text-xs text-slate-400">
        Already registered?{' '}
        <Link to="/login" className="text-purple-400 font-semibold hover:underline">
          Sign in here
        </Link>
      </div>
    </div>
  );
};
