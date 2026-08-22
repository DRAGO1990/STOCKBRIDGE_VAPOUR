import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  CalendarCheck,
  MessageSquare,
  CheckCircle,
  XCircle,
  CheckCircle2,
  Star,
  Layers,
  Building2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileImage,
} from 'lucide-react';
import api from '../lib/api';
import type { Reservation } from '../types';
import { StatusBadge } from '../components/StatusBadges';
import { ChatModal } from '../components/ChatModal';
import { RateModal } from '../components/RateModal';
import { ProofUploadModal } from '../components/ProofUploadModal';
import { useAuthStore } from '../stores/authStore';

export const ReservationsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);

  const [tab, setTab] = useState<'buying' | 'selling'>('buying');
  const [buyingReservations, setBuyingReservations] = useState<Reservation[]>([]);
  const [sellingReservations, setSellingReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [activeChatRes, setActiveChatRes] = useState<Reservation | null>(null);
  const [activeRateRes, setActiveRateRes] = useState<Reservation | null>(null);
  const [activeProofRes, setActiveProofRes] = useState<Reservation | null>(null);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const [buyingRes, sellingRes] = await Promise.all([
        api.get('/reservations/my/buying'),
        api.get('/reservations/my/selling'),
      ]);
      setBuyingReservations(buyingRes.data);
      setSellingReservations(sellingRes.data);

      // Auto-open chat if URL has active query parameter
      const activeId = searchParams.get('active');
      if (activeId) {
        const found =
          buyingRes.data.find((r: Reservation) => r.id === activeId) ||
          sellingRes.data.find((r: Reservation) => r.id === activeId);
        if (found) {
          setActiveChatRes(found);
        }
      }
    } catch (err) {
      console.error('Failed to load reservations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleConfirm = async (id: string) => {
    try {
      await api.post(`/reservations/${id}/confirm`);
      fetchReservations();
    } catch (err) {
      console.error('Failed to confirm', err);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this reservation? The inventory lot will be restored.')) return;
    try {
      await api.post(`/reservations/${id}/cancel`);
      fetchReservations();
    } catch (err) {
      console.error('Failed to cancel', err);
    }
  };

  const currentList = tab === 'buying' ? buyingReservations : sellingReservations;

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
          <CalendarCheck className="text-teal-400" />
          Trade Reservations & Orders
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Coordinate inventory handover, negotiate logistics in direct chat, and confirm completed transactions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-[#3f4b81]/60 pb-3">
        <button
          onClick={() => setTab('buying')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            tab === 'buying'
              ? 'bg-teal-500 text-navy-950 shadow-md shadow-teal-500/20'
              : 'bg-[#1b2151] text-slate-300 hover:text-white border border-[#3f4b81]'
          }`}
        >
          <span>Orders Placed (Buying)</span>
          <span className="px-2 py-0.2 bg-black/20 text-xs rounded-full">
            {buyingReservations.length}
          </span>
        </button>

        <button
          onClick={() => setTab('selling')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            tab === 'selling'
              ? 'bg-teal-500 text-navy-950 shadow-md shadow-teal-500/20'
              : 'bg-[#1b2151] text-slate-300 hover:text-white border border-[#3f4b81]'
          }`}
        >
          <span>Orders Received (Selling)</span>
          <span className="px-2 py-0.2 bg-black/20 text-xs rounded-full">
            {sellingReservations.length}
          </span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-400"></div>
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-[#1b2151] border border-[#3f4b81] rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
          <CalendarCheck size={36} className="text-teal-400/50 mx-auto" />
          <h3 className="text-lg font-bold text-white">No reservations in this tab</h3>
          <p className="text-xs text-slate-400">
            {tab === 'buying'
              ? 'You have not reserved any surplus items yet. Browse marketplace to find deals.'
              : 'No buyers have placed reservations on your surplus lots yet.'}
          </p>
          {tab === 'buying' && (
            <Link
              to="/"
              className="inline-block px-4 py-2 bg-teal-500 text-navy-950 font-bold text-xs rounded-xl mt-2"
            >
              Browse Surplus Marketplace
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((res) => {
            const counterparty =
              tab === 'buying'
                ? res.listing?.seller || { name: 'Seller', businessName: 'Seller Wholesale', rating: 5 }
                : res.buyer || { name: 'Buyer', businessName: 'Buyer Business', rating: 5 };

            const toUserId = tab === 'buying' ? res.listing?.sellerId : res.buyerId;

            return (
              <div
                key={res.id}
                className="bg-[#1b2151] border border-[#3f4b81] hover:border-teal-400/40 rounded-2xl p-5 sm:p-6 shadow-xl transition-all space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#3f4b81]/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-sm">
                      #{res.id.substring(0, 5)}
                    </div>
                    <div>
                      <Link
                        to={`/listings/${res.listingId}`}
                        className="font-bold text-white text-base hover:text-teal-300 transition-colors"
                      >
                        {res.listing?.title || 'Surplus Item'}
                      </Link>
                      <p className="text-xs text-slate-400">
                        Reserved on {new Date(res.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={res.status} />
                  </div>
                </div>

                {/* Body Row: Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#0f1329]/60 p-4 rounded-xl border border-[#3f4b81]/40 text-xs">
                  <div>
                    <span className="text-slate-400 block uppercase font-semibold text-[10px]">
                      Agreed Reserved Quantity
                    </span>
                    <span className="text-sm font-bold text-white flex items-center gap-1 mt-0.5">
                      <Layers size={14} className="text-teal-400" />
                      {res.agreedQty} {res.listing?.unit || 'units'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block uppercase font-semibold text-[10px]">
                      Total Agreed Value
                    </span>
                    <span className="text-sm font-extrabold text-emerald-400 mt-0.5 block">
                      ₹{res.agreedPrice.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block uppercase font-semibold text-[10px]">
                      {tab === 'buying' ? 'Seller Merchant' : 'Buyer Merchant'}
                    </span>
                    <span className="text-sm font-bold text-cyan-300 mt-0.5 block truncate">
                      {counterparty.businessName || counterparty.name}
                    </span>
                  </div>
                </div>

                {/* Proof photo banner if completed */}
                {res.proofPhoto && (
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300">
                    <FileImage size={16} />
                    <span>Proof of Handover verified on file</span>
                    <a
                      href={res.proofPhoto}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-auto underline font-semibold hover:text-white"
                    >
                      View Photo
                    </a>
                  </div>
                )}

                {/* Actions Row */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  {/* Left: Direct Chat CTA */}
                  <button
                    onClick={() => setActiveChatRes(res)}
                    className="px-4 py-2 bg-[#293264] hover:bg-teal-500 text-teal-300 hover:text-navy-950 border border-teal-500/40 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare size={15} />
                    <span>Open Direct Trade Chat</span>
                  </button>

                  {/* Right: State Mutation Actions */}
                  <div className="flex items-center gap-2">
                    {/* Seller Confirm Pending */}
                    {tab === 'selling' && res.status === 'pending' && (
                      <button
                        onClick={() => handleConfirm(res.id)}
                        className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-navy-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle size={14} /> Confirm Reservation
                      </button>
                    )}

                    {/* Complete Handover (Available when confirmed) */}
                    {res.status === 'confirmed' && (
                      <button
                        onClick={() => setActiveProofRes(res)}
                        className="px-3.5 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-navy-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-teal-500/20 flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 size={14} /> Complete Handover
                      </button>
                    )}

                    {/* Rate Counterparty (Available when completed) */}
                    {res.status === 'completed' && (
                      <button
                        onClick={() => setActiveRateRes(res)}
                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-navy-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-1 cursor-pointer"
                      >
                        <Star size={14} className="fill-navy-950" /> Rate Counterparty
                      </button>
                    )}

                    {/* Cancel Action */}
                    {(res.status === 'pending' || res.status === 'confirmed') && (
                      <button
                        onClick={() => handleCancel(res.id)}
                        className="px-3 py-2 bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Direct Socket Chat Modal */}
      {activeChatRes && (
        <ChatModal
          reservationId={activeChatRes.id}
          isOpen={Boolean(activeChatRes)}
          onClose={() => setActiveChatRes(null)}
          title={`Order #${activeChatRes.id.substring(0, 5)}: ${activeChatRes.listing?.title}`}
          counterpartyName={
            tab === 'buying'
              ? activeChatRes.listing?.seller?.businessName || 'Seller'
              : activeChatRes.buyer?.businessName || 'Buyer'
          }
        />
      )}

      {/* Review / Rating Modal */}
      {activeRateRes && (
        <RateModal
          reservationId={activeRateRes.id}
          toUserId={tab === 'buying' ? activeRateRes.listing.sellerId : activeRateRes.buyerId}
          toUserName={
            tab === 'buying'
              ? activeRateRes.listing?.seller?.businessName || 'Seller'
              : activeRateRes.buyer?.businessName || 'Buyer'
          }
          isOpen={Boolean(activeRateRes)}
          onClose={() => setActiveRateRes(null)}
          onSuccess={fetchReservations}
        />
      )}

      {/* Handover Complete with Proof Photo Modal */}
      {activeProofRes && (
        <ProofUploadModal
          reservationId={activeProofRes.id}
          isOpen={Boolean(activeProofRes)}
          onClose={() => setActiveProofRes(null)}
          onSuccess={fetchReservations}
        />
      )}
    </div>
  );
};
