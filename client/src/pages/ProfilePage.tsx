import React, { useEffect, useState } from 'react';
import {
  User as UserIcon,
  Building2,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Star,
  Save,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import type { User, Rating } from '../types';
import { RatingStars } from '../components/RatingStars';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    businessName: '',
    address: '',
    lat: 19.076,
    lng: 72.877,
  });

  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    api
      .get('/auth/me')
      .then((res) => {
        const u = res.data;
        setFormData({
          name: u.name || '',
          phone: u.phone || '',
          businessName: u.businessName || '',
          address: u.address || '',
          lat: u.lat || 19.076,
          lng: u.lng || 72.877,
        });
        updateUser(u);

        // Fetch ratings
        return api.get(`/ratings/user/${u.id}`);
      })
      .then((res) => {
        setRatings(res.data);
      })
      .catch((err) => console.error('Failed to load profile data', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await api.put('/auth/profile', {
        name: formData.name,
        phone: formData.phone,
        businessName: formData.businessName,
        address: formData.address,
        lat: Number(formData.lat),
        lng: Number(formData.lng),
      });
      updateUser(res.data);
      setSuccessMsg('Profile and location settings updated successfully!');
    } catch (err: any) {
      console.error('Update profile error', err);
      setErrorMsg(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header Info */}
      <div className="bg-[#1A1330] border border-[#2B1F4D] rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-400 p-0.5 shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-[#0F0B1A] rounded-[14px] flex items-center justify-center text-purple-400 text-2xl font-black">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">{user.businessName || user.name}</h1>
              {user.verified && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  <ShieldCheck size={12} /> Verified Merchant
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="bg-[#0F0B1A]/60 px-5 py-3 rounded-2xl border border-[#2B1F4D]/50 text-right sm:text-right w-full sm:w-auto">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Merchant Trust Score</span>
          <div className="flex items-center gap-2 mt-0.5">
            <RatingStars rating={user.rating || 5} size={18} />
            <span className="text-xs text-slate-400">({ratings.length} reviews)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Settings Form */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="bg-[#1A1330] border border-[#2B1F4D] rounded-3xl p-6 sm:p-8 shadow-xl space-y-5"
          >
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 size={18} className="text-purple-400" />
              Business & Location Settings
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Person Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Business / Firm Name</label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Account Email (Fixed)</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full bg-[#0F0B1A]/50 border border-[#2B1F4D]/40 rounded-xl px-4 py-2 text-sm text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Warehouse / Store Physical Address</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. Unit 4, Wholesale Market Road, Andheri West, Mumbai"
                className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#2B1F4D]/50">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">GPS Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: Number(e.target.value) })}
                  className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl px-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">GPS Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: Number(e.target.value) })}
                  className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl px-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-400 transition-colors"
                />
              </div>
            </div>

            {successMsg && (
              <p className="text-xs text-emerald-300 bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/60 flex items-center gap-1.5">
                <CheckCircle size={15} /> {successMsg}
              </p>
            )}
            {errorMsg && (
              <p className="text-xs text-rose-300 bg-rose-950/40 p-3 rounded-xl border border-rose-800/60">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 px-4 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-navy-950 font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Ratings & Feedback List */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Star size={18} className="text-amber-400 fill-amber-400" />
            Trade Reviews ({ratings.length})
          </h2>

          {ratings.length === 0 ? (
            <div className="bg-[#1A1330] border border-[#2B1F4D] rounded-2xl p-6 text-center text-xs text-slate-400">
              No ratings recorded yet. Complete handovers to earn ratings.
            </div>
          ) : (
            <div className="space-y-3">
              {ratings.map((r) => (
                <div
                  key={r.id}
                  className="bg-[#1A1330] border border-[#2B1F4D] rounded-2xl p-4 space-y-2 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      {r.fromUser?.businessName || r.fromUser?.name || 'Verified Merchant'}
                    </span>
                    <RatingStars rating={r.score} size={12} />
                  </div>
                  {r.comment && (
                    <p className="text-xs text-slate-300 italic bg-[#0F0B1A]/50 p-2.5 rounded-xl border border-[#2B1F4D]/30">
                      "{r.comment}"
                    </p>
                  )}
                  <span className="text-[10px] text-slate-500 block text-right">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
