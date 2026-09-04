import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Store, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Listing } from '../types';
import { useAuthStore } from '../stores/authStore';

interface ListingCardProps {
  listing: Listing;
  distanceKm?: number;
  isPublicPreview?: boolean;
  onPreviewClick?: () => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  distanceKm,
  isPublicPreview = false,
  onPreviewClick,
}) => {
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

  const handleCardClick = () => {
    if (isPublicPreview && onPreviewClick) {
      onPreviewClick();
    }
  };

  return (
    <motion.div
      onClick={handleCardClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        background: 'var(--sb-surface, #FFFFFF)',
        border: `1px solid ${hovered ? 'var(--sb-primary, #6F8F69)' : 'var(--sb-border, #D8E0D5)'}`,
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: hovered ? '0 8px 20px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.02)',
        transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
        cursor: isPublicPreview ? 'pointer' : 'default',
        transform: hovered && isPublicPreview ? 'translateY(-2px)' : 'none',
      }}
    >
      {/* ── Image area ── */}
      <div style={{ position: 'relative', background: 'var(--sb-surface-soft, #F2F6EF)', height: 160, overflow: 'hidden' }}>
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
            <Store size={28} color="var(--sb-border-strong, #BEC9BA)" />
            <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: 'var(--sb-text-muted, #7A847A)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              No Stock Photo
            </span>
          </div>
        )}

        {/* Public Preview Badge */}
        {isPublicPreview && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(4px)',
            border: '1px solid var(--sb-border, #D8E0D5)',
            borderRadius: 4, padding: '3px 8px',
            color: 'var(--sb-primary, #6F8F69)',
            fontFamily: 'Work Sans, sans-serif',
            fontSize: 10, fontWeight: 600,
            letterSpacing: '0.05em', textTransform: 'uppercase',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}>
            <Lock size={10} /> Preview
          </div>
        )}

        {/* Urgency badge */}
        {daysRemaining !== null && daysRemaining <= 14 && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            display: 'flex', alignItems: 'center', gap: 5,
            background: isUrgent ? 'rgba(166,92,85,0.12)' : 'rgba(184,138,69,0.12)',
            border: `1px solid ${isUrgent ? 'rgba(166,92,85,0.25)' : 'rgba(184,138,69,0.25)'}`,
            borderRadius: 4, padding: '4px 8px',
            color: isUrgent ? 'var(--sb-danger, #A65C55)' : 'var(--sb-warning, #B88A45)',
            fontFamily: 'Work Sans, sans-serif',
            fontSize: 11, fontWeight: 600,
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: isUrgent ? 'var(--sb-danger, #A65C55)' : 'var(--sb-warning, #B88A45)', animation: 'stitch-pulse-teal 1.5s infinite' }} />
            {daysRemaining <= 0 ? 'Expiring Today' : `${daysRemaining} Days Left`}
          </div>
        )}
      </div>

      {/* ── Card body ── */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Seller row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Store size={12} color="var(--sb-text-muted, #7A847A)" />
          <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-muted, #7A847A)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {listing.seller?.businessName || listing.seller?.name || 'Verified Merchant'}
          </span>
          {listing.seller?.rating && (
            <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-muted, #7A847A)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ color: 'var(--sb-warning, #B88A45)' }}>★</span>
              {listing.seller.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily: 'Sora, sans-serif',
          fontWeight: 600, fontSize: 15,
          color: hovered ? 'var(--sb-primary, #6F8F69)' : 'var(--sb-text-primary, #182018)',
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
          gap: 1, background: 'var(--sb-border, #D8E0D5)', borderRadius: 4, overflow: 'hidden', marginBottom: 12,
        }}>
          <div style={{ background: 'var(--sb-surface-soft, #F2F6EF)', padding: '10px 12px' }}>
            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--sb-text-muted, #7A847A)', marginBottom: 4 }}>Unit Price</p>
            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--sb-text-primary, #182018)' }}>
              ₹{listing.pricePerUnit.toLocaleString('en-IN')}
              <span style={{ fontSize: 11, color: 'var(--sb-text-muted, #7A847A)', fontWeight: 400 }}> /{listing.unit}</span>
            </p>
            {(listing.originalMrp || (listing as any).mrp) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: 'var(--sb-text-muted, #7A847A)', textDecoration: 'line-through' }}>
                  ₹{(listing.originalMrp || (listing as any).mrp).toLocaleString('en-IN')}
                </span>
                {(listing.originalMrp || (listing as any).mrp) > listing.pricePerUnit && (
                  <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 9, fontWeight: 700, color: 'var(--sb-primary, #6F8F69)', background: 'var(--sb-primary-pale, #EAF1E7)', padding: '1px 4px', borderRadius: 2 }}>
                    {Math.round((((listing.originalMrp || (listing as any).mrp) - listing.pricePerUnit) / (listing.originalMrp || (listing as any).mrp)) * 100)}% OFF
                  </span>
                )}
              </div>
            )}
          </div>
          <div style={{ background: 'var(--sb-surface-soft, #F2F6EF)', padding: '10px 12px' }}>
            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--sb-text-muted, #7A847A)', marginBottom: 4 }}>Available</p>
            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--sb-text-primary, #182018)' }}>
              {listing.quantity} <span style={{ fontSize: 11, color: 'var(--sb-text-muted, #7A847A)', fontWeight: 400 }}>{listing.unit}</span>
            </p>
          </div>
        </div>

        {/* Total lot value */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--sb-text-muted, #7A847A)', marginBottom: 4 }}>Total Lot Value</p>
          <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 20, color: 'var(--sb-text-primary, #182018)' }}>
            ₹{totalValue.toLocaleString('en-IN')}
          </p>
        </div>

        {/* CTA button */}
        {isPublicPreview ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPreviewClick?.();
            }}
            className="stitch-btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              width: '100%',
              padding: '11px',
              borderRadius: 4,
              marginBottom: 10,
              cursor: 'pointer',
              border: 'none',
              fontFamily: 'Work Sans, sans-serif',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <Lock size={13} />
            <span>Sign In to Unlock Lot</span>
          </button>
        ) : (
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
        )}

        {/* Distance */}
        {displayDist && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <MapPin size={12} color="var(--sb-primary, #6F8F69)" />
            <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-muted, #7A847A)' }}>{displayDist}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
