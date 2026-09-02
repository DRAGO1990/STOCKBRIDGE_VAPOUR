import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Listing } from '../types';
import { useAuthStore } from '../stores/authStore';

export const ListingCard: React.FC<{ listing: Listing; distanceKm?: number }> = ({ listing, distanceKm }) => {
  const user = useAuthStore(s => s.user);
  const isMine = user?.id === listing.sellerId;
  const [hovered, setHovered] = useState(false);

  const totalValue = listing.quantity * listing.pricePerUnit;

  let daysRemaining: number | null = null;
  if (listing.expiryDate) {
    const diff = new Date(listing.expiryDate).getTime() - Date.now();
    daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const rawDist = distanceKm ?? listing.distanceKm;
  const displayDist = rawDist !== undefined && rawDist !== null
    ? (rawDist < 0.8 ? '< 1 km away' : `${rawDist.toFixed(1)} km away`)
    : null;

  const isUrgent = daysRemaining !== null && daysRemaining <= 7;

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        background: '#1c1b1b',
        border: `1px solid ${hovered ? '#6bd8cb' : '#3d4947'}`,
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.2s ease',
        cursor: 'default',
      }}
    >
      {/* ── Image area ── */}
      <div style={{ position: 'relative', background: '#2a2a2a', height: 160, overflow: 'hidden' }}>
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
            onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; }}
          />
        ) : (
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Store size={28} color="#3d4947" />
            <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: '#879391', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              No Stock Photo
            </span>
          </div>
        )}

        {/* Urgency badge */}
        {daysRemaining !== null && daysRemaining <= 14 && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            display: 'flex', alignItems: 'center', gap: 5,
            background: isUrgent ? 'rgba(255,180,171,0.15)' : 'rgba(246,179,81,0.15)',
            border: `1px solid ${isUrgent ? 'rgba(255,180,171,0.3)' : 'rgba(246,179,81,0.3)'}`,
            borderRadius: 4, padding: '4px 8px',
            color: isUrgent ? '#ffb4ab' : '#f6b351',
            fontFamily: 'Work Sans, sans-serif',
            fontSize: 11, fontWeight: 600,
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: isUrgent ? '#ffb4ab' : '#f6b351', animation: 'stitch-pulse-teal 1.5s infinite' }} />
            {daysRemaining <= 0 ? 'Expiring Today' : `${daysRemaining} Days Left`}
          </div>
        )}
      </div>

      {/* ── Card body ── */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Seller row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Store size={12} color="#879391" />
          <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#879391', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {listing.seller?.businessName || listing.seller?.name || 'Verified Merchant'}
          </span>
          {listing.seller?.rating && (
            <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#879391', display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ color: '#f6b351' }}>★</span>
              {listing.seller.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily: 'Sora, sans-serif',
          fontWeight: 600, fontSize: 15,
          color: hovered ? '#6bd8cb' : '#e5e2e1',
          lineHeight: 1.35, marginBottom: 14,
          transition: 'color 0.15s',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {listing.title}
        </h3>

        {/* Price + Qty grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 1, background: '#3d4947', borderRadius: 4, overflow: 'hidden', marginBottom: 12,
        }}>
          <div style={{ background: '#2a2a2a', padding: '10px 12px' }}>
            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#879391', marginBottom: 4 }}>Unit Price</p>
            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 15, fontWeight: 600, color: '#e5e2e1' }}>
              ₹{listing.pricePerUnit.toLocaleString('en-IN')}
              <span style={{ fontSize: 11, color: '#879391', fontWeight: 400 }}> /{listing.unit}</span>
            </p>
          </div>
          <div style={{ background: '#2a2a2a', padding: '10px 12px' }}>
            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#879391', marginBottom: 4 }}>Available</p>
            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 15, fontWeight: 600, color: '#e5e2e1' }}>
              {listing.quantity} <span style={{ fontSize: 11, color: '#879391', fontWeight: 400 }}>{listing.unit}</span>
            </p>
          </div>
        </div>

        {/* Total lot value */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#879391', marginBottom: 4 }}>Total Lot Value</p>
          <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 20, color: '#e5e2e1' }}>
            ₹{totalValue.toLocaleString('en-IN')}
          </p>
        </div>

        {/* CTA button */}
        <Link
          to={`/listings/${listing.id}`}
          className="stitch-btn-primary"
          style={{
            display: 'block', textAlign: 'center',
            padding: '11px', textDecoration: 'none',
            borderRadius: 4, marginBottom: 10,
          }}
        >
          {isMine ? 'Manage Listing' : 'View Details'}
        </Link>

        {/* Distance */}
        {displayDist && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <MapPin size={12} color="#879391" />
            <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#879391' }}>{displayDist}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
