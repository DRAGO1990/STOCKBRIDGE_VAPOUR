import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  Clock,
  Trash2,
  Eye,
  Layers,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import api from '../lib/api';
import type { Listing } from '../types';
import { UrgencyBadge, StatusBadge } from '../components/StatusBadges';

export const MyListingsPage: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'other'>('all');

  const fetchListings = () => {
    setLoading(true);
    api
      .get('/listings/my/all')
      .then((res) => {
        setListings(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load my listings', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleDeactivate = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this listing?')) return;
    try {
      await api.delete(`/listings/${id}`);
      fetchListings();
    } catch (err) {
      console.error('Failed to deactivate listing', err);
    }
  };

  const filteredListings = listings.filter((l) => {
    if (filter === 'active') return l.status === 'active' && l.active;
    if (filter === 'other') return l.status !== 'active' || !l.active;
    return true;
  });

  const activeCount = listings.filter((l) => l.status === 'active' && l.active).length;
  const reservedCount = listings.filter((l) => l.status === 'reserved').length;
  const soldCount = listings.filter((l) => l.status === 'sold').length;

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Package className="text-purple-400" />
            My Surplus Listings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track your surplus inventory, manage active listings, and monitor reservations from one place.
          </p>
        </div>

        <Link
          to="/create-listing"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-navy-950 font-bold text-sm rounded-xl shadow-lg shadow-purple-500/20 transition-all"
        >
          <PlusCircle size={18} />
          Post New Lot
        </Link>
      </div>

      {/* Metrics Summary Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1A1330] border border-[#2B1F4D] p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 uppercase font-semibold block">Active Marketplace Lots</span>
          <p className="text-2xl font-extrabold text-purple-400 mt-1">{activeCount}</p>
        </div>
        <div className="bg-[#1A1330] border border-[#2B1F4D] p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 uppercase font-semibold block">Under Reservation</span>
          <p className="text-2xl font-extrabold text-sky-400 mt-1">{reservedCount}</p>
        </div>
        <div className="bg-[#1A1330] border border-[#2B1F4D] p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 uppercase font-semibold block">Completed / Liquidated</span>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{soldCount}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2B1F4D]/60 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All Lots ({listings.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            filter === 'active'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          onClick={() => setFilter('other')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            filter === 'other'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Reserved / Sold / Inactive
        </button>
      </div>

      {/* Listings Table / Cards */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-400"></div>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-[#1A1330] border border-[#2B1F4D] rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
          <Package size={36} className="text-purple-400/50 mx-auto" />
          <h3 className="text-lg font-bold text-white">No listings found</h3>
          <p className="text-xs text-slate-400">
            You don't have any surplus listings in this view.
          </p>
          <Link
            to="/create-listing"
            className="inline-block px-4 py-2 bg-purple-500 text-navy-950 font-bold text-xs rounded-xl mt-2"
          >
            Post Your First Lot
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <div
              key={listing.id}
              className="bg-[#1A1330] border border-[#2B1F4D] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    {listing.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <UrgencyBadge urgency={listing.urgency} />
                    <StatusBadge status={listing.status} />
                  </div>
                </div>

                <h3 className="font-bold text-white text-base line-clamp-2">
                  {listing.title}
                </h3>

                <div className="grid grid-cols-2 gap-2 bg-[#0F0B1A]/60 p-3 rounded-xl border border-[#2B1F4D]/40 text-xs my-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Available Lot</span>
                    <span className="font-bold text-white">{listing.quantity} {listing.unit}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Unit Price</span>
                    <span className="font-bold text-emerald-400">₹{listing.pricePerUnit}/{listing.unit}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Total Value:</span>
                    <span className="font-semibold text-slate-200">
                      ₹{(listing.quantity * listing.pricePerUnit).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {listing._count?.reservations !== undefined && (
                    <div className="flex justify-between text-pink-300">
                      <span>Buyer Inquiries / Reservations:</span>
                      <span className="font-bold">{listing._count.reservations}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-[#2B1F4D]/60 flex items-center justify-between gap-2">
                <Link
                  to={`/listings/${listing.id}`}
                  className="flex-1 py-2 px-3 bg-[#2B1F4D] hover:bg-[#2B1F4D] text-slate-200 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-1 transition-colors"
                >
                  <Eye size={14} /> View Details
                </Link>
                {listing.status === 'active' && listing.active && (
                  <button
                    onClick={() => handleDeactivate(listing.id)}
                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition-colors"
                    title="Deactivate Lot"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
