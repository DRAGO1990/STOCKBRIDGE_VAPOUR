import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Lock,
  ArrowRight,
  ShieldCheck,
  Store,
  Sparkles,
  Search,
  Package,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import type { Listing } from '../types';
import { ListingCard } from '../components/ListingCard';
import { AuthGateModal } from '../components/AuthGateModal';
import { useAuthStore } from '../stores/authStore';

const PREVIEW_CATEGORIES = [
  'All Lots',
  'Groceries',
  'Prepared Food & Bakery',
  'Packaging',
  'Electronics',
  'Stationery',
  'Hardware',
  'Dairy & Beverages',
];

export const MarketPreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('category') || 'All Lots'
  );

  const [authGate, setAuthGate] = useState<{
    isOpen: boolean;
    title?: string;
    description?: string;
    actionContext?: string;
  }>({ isOpen: false });

  // If user is already authenticated, redirect them to the real marketplace
  useEffect(() => {
    if (user) {
      navigate('/marketplace', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    setLoading(true);
    api
      .get('/listings?limit=8')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data.listings || []);
        setListings(list);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === 'All Lots') {
      searchParams.delete('category');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: cat });
    }
  };

  const filteredListings = listings.filter((l) => {
    if (selectedCategory === 'All Lots') return true;
    return l.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  const openAuthGate = (actionContext: string, title?: string, description?: string) => {
    setAuthGate({
      isOpen: true,
      title: title || 'Merchant Sign In Required',
      description:
        description ||
        'Sign in or register your business to access full marketplace inventory, place reservations, or list surplus stock.',
      actionContext,
    });
  };

  return (
    <div style={{ background: 'var(--sb-background, #F7F7F2)', color: 'var(--sb-text-primary, #182018)', minHeight: '100vh', paddingBottom: 80 }}>
      {/* ── 1. Top Showcase Header ── */}
      <section style={{ borderBottom: '1px solid var(--sb-border, #D8E0D5)', background: 'var(--sb-surface, #FFFFFF)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px 40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 840 }}>
            {/* Tag Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--sb-primary-pale, #EAF1E7)',
                border: '1px solid var(--sb-primary-soft, #DCE8D8)',
                borderRadius: 4,
                padding: '4px 12px',
                width: 'fit-content',
              }}
            >
              <Lock size={12} color="var(--sb-primary, #6F8F69)" />
              <span
                style={{
                  fontFamily: 'Work Sans, sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--sb-primary, #6F8F69)',
                }}
              >
                Public Market Showcase · Read-Only Preview
              </span>
            </div>

            {/* Main Title */}
            <h1
              style={{
                fontFamily: 'Sora, sans-serif',
                fontWeight: 700,
                fontSize: 'clamp(28px, 4vw, 42px)',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                color: 'var(--sb-text-primary, #182018)',
                margin: 0,
              }}
            >
              Explore Surplus Inventory Near You
            </h1>

            {/* Description */}
            <p
              style={{
                fontFamily: 'Work Sans, sans-serif',
                fontSize: 16,
                lineHeight: 1.6,
                color: 'var(--sb-text-secondary, #4F5A51)',
                margin: 0,
              }}
            >
              Browse live inventory examples listed by verified businesses. This is a read-only showcase—sign in or create your merchant account to access live lot reserves, direct seller chat, unit certificate details, and radius matching.
            </p>

            {/* Auth CTA Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
                paddingTop: 8,
              }}
            >
              <Link
                to="/login"
                className="stitch-btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  borderRadius: 6,
                }}
              >
                <span>Sign In to Access Marketplace</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/register"
                className="stitch-btn-ghost"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: 'none',
                  borderRadius: 6,
                }}
              >
                <span>Register Business</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Category Filter Bar (Client-Side Preview Filter) ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
          <span
            style={{
              fontFamily: 'Work Sans, sans-serif',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--sb-text-muted, #7A847A)',
              marginRight: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
            }}
          >
            Filter By:
          </span>
          {PREVIEW_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontFamily: 'Work Sans, sans-serif',
                  fontSize: 13,
                  fontWeight: isSelected ? 600 : 500,
                  background: isSelected ? 'var(--sb-primary, #6F8F69)' : 'var(--sb-surface, #FFFFFF)',
                  color: isSelected ? '#FFFFFF' : 'var(--sb-text-secondary, #4F5A51)',
                  border: `1px solid ${isSelected ? 'var(--sb-primary, #6F8F69)' : 'var(--sb-border, #D8E0D5)'}`,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 3. Listings Grid ── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 24px 48px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280 }}>
            <div
              style={{
                width: 36,
                height: 36,
                border: '3px solid var(--sb-border, #D8E0D5)',
                borderTopColor: 'var(--sb-primary, #6F8F69)',
                borderRadius: '50%',
              }}
              className="animate-stitch-spin"
            />
          </div>
        ) : filteredListings.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 24,
            }}
          >
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isPublicPreview={true}
                onPreviewClick={() =>
                  openAuthGate(
                    `Lot: ${listing.title}`,
                    'Unlock Lot Details & Trading',
                    'Sign in or register your merchant account to access batch documents, request sample verification, and lock a 24-hour stock reservation.'
                  )
                }
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              background: 'var(--sb-surface, #FFFFFF)',
              border: '1px solid var(--sb-border, #D8E0D5)',
              borderRadius: 8,
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <Package size={36} color="var(--sb-text-muted, #7A847A)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, color: 'var(--sb-text-primary, #182018)', margin: '0 0 6px' }}>
              No Preview Lots in {selectedCategory}
            </h3>
            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: 'var(--sb-text-muted, #7A847A)', margin: '0 0 20px' }}>
              Select another category or sign in to browse the complete active marketplace.
            </p>
            <button
              type="button"
              onClick={() => handleCategorySelect('All Lots')}
              className="stitch-btn-ghost"
              style={{ padding: '8px 20px', fontSize: 13, borderRadius: 4, cursor: 'pointer' }}
            >
              Show All Preview Lots
            </button>
          </div>
        )}
      </main>

      {/* ── 4. Bottom Conversion Banner ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <div
          style={{
            background: 'var(--sb-surface, #FFFFFF)',
            border: '1px solid var(--sb-border, #D8E0D5)',
            borderRadius: 12,
            padding: '40px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 16,
            boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              background: 'var(--sb-primary-pale, #EAF1E7)',
              border: '1px solid var(--sb-primary-soft, #DCE8D8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--sb-primary, #6F8F69)',
            }}
          >
            <Store size={24} />
          </div>

          <h2
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(22px, 3vw, 30px)',
              color: 'var(--sb-text-primary, #182018)',
              margin: 0,
            }}
          >
            Ready to trade surplus stock with nearby businesses?
          </h2>

          <p
            style={{
              fontFamily: 'Work Sans, sans-serif',
              fontSize: 15,
              color: 'var(--sb-text-secondary, #4F5A51)',
              maxWidth: 580,
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            Join verified Indian retailers, distributors, and suppliers discovering discount surplus lots and turning excess inventory into immediate liquidity.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
            <Link
              to="/login"
              className="stitch-btn-primary"
              style={{
                padding: '12px 28px',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                borderRadius: 6,
              }}
            >
              Sign In to Account
            </Link>
            <Link
              to="/register"
              className="stitch-btn-ghost"
              style={{
                padding: '12px 28px',
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
                borderRadius: 6,
              }}
            >
              Register New Business
            </Link>
          </div>
        </div>
      </section>

      {/* ── Auth Gate Modal ── */}
      <AuthGateModal
        isOpen={authGate.isOpen}
        onClose={() => setAuthGate((prev) => ({ ...prev, isOpen: false }))}
        title={authGate.title}
        description={authGate.description}
        actionContext={authGate.actionContext}
      />
    </div>
  );
};
