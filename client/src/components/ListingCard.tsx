import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Layers,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import type { Listing } from '../types';
import { UrgencyBadge, StatusBadge } from './StatusBadges';
import { RatingStars } from './RatingStars';
import { useAuthStore } from '../stores/authStore';

const CATEGORY_COLORS: Record<string, string> = {
  Groceries: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40',
  Stationery: 'from-blue-500/20 to-indigo-500/20 text-blue-300 border-blue-500/40',
  Electronics: 'from-fuchsia-500/20 to-violet-500/20 text-fuchsia-300 border-fuchsia-500/40',
  Packaging: 'from-emerald-500/20 to-green-500/20 text-emerald-300 border-emerald-500/40',
  Textiles: 'from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/40',
  Hardware: 'from-slate-500/20 to-zinc-500/20 text-slate-300 border-slate-500/40',
};

export const ListingCard: React.FC<{ listing: Listing; distanceKm?: number }> = ({
  listing,
  distanceKm,
}) => {
  const user = useAuthStore((state) => state.user);
  const isMine = user?.id === listing.sellerId;
  const categoryStyle =
    CATEGORY_COLORS[listing.category] ||
    'from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/40';

  const totalBatchPrice = listing.quantity * listing.pricePerUnit;

  let daysRemaining: number | null = null;
  if (listing.expiryDate) {
    const diff = new Date(listing.expiryDate).getTime() - Date.now();
    daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="group bg-[#1A1330] hover:bg-[#231845] border border-[#2B1F4D] hover:border-purple-400/50 rounded-2xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
      {/* Top Accent Gradient Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-400 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Header Tags */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-gradient-to-r ${categoryStyle}`}
          >
            {listing.category}
          </span>
          <div className="flex items-center gap-1.5">
            <UrgencyBadge urgency={listing.urgency} />
            {listing.status !== 'active' && <StatusBadge status={listing.status} />}
          </div>
        </div>

        {/* Title */}
        <Link to={`/listings/${listing.id}`} className="block group-hover:text-purple-300 transition-colors">
          <h3 className="font-bold text-white text-lg leading-snug line-clamp-2">
            {listing.title}
          </h3>
        </Link>

        {/* Seller Info */}
        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-300 pb-3 border-b border-[#2B1F4D]/60">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-medium text-slate-200 truncate">
              {listing.seller?.businessName || listing.seller?.name || 'Verified Merchant'}
            </span>
            {isMine && (
              <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30">
                You
              </span>
            )}
          </div>
          {listing.seller && (
            <RatingStars rating={listing.seller.rating} size={13} />
          )}
        </div>

        {/* Inventory Details Grid */}
        <div className="grid grid-cols-2 gap-3 my-4 bg-[#0F0B1A]/60 p-3 rounded-xl border border-[#2B1F4D]/40">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Available Lot</span>
            <p className="text-sm font-bold text-white flex items-center gap-1 mt-0.5">
              <Layers size={14} className="text-purple-400" />
              {listing.quantity} <span className="text-xs font-normal text-slate-400">{listing.unit}</span>
            </p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Unit Price</span>
            <p className="text-sm font-bold text-emerald-400 mt-0.5">
              ₹{listing.pricePerUnit.toLocaleString('en-IN')}{' '}
              <span className="text-[10px] font-normal text-slate-400">/{listing.unit}</span>
            </p>
          </div>
        </div>

        {/* Secondary Info: Total Value, Expiry, Distance */}
        <div className="space-y-1.5 text-xs text-slate-400 mb-4">
          <div className="flex items-center justify-between">
            <span>Estimated Batch Value:</span>
            <span className="font-semibold text-slate-200">
              ₹{totalBatchPrice.toLocaleString('en-IN')}
            </span>
          </div>

          {daysRemaining !== null && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-amber-400" /> Expiry Window:
              </span>
              <span
                className={`font-semibold ${
                  daysRemaining <= 3
                    ? 'text-rose-400 font-bold animate-pulse'
                    : daysRemaining <= 14
                    ? 'text-amber-300'
                    : 'text-slate-300'
                }`}
              >
                {daysRemaining <= 0 ? 'Expiring Today' : `${daysRemaining} days left`}
              </span>
            </div>
          )}

          {(distanceKm !== undefined || listing.distanceKm !== undefined) && (() => {
            const rawDist = distanceKm ?? listing.distanceKm;
            if (rawDist === undefined || rawDist === null) return null;
            const displayDist = rawDist < 0.8 ? '< 1 km away' : `${rawDist.toFixed(1)} km away`;
            return (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MapPin size={13} className="text-pink-400" /> Proximity:
                </span>
                <span className="font-semibold text-pink-300">
                  {displayDist}
                </span>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-2">
        <Link
          to={`/listings/${listing.id}`}
          className="w-full py-2.5 px-4 bg-purple-500/10 hover:bg-purple-500 border border-purple-500/30 hover:border-purple-500 text-purple-300 hover:text-navy-950 font-semibold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm group/btn"
        >
          <span>{isMine ? 'Manage Listing' : 'View & Reserve'}</span>
          <ArrowUpRight size={16} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
