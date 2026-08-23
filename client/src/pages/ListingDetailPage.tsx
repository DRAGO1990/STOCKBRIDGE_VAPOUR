import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Layers,
  MapPin,
  ShieldCheck,
  Building2,
  Trash2,
  Lock,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import api from '../lib/api';
import type { Listing } from '../types';
import { useAuthStore } from '../stores/authStore';
import { UrgencyBadge, StatusBadge } from '../components/StatusBadges';
import { RatingStars } from '../components/RatingStars';

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reservation state
  const [reserveQty, setReserveQty] = useState<number>(0);
  const [isReserving, setIsReserving] = useState(false);
  const [reserveError, setReserveError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/listings/${id}`)
      .then((res) => {
        setListing(res.data);
        setReserveQty(res.data.quantity);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load listing', err);
        setError('Listing not found or has been deactivated.');
        setLoading(false);
      });
  }, [id]);

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!listing) return;

    if (reserveQty <= 0 || reserveQty > listing.quantity) {
      setReserveError(`Please enter a quantity between 1 and ${listing.quantity}`);
      return;
    }

    setIsReserving(true);
    setReserveError('');

    try {
      const calculatedPrice = reserveQty * listing.pricePerUnit;
      const res = await api.post('/reservations', {
        listingId: listing.id,
        agreedQty: Number(reserveQty),
        agreedPrice: calculatedPrice,
      });

      // Redirect to reservations page
      navigate(`/reservations?active=${res.data.id}`);
    } catch (err: any) {
      console.error('Reservation error', err);
      setReserveError(err.response?.data?.error || 'Failed to place reservation.');
      setIsReserving(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!listing || !confirm('Are you sure you want to deactivate this listing?')) return;
    try {
      await api.delete(`/listings/${listing.id}`);
      navigate('/my-listings');
    } catch (err) {
      console.error('Failed to delete listing', err);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="bg-[#1A1330] border border-[#2B1F4D] rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4 my-10">
        <AlertTriangle className="text-rose-400 mx-auto" size={36} />
        <h2 className="text-xl font-bold text-white">Listing Unavailable</h2>
        <p className="text-sm text-slate-400">{error || 'This listing does not exist.'}</p>
        <Link
          to="/"
          className="inline-block px-5 py-2.5 bg-purple-500 text-navy-950 font-bold text-sm rounded-xl shadow-md"
        >
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const isMine = user?.id === listing.sellerId;
  const totalPrice = reserveQty * listing.pricePerUnit;

  let daysRemaining: number | null = null;
  if (listing.expiryDate) {
    const diff = new Date(listing.expiryDate).getTime() - Date.now();
    daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Back navigation */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-[#1A1330] border border-[#2B1F4D] px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Listings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Main Listing Info & Seller Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card */}
          <div className="bg-[#1A1330] border border-[#2B1F4D] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                {listing.category}
              </span>
              <div className="flex items-center gap-2">
                <UrgencyBadge urgency={listing.urgency} />
                <StatusBadge status={listing.status} />
              </div>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                {listing.title}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Listed on {new Date(listing.createdAt).toLocaleDateString()} • Listing #SB-{listing.id.substring(0, 8).toUpperCase()}
              </p>
            </div>

            {/* Inventory Lot Highlight Box */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-[#0F0B1A]/70 p-5 rounded-2xl border border-[#2B1F4D]/50">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Lot Quantity</span>
                <p className="text-xl font-bold text-white flex items-center gap-1.5 mt-1">
                  <Layers size={18} className="text-purple-400" />
                  {listing.quantity} <span className="text-xs font-normal text-slate-400">{listing.unit}</span>
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Unit Price</span>
                <p className="text-xl font-bold text-emerald-400 mt-1">
                  ₹{listing.pricePerUnit.toLocaleString('en-IN')}{' '}
                  <span className="text-xs font-normal text-slate-400">/{listing.unit}</span>
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Total Lot Valuation</span>
                <p className="text-xl font-bold text-pink-300 mt-1">
                  ₹{(listing.quantity * listing.pricePerUnit).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Expiry Details */}
            {listing.expiryDate && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-amber-300">
                  <Clock size={18} className="text-amber-400" />
                  <div>
                    <span className="font-bold">Expiry Date: </span>
                    <span>{new Date(listing.expiryDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className="font-semibold text-amber-400">
                  {daysRemaining !== null && daysRemaining <= 0
                    ? '⚠️ Expiring today'
                    : `⏳ ${daysRemaining} days remaining`}
                </span>
              </div>
            )}

            {/* Deactivate Button for Owner */}
            {isMine && (
              <div className="pt-4 border-t border-[#2B1F4D]/60 flex items-center justify-between">
                <span className="text-xs text-indigo-300 font-semibold bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/30">
                  You own this listing
                </span>
                <button
                  onClick={handleDeleteListing}
                  className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} /> Deactivate Lot
                </button>
              </div>
            )}
          </div>

          {/* Seller Profile Card */}
          <div className="bg-[#1A1330] border border-[#2B1F4D] rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Building2 size={16} className="text-purple-400" />
              Verified Seller Information
            </h3>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F0B1A]/50 p-4 rounded-2xl border border-[#2B1F4D]/40">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white text-base">
                    {listing.seller?.businessName || listing.seller?.name}
                  </h4>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    <ShieldCheck size={12} /> Verified
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin size={13} className="text-purple-400" />
                  {listing.seller?.address || 'Address provided upon reservation confirmation'}
                </p>
              </div>

              {listing.seller && (
                <div className="sm:text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Merchant Trust Rating</span>
                  <RatingStars rating={listing.seller.rating} size={16} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Immediate Reservation Action Widget */}
        <div className="space-y-6">
          <div className="bg-[#1A1330] border border-[#2B1F4D] rounded-3xl p-6 shadow-2xl sticky top-24 space-y-5">
            <div className="border-b border-[#2B1F4D]/60 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-purple-400" />
                Reserve Inventory
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Zero advance risk. Place reservation to lock lot and open direct trade chat with seller.
              </p>
            </div>

            {listing.status !== 'active' ? (
              <div className="p-4 bg-slate-800/80 rounded-2xl text-center space-y-2 border border-slate-700">
                <Lock className="mx-auto text-slate-400" size={24} />
                <p className="text-sm font-semibold text-slate-300">
                  This lot is currently {listing.status}.
                </p>
                <p className="text-xs text-slate-500">
                  New reservations cannot be created at this time.
                </p>
              </div>
            ) : isMine ? (
              <div className="p-4 bg-indigo-950/40 border border-indigo-800/60 rounded-2xl text-center space-y-2 text-xs text-indigo-300">
                <p className="font-semibold">This is your listing.</p>
                <p className="text-slate-400">Buyers will reserve this lot directly from your post.</p>
              </div>
            ) : (
              <form onSubmit={handleReserve} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Quantity to Reserve ({listing.unit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={listing.quantity}
                    value={reserveQty}
                    onChange={(e) => setReserveQty(Number(e.target.value))}
                    required
                    className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-purple-400 transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Max available in this batch: {listing.quantity} {listing.unit}
                  </span>
                </div>

                {/* Price Breakdown */}
                <div className="bg-[#0F0B1A]/60 p-3.5 rounded-xl border border-[#2B1F4D]/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Agreed Unit Price:</span>
                    <span>₹{listing.pricePerUnit}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Reserved Volume:</span>
                    <span>{reserveQty} {listing.unit}</span>
                  </div>
                  <div className="pt-2 border-t border-[#2B1F4D]/60 flex items-center justify-between text-sm font-extrabold text-purple-300">
                    <span>Total Valuation:</span>
                    <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {reserveError && (
                  <p className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/60">
                    {reserveError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isReserving}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-500 to-pink-400 hover:from-purple-400 hover:to-pink-300 disabled:opacity-50 text-navy-950 font-bold text-sm rounded-xl shadow-lg shadow-purple-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  {isReserving ? 'Confirming Reservation...' : 'Lock Reservation Now'}
                </button>

                <div className="text-[11px] text-slate-400 text-center space-y-1 pt-1">
                  <p className="flex items-center justify-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle size={12} /> Instant 24h Holding Window
                  </p>
                  <p>Direct chat with seller unlocks immediately upon reserve.</p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
