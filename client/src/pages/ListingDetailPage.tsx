import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
  Store,
  AlertTriangle,
  Lock,
  CheckCircle,
  Trash2,
  Calendar,
  Hourglass,
  Clock,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  Plus,
  Minus,
  Check,
  Zap,
  ShoppingCart,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import type { Listing } from '../types';
import { useAuthStore } from '../stores/authStore';
import { RatingStars } from '../components/RatingStars';
import { StatusBadge } from '../components/StatusBadges';

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  Stationery: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=1200&auto=format&fit=crop&q=80',
  Groceries: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=1200&auto=format&fit=crop&q=80',
  'Food & Bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=80',
  'Prepared Food & Bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=80',
  Packaging: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=1200&auto=format&fit=crop&q=80',
  Electronics: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200&auto=format&fit=crop&q=80',
  Textiles: 'https://images.unsplash.com/photo-1528458909336-e7a0adfed0a5?w=1200&auto=format&fit=crop&q=80',
  Hardware: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=1200&auto=format&fit=crop&q=80',
};

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      .catch(() => {
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
      setReserveError(`Enter a quantity between 1 and ${listing.quantity}`);
      return;
    }
    setIsReserving(true);
    setReserveError('');
    try {
      const res = await api.post('/reservations', {
        listingId: listing.id,
        agreedQty: Number(reserveQty),
        agreedPrice: reserveQty * listing.pricePerUnit,
      });
      navigate(`/reservations?active=${res.data.id}`);
    } catch (err: any) {
      setReserveError(err.response?.data?.error || 'Failed to place reservation.');
      setIsReserving(false);
    }
  };

  const handleDelete = async () => {
    if (!listing || !confirm('Deactivate this listing?')) return;
    try {
      await api.delete(`/listings/${listing.id}`);
      navigate('/my-listings');
    } catch {
      /* noop */
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ width: 32, height: 32, border: '2px solid #3d4947', borderTopColor: '#6bd8cb', borderRadius: '50%' }} className="animate-stitch-spin" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px', background: '#131313', minHeight: '80vh' }}>
        <AlertTriangle size={36} color="#ffb4ab" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, color: '#e5e2e1', marginBottom: 8 }}>Listing Unavailable</h2>
        <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: '#bcc9c6', marginBottom: 20 }}>{error}</p>
        <Link to="/marketplace" className="stitch-btn-primary" style={{ padding: '10px 24px', textDecoration: 'none', display: 'inline-block', borderRadius: 4 }}>
          Back to Listings
        </Link>
      </div>
    );
  }

  const isMine = user?.id === listing.sellerId;
  const totalPrice = reserveQty * listing.pricePerUnit;
  const daysRemaining = listing.expiryDate
    ? Math.ceil((new Date(listing.expiryDate).getTime() - Date.now()) / 86400000)
    : null;

  const displayImage =
    listing.imageUrl ||
    DEFAULT_CATEGORY_IMAGES[listing.category] ||
    'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=1200&auto=format&fit=crop&q=80';

  const formattedCreatedDate = new Date(listing.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const formattedExpiryDate = listing.expiryDate
    ? new Date(listing.expiryDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'No Expiry';

  return (
    <div style={{ background: '#131313', color: '#e5e2e1', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 80px' }}>
        
        {/* ── Breadcrumb / Back Link ── */}
        <div style={{ marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => navigate('/marketplace')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'transparent', border: 'none', padding: 0,
              fontFamily: 'Work Sans, sans-serif', fontSize: 13, fontWeight: 500,
              color: '#879391', cursor: 'pointer', transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#6bd8cb')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#879391')}
          >
            <ArrowLeft size={16} /> Back to Listings
          </button>
        </div>

        {/* ── Main Two-Column Layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, alignItems: 'start' }} className="lg:grid-cols-12">
          
          {/* ════ LEFT COLUMN: Product Overview & Info (8 Cols) ════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="lg:col-span-8">
            
            {/* Card 1: Header & Product Hero Image */}
            <div style={{ background: '#1c1b1b', border: '1px solid #3d4947', borderRadius: 8, padding: 24 }}>
              
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <span style={{
                    display: 'inline-block',
                    fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    color: '#6bd8cb', background: '#2a2a2a',
                    border: '1px solid #3d4947', borderRadius: 4,
                    padding: '3px 8px', marginBottom: 10,
                  }}>
                    {listing.category}
                  </span>

                  <h1 style={{
                    fontFamily: 'Sora, sans-serif', fontWeight: 700,
                    fontSize: 'clamp(22px, 3vw, 28px)', color: '#e5e2e1',
                    letterSpacing: '-0.01em', margin: '0 0 6px',
                  }}>
                    {listing.title}
                  </h1>

                  <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#879391', margin: 0 }}>
                    Listed on {formattedCreatedDate} • Listing #SB-{listing.id.substring(0, 8).toUpperCase()}
                  </p>
                </div>

                {/* Status and Urgency Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: '#2a2a2a', border: '1px solid #3d4947',
                    borderRadius: 4, padding: '4px 10px',
                    fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600,
                    color: listing.urgency === 'high' ? '#ffb4ab' : listing.urgency === 'medium' ? '#f6b351' : '#6bd8cb',
                  }}>
                    <Clock size={13} />
                    <span>
                      {listing.urgency === 'high'
                        ? 'High Urgency'
                        : listing.urgency === 'medium'
                        ? 'Med Urgency'
                        : 'Standard Lot'}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: '#2a2a2a', border: '1px solid #3d4947',
                    borderRadius: 4, padding: '4px 10px',
                    fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600,
                    color: '#6bd8cb',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6bd8cb' }} className="animate-pulse" />
                    <span>Active</span>
                  </div>
                </div>
              </div>

              {/* High-res Image Box */}
              <div style={{
                width: '100%', height: 380, borderRadius: 6,
                overflow: 'hidden', border: '1px solid #3d4947',
                background: '#0e0e0e', position: 'relative',
              }}>
                <img
                  src={displayImage}
                  alt={listing.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>

            {/* Card 2: Seller & Verified Trust Card */}
            <div style={{
              background: '#1c1b1b', border: '1px solid #3d4947',
              borderRadius: 8, padding: '20px 24px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 4,
                  background: '#2a2a2a', border: '1px solid #3d4947',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#6bd8cb', flexShrink: 0,
                }}>
                  <Store size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16, color: '#e5e2e1', margin: 0 }}>
                      {listing.seller?.businessName || listing.seller?.name || 'Verified Merchant'}
                    </h3>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      background: 'rgba(107,216,203,0.1)', border: '1px solid rgba(107,216,203,0.25)',
                      borderRadius: 4, padding: '2px 6px',
                      fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.04em', textTransform: 'uppercase', color: '#6bd8cb',
                    }}>
                      <ShieldCheck size={11} /> Verified
                    </span>
                  </div>
                  <p style={{
                    fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#879391',
                    margin: 0, display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <MapPin size={13} color="#879391" />
                    {listing.seller?.address || 'Banjara Hills, Hyderabad'}
                  </p>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 600,
                  letterSpacing: '0.06em', textTransform: 'uppercase', color: '#879391',
                  display: 'block', marginBottom: 4,
                }}>
                  Merchant Trust Rating
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                  <RatingStars rating={listing.seller?.rating || 4.5} size={15} />
                  <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700, color: '#f6b351' }}>
                    {(listing.seller?.rating || 4.5).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Product & Lot Information */}
            <div style={{ background: '#1c1b1b', border: '1px solid #3d4947', borderRadius: 8, padding: 24 }}>
              <h2 style={{
                fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 17, color: '#e5e2e1',
                display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px',
                paddingBottom: 12, borderBottom: '1px solid #3d4947',
              }}>
                <Package size={18} color="#6bd8cb" /> Product & Lot Information
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #2a2a2a' }}>
                    <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#879391' }}>Condition</span>
                    <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#e5e2e1' }}>New / Factory Sealed</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #2a2a2a' }}>
                    <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#879391' }}>Category & Specs</span>
                    <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#e5e2e1' }}>{listing.description || `${listing.category} standard lot`}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #2a2a2a' }}>
                    <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#879391' }}>Color / Batch Spec</span>
                    <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#e5e2e1' }}>Commercial Grade</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #2a2a2a' }}>
                    <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#879391' }}>Packaging</span>
                    <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#e5e2e1' }}>Retail Boxes / Sealed</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #2a2a2a' }}>
                    <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#879391' }}>Min. Order Qty</span>
                    <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#e5e2e1' }}>1 {listing.unit}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #2a2a2a' }}>
                    <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#879391' }}>Trade Terms</span>
                    <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#e5e2e1' }}>Ex-Works (EXW) / Local</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: "Why this stock?" */}
            <div style={{ background: '#1c1b1b', border: '1px solid #3d4947', borderRadius: 8, padding: 24 }}>
              <h2 style={{
                fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 17, color: '#e5e2e1',
                display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px',
                paddingBottom: 12, borderBottom: '1px solid #3d4947',
              }}>
                <Zap size={18} color="#6bd8cb" /> Why this stock?
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div style={{
                  background: '#131313', border: '1px solid #3d4947', borderRadius: 6,
                  padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 6,
                }}>
                  <MapPin size={24} color="#6bd8cb" />
                  <h4 style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, color: '#e5e2e1', margin: 0 }}>
                    {listing.distanceKm ? `${listing.distanceKm.toFixed(1)} km away` : '3.2 km away'}
                  </h4>
                  <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#879391', margin: 0 }}>Low transport cost</p>
                </div>

                <div style={{
                  background: '#131313', border: '1px solid #3d4947', borderRadius: 6,
                  padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 6,
                }}>
                  <ShieldCheck size={24} color="#6bd8cb" />
                  <h4 style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, color: '#e5e2e1', margin: 0 }}>
                    Verified Merchant
                  </h4>
                  <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#879391', margin: 0 }}>High trust rating</p>
                </div>

                <div style={{
                  background: '#131313', border: '1px solid #3d4947', borderRadius: 6,
                  padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 6,
                }}>
                  <Sparkles size={24} color="#6bd8cb" />
                  <h4 style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, color: '#e5e2e1', margin: 0 }}>
                    Best Price
                  </h4>
                  <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#879391', margin: 0 }}>For this lot size</p>
                </div>
              </div>
            </div>

          </div>

          {/* ════ RIGHT COLUMN: Sticky Reservation Card (4 Cols) ════ */}
          <div className="lg:col-span-4">
            <div style={{
              position: 'sticky', top: 80,
              background: '#1c1b1b', border: '1px solid #3d4947',
              borderRadius: 8, padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column', gap: 18,
            }}>
              
              {/* Card Header */}
              <div style={{ paddingBottom: 14, borderBottom: '1px solid #3d4947' }}>
                <h2 style={{
                  fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: '#e5e2e1',
                  display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 4px',
                }}>
                  <ShoppingCart size={18} color="#6bd8cb" /> Reserve Inventory
                </h2>
                <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#879391', margin: 0 }}>
                  Lock lot and open direct trade chat.
                </p>
              </div>

              {/* Unit Price & Available 2-grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: '#131313', border: '1px solid #3d4947', borderRadius: 6, padding: '12px 14px' }}>
                  <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 600, color: '#879391', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Unit Price
                  </span>
                  <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 700, color: '#6bd8cb', margin: '4px 0 0' }}>
                    ₹{listing.pricePerUnit} <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 400, color: '#879391' }}>/{listing.unit}</span>
                  </p>
                </div>

                <div style={{ background: '#131313', border: '1px solid #3d4947', borderRadius: 6, padding: '12px 14px' }}>
                  <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 600, color: '#879391', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Available
                  </span>
                  <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 700, color: '#e5e2e1', margin: '4px 0 0' }}>
                    {listing.quantity} <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 400, color: '#879391' }}>{listing.unit}</span>
                  </p>
                </div>
              </div>

              {/* Expiry Banner */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(246,179,81,0.08)', border: '1px solid rgba(246,179,81,0.25)',
                borderRadius: 6, padding: '10px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f6b351' }}>
                  <Hourglass size={14} />
                  <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, fontWeight: 600 }}>
                    Expiry: {formattedExpiryDate}
                  </span>
                </div>
                {daysRemaining !== null && (
                  <span style={{
                    fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 700,
                    color: daysRemaining <= 7 ? '#ffb4ab' : '#f6b351',
                    background: daysRemaining <= 7 ? 'rgba(255,180,171,0.15)' : 'rgba(246,179,81,0.15)',
                    padding: '2px 8px', borderRadius: 4,
                  }}>
                    {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}
                  </span>
                )}
              </div>

              {/* Quantity Stepper */}
              <div>
                <label style={{
                  fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600,
                  letterSpacing: '0.05em', textTransform: 'uppercase', color: '#879391',
                  display: 'block', marginBottom: 8,
                }}>
                  Quantity to Reserve ({listing.unit.toUpperCase()})
                </label>

                <div style={{
                  display: 'flex', alignItems: 'center',
                  background: '#131313', border: '1px solid #3d4947', borderRadius: 4,
                  overflow: 'hidden',
                }}>
                  <button
                    type="button"
                    onClick={() => setReserveQty((prev) => Math.max(1, prev - 1))}
                    disabled={reserveQty <= 1}
                    style={{
                      background: 'transparent', border: 'none', color: '#bcc9c6',
                      padding: '12px 18px', cursor: reserveQty <= 1 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Minus size={15} />
                  </button>

                  <input
                    type="number"
                    min={1}
                    max={listing.quantity}
                    value={reserveQty}
                    onChange={(e) => setReserveQty(Math.min(listing.quantity, Math.max(1, Number(e.target.value))))}
                    style={{
                      flex: 1, background: 'transparent', border: 'none',
                      textAlign: 'center', fontFamily: 'Sora, sans-serif',
                      fontSize: 18, fontWeight: 700, color: '#e5e2e1',
                      outline: 'none',
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setReserveQty((prev) => Math.min(listing.quantity, prev + 1))}
                    disabled={reserveQty >= listing.quantity}
                    style={{
                      background: 'transparent', border: 'none', color: '#bcc9c6',
                      padding: '12px 18px', cursor: reserveQty >= listing.quantity ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Plus size={15} />
                  </button>
                </div>

                <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: '#879391', textAlign: 'right', margin: '6px 0 0' }}>
                  Max available: {listing.quantity} {listing.unit}
                </p>
              </div>

              {/* Valuation Summary Box */}
              <div style={{
                background: '#131313', border: '1px solid #3d4947', borderRadius: 6,
                padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#879391' }}>
                  <span>Agreed Unit Price:</span>
                  <span style={{ color: '#e5e2e1' }}>₹{listing.pricePerUnit}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#879391' }}>
                  <span>Reserved Volume:</span>
                  <span style={{ color: '#e5e2e1' }}>{reserveQty} {listing.unit}</span>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  paddingTop: 8, borderTop: '1px solid #3d4947', marginTop: 4,
                }}>
                  <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 13, color: '#e5e2e1' }}>
                    Total Valuation:
                  </span>
                  <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 20, color: '#6bd8cb' }}>
                    ₹{totalPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Reserve Error */}
              {reserveError && (
                <p style={{
                  fontFamily: 'Work Sans, sans-serif', fontSize: 12,
                  color: '#ffb4ab', background: 'rgba(255,180,171,0.08)',
                  border: '1px solid rgba(255,180,171,0.2)', borderRadius: 4,
                  padding: '8px 12px', margin: 0,
                }}>
                  {reserveError}
                </p>
              )}

              {/* CTA Action */}
              {isMine ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Link
                    to={`/create-listing?edit=${listing.id}`}
                    className="stitch-btn-primary"
                    style={{
                      textAlign: 'center', padding: '14px', borderRadius: 4,
                      fontSize: 13, textDecoration: 'none', letterSpacing: '0.04em',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    Edit Listing Details
                  </Link>
                  <Link
                    to="/my-listings"
                    className="stitch-btn-ghost"
                    style={{
                      textAlign: 'center', padding: '12px', borderRadius: 4,
                      fontSize: 13, textDecoration: 'none', letterSpacing: '0.04em',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    Manage in My Stock
                  </Link>
                  <button
                    type="button"
                    onClick={handleDelete}
                    style={{
                      padding: '10px', background: 'transparent', border: '1px solid rgba(255,180,171,0.3)',
                      color: '#ffb4ab', borderRadius: 4, fontFamily: 'Work Sans, sans-serif',
                      fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    Deactivate Listing
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReserve}>
                  <button
                    type="submit"
                    disabled={isReserving || listing.quantity === 0}
                    className="stitch-btn-primary"
                    style={{
                      width: '100%', padding: '15px', borderRadius: 4,
                      fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700,
                      letterSpacing: '0.04em', cursor: isReserving ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      opacity: isReserving ? 0.6 : 1,
                    }}
                  >
                    {isReserving ? (
                      'Locking Reservation...'
                    ) : (
                      <>
                        Reserve Stock <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Lock reassurance text */}
              <p style={{
                fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: '#879391',
                textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                margin: 0,
              }}>
                <Lock size={13} color="#6bd8cb" /> Instant 24h Holding Window (No Advance)
              </p>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
