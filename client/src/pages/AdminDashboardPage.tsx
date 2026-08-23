import React, { useEffect, useState } from 'react';
import {
  Shield,
  Users,
  Package,
  CalendarCheck,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Search,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import api from '../lib/api';
import type { AdminStats, User, Listing } from '../types';
import { StatusBadge } from '../components/StatusBadges';
import { RatingStars } from '../components/RatingStars';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'listings'>('users');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, listingsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/listings'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setListings(listingsRes.data);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleUser = async (id: string) => {
    try {
      await api.post(`/admin/users/${id}/toggle`);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u))
      );
    } catch (err) {
      console.error('Failed to toggle user', err);
    }
  };

  const handleToggleListing = async (id: string) => {
    try {
      const res = await api.post(`/admin/listings/${id}/toggle`);
      setListings((prev) =>
        prev.map((l) =>
          l.id === id ? { ...l, active: res.data.active, status: res.data.status } : l
        )
      );
    } catch (err) {
      console.error('Failed to toggle listing', err);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.businessName && u.businessName.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredListings = listings.filter(
    (l) =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-2">
          <Shield size={14} className="text-rose-400" />
          Restricted Administrative Portal
        </div>
        <h1 className="text-3xl font-extrabold text-white">StockBridge Admin Command Center</h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor platform liquidity metrics, manage merchant verifications, and moderate surplus inventory.
        </p>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#1A1330] border border-[#2B1F4D] p-5 rounded-2xl shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Users size={24} />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase">Total Users</span>
              <p className="text-2xl font-extrabold text-white mt-0.5">{stats.users}</p>
            </div>
          </div>

          <div className="bg-[#1A1330] border border-[#2B1F4D] p-5 rounded-2xl shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <Package size={24} />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase">Active Lots</span>
              <p className="text-2xl font-extrabold text-pink-300 mt-0.5">{stats.listings}</p>
            </div>
          </div>

          <div className="bg-[#1A1330] border border-[#2B1F4D] p-5 rounded-2xl shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <CalendarCheck size={24} />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase">Reservations</span>
              <p className="text-2xl font-extrabold text-amber-400 mt-0.5">{stats.reservations}</p>
            </div>
          </div>

          <div className="bg-[#1A1330] border border-[#2B1F4D] p-5 rounded-2xl shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle size={24} />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase">Completed Trades</span>
              <p className="text-2xl font-extrabold text-emerald-400 mt-0.5">{stats.completed}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="bg-[#1A1330] border border-[#2B1F4D] rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-purple-500 text-navy-950 shadow-md'
                  : 'bg-[#0F0B1A] text-slate-300 hover:text-white border border-[#2B1F4D]'
              }`}
            >
              Merchant Accounts ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('listings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'listings'
                  ? 'bg-purple-500 text-navy-950 shadow-md'
                  : 'bg-[#0F0B1A] text-slate-300 hover:text-white border border-[#2B1F4D]'
              }`}
            >
              Surplus Listings ({listings.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter table..."
              className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>

        {/* Content Tables */}
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-400"></div>
          </div>
        ) : activeTab === 'users' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0F0B1A] text-slate-400 uppercase font-semibold text-[10px] border-b border-[#2B1F4D]">
                <tr>
                  <th className="py-3 px-4">Merchant / Contact</th>
                  <th className="py-3 px-4">Email / Phone</th>
                  <th className="py-3 px-4">Trust Rating</th>
                  <th className="py-3 px-4">Lots / Res</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B1F4D]/40">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#231845]/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white block">{u.businessName || u.name}</span>
                      <span className="text-[10px] text-slate-400">{u.name} {u.isAdmin && '(Admin)'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-200 block">{u.email}</span>
                      <span className="text-[10px] text-slate-400">{u.phone || 'No phone'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <RatingStars rating={u.rating || 0} size={12} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span>{u._count?.listings || 0} lots / {u._count?.reservations || 0} orders</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          u.active !== false
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {u.active !== false ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleUser(u.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          u.active !== false
                            ? 'bg-rose-950/40 text-rose-300 hover:bg-rose-900 border border-rose-800'
                            : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900 border border-emerald-800'
                        }`}
                      >
                        {u.active !== false ? 'Suspend User' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0F0B1A] text-slate-400 uppercase font-semibold text-[10px] border-b border-[#2B1F4D]">
                <tr>
                  <th className="py-3 px-4">Batch Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Quantity & Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B1F4D]/40">
                {filteredListings.map((l) => (
                  <tr key={l.id} className="hover:bg-[#231845]/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white block">{l.title}</span>
                      <span className="text-[10px] text-slate-400">Listing #SB-{l.id.substring(0, 8).toUpperCase()}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-semibold">
                        {l.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-white font-semibold block">{l.quantity} {l.unit}</span>
                      <span className="text-[10px] text-emerald-400">₹{l.pricePerUnit}/{l.unit}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleListing(l.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          l.active
                            ? 'bg-amber-950/40 text-amber-300 hover:bg-amber-900 border border-amber-800'
                            : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900 border border-emerald-800'
                        }`}
                      >
                        {l.active ? 'Expire Lot' : 'Activate Lot'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
