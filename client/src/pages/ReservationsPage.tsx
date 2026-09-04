import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  MessageSquare, CheckCircle, CheckCircle2, Star, FileImage, Package, X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import type { Reservation } from '../types';
import { StatusBadge } from '../components/StatusBadges';
import { ChatModal } from '../components/ChatModal';
import { RateModal } from '../components/RateModal';
import { ProofUploadModal } from '../components/ProofUploadModal';
import { useAuthStore } from '../stores/authStore';

const labelStyle: React.CSSProperties = {
  fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 600,
  letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--sb-text-muted, #7A847A)', marginBottom: 4, display: 'block',
};

export const ReservationsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const user = useAuthStore(s => s.user);

  const [tab, setTab] = useState<'buying' | 'selling'>('buying');
  const [buyingReservations, setBuyingReservations] = useState<Reservation[]>([]);
  const [sellingReservations, setSellingReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeChatRes, setActiveChatRes]   = useState<Reservation | null>(null);
  const [activeRateRes, setActiveRateRes]   = useState<Reservation | null>(null);
  const [activeProofRes, setActiveProofRes] = useState<Reservation | null>(null);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const [b, s] = await Promise.all([api.get('/reservations/my/buying'), api.get('/reservations/my/selling')]);
      setBuyingReservations(b.data);
      setSellingReservations(s.data);
      const activeId = searchParams.get('active');
      if (activeId) {
        const found = b.data.find((r: Reservation) => r.id === activeId) || s.data.find((r: Reservation) => r.id === activeId);
        if (found) setActiveChatRes(found);
      }
    } catch { /* noop */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchReservations(); }, []);

  const handleConfirm = async (id: string) => {
    try { await api.post(`/reservations/${id}/confirm`); fetchReservations(); } catch { /* noop */ }
  };
  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this reservation?')) return;
    try { await api.post(`/reservations/${id}/cancel`); fetchReservations(); } catch { /* noop */ }
  };

  const currentList = tab === 'buying' ? buyingReservations : sellingReservations;
  const pendingCount = currentList.filter(r => r.status === 'pending').length;

  return (
    <div style={{ background: 'var(--sb-background, #F7F7F2)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 32, color: 'var(--sb-text-primary, #182018)', marginBottom: 8, letterSpacing: '-0.01em' }}>
            Orders & Reservations
          </h1>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: 'var(--sb-text-secondary, #4F5A51)' }}>
            Coordinate handovers, chat with counterparties, and track all trade activity.
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--sb-border, #D8E0D5)', marginBottom: 28 }} />

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--sb-border, #D8E0D5)', marginBottom: 24 }}>
          {([
            { key: 'buying' as const,  label: `Buying (${buyingReservations.length})` },
            { key: 'selling' as const, label: `Selling (${sellingReservations.length})` },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '10px 20px',
                fontFamily: 'Work Sans, sans-serif', fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
                color: tab === t.key ? 'var(--sb-primary, #6F8F69)' : 'var(--sb-text-secondary, #4F5A51)',
                background: 'transparent', border: 'none',
                borderBottom: `2px solid ${tab === t.key ? 'var(--sb-primary, #6F8F69)' : 'transparent'}`,
                cursor: 'pointer', marginBottom: -1, transition: 'all 0.12s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div style={{ width: 32, height: 32, border: '2px solid var(--sb-border, #D8E0D5)', borderTopColor: 'var(--sb-primary, #6F8F69)', borderRadius: '50%' }} className="animate-stitch-spin" />
          </div>
        ) : currentList.length === 0 ? (
          <div style={{ background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 8, padding: '60px 24px', textAlign: 'center' }}>
            <Package size={36} color="var(--sb-border-strong, #BEC9BA)" style={{ margin: '0 auto 16px', display: 'block' }} />
            <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, color: 'var(--sb-text-primary, #182018)', marginBottom: 8 }}>
              {tab === 'buying' ? 'No orders placed yet' : 'No orders received yet'}
            </p>
            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: 'var(--sb-text-muted, #7A847A)', marginBottom: 20 }}>
              {tab === 'buying' ? 'Browse the marketplace and reserve a lot.' : 'Buyers will reserve your listed lots.'}
            </p>
            {tab === 'buying' && (
              <Link to="/" className="stitch-btn-primary" style={{ display: 'inline-block', padding: '10px 24px', textDecoration: 'none', borderRadius: 4 }}>
                Browse Marketplace
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {currentList.map((res, i) => {
              const counterparty = tab === 'buying'
                ? (res.listing?.seller || { name: 'Seller', businessName: 'Seller Wholesale' })
                : (res.buyer || { name: 'Buyer', businessName: 'Buyer Business' });

              return (
                <motion.div
                  key={res.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{ background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
                >
                  {/* Card header */}
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--sb-border, #D8E0D5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <Link
                        to={`/listings/${res.listingId}`}
                        style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--sb-text-primary, #182018)', textDecoration: 'none', transition: 'color 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--sb-primary, #6F8F69)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--sb-text-primary, #182018)'; }}
                      >
                        {res.listing?.title || 'Surplus Item'}
                      </Link>
                      <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-muted, #7A847A)', marginTop: 2 }}>
                        Reserved {new Date(res.createdAt).toLocaleDateString()} · #SB-{res.id.substring(0, 8).toUpperCase()}
                      </p>
                    </div>
                    <StatusBadge status={res.status} />
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: 'var(--sb-border, #D8E0D5)', margin: '0' }}>
                    <div style={{ background: 'var(--sb-surface, #FFFFFF)', padding: '14px 20px' }}>
                      <p style={labelStyle}>Quantity</p>
                      <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--sb-text-primary, #182018)' }}>
                        {res.agreedQty} {res.listing?.unit || 'units'}
                      </p>
                    </div>
                    <div style={{ background: 'var(--sb-surface, #FFFFFF)', padding: '14px 20px' }}>
                      <p style={labelStyle}>Agreed Value</p>
                      <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--sb-primary, #6F8F69)' }}>
                        ₹{res.agreedPrice.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div style={{ background: 'var(--sb-surface, #FFFFFF)', padding: '14px 20px' }}>
                      <p style={labelStyle}>{tab === 'buying' ? 'Seller' : 'Buyer'}</p>
                      <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--sb-text-primary, #182018)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {counterparty.businessName || counterparty.name}
                      </p>
                    </div>
                  </div>

                  {/* Proof photo banner */}
                  {res.proofPhoto && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'var(--sb-primary-pale, #EAF1E7)', borderTop: '1px solid var(--sb-primary-soft, #DCE8D8)' }}>
                      <FileImage size={14} color="var(--sb-primary, #6F8F69)" />
                      <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-primary, #6F8F69)', flex: 1 }}>Handover proof on file</span>
                      <a href={res.proofPhoto} target="_blank" rel="noreferrer" style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 700, color: 'var(--sb-primary, #6F8F69)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        View Photo
                      </a>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <button
                      onClick={() => setActiveChatRes(res)}
                      className="stitch-btn-ghost"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 12 }}
                    >
                      <MessageSquare size={13} /> Open Chat
                    </button>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {tab === 'selling' && res.status === 'pending' && (
                        <button
                          onClick={() => handleConfirm(res.id)}
                          className="stitch-btn-primary"
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 12 }}
                        >
                          <CheckCircle size={13} /> Confirm
                        </button>
                      )}
                      {res.status === 'confirmed' && (
                        <button
                          onClick={() => setActiveProofRes(res)}
                          className="stitch-btn-primary"
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 12 }}
                        >
                          <CheckCircle2 size={13} /> Mark Handover Complete
                        </button>
                      )}
                      {res.status === 'completed' && (
                        <button
                          onClick={() => setActiveRateRes(res)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                            background: 'rgba(184,138,69,0.1)', border: '1px solid rgba(184,138,69,0.25)',
                            borderRadius: 4, color: 'var(--sb-warning, #B88A45)', fontFamily: 'Work Sans, sans-serif',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          <Star size={13} /> Rate Counterparty
                        </button>
                      )}
                      {(res.status === 'pending' || res.status === 'confirmed') && (
                        <button
                          onClick={() => handleCancel(res.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px',
                            background: 'transparent', border: '1px solid var(--sb-border, #D8E0D5)',
                            borderRadius: 4, color: 'var(--sb-text-muted, #7A847A)', fontFamily: 'Work Sans, sans-serif',
                            fontSize: 12, cursor: 'pointer', transition: 'color 0.12s',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--sb-danger, #A65C55)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--sb-text-muted, #7A847A)'; }}
                        >
                          <X size={13} /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Modals */}
        {activeChatRes && (
          <ChatModal
            reservationId={activeChatRes.id}
            isOpen={!!activeChatRes}
            onClose={() => setActiveChatRes(null)}
            title={`${activeChatRes.listing?.title || 'Surplus Item'}`}
            counterpartyName={tab === 'buying' ? (activeChatRes.listing?.seller?.businessName || 'Seller') : (activeChatRes.buyer?.businessName || 'Buyer')}
          />
        )}
        {activeRateRes && (
          <RateModal
            reservationId={activeRateRes.id}
            toUserId={tab === 'buying' ? activeRateRes.listing.sellerId : activeRateRes.buyerId}
            toUserName={tab === 'buying' ? (activeRateRes.listing?.seller?.businessName || 'Seller') : (activeRateRes.buyer?.businessName || 'Buyer')}
            isOpen={!!activeRateRes}
            onClose={() => setActiveRateRes(null)}
            onSuccess={fetchReservations}
          />
        )}
        {activeProofRes && (
          <ProofUploadModal
            reservationId={activeProofRes.id}
            isOpen={!!activeProofRes}
            onClose={() => setActiveProofRes(null)}
            onSuccess={fetchReservations}
          />
        )}
      </div>
    </div>
  );
};
