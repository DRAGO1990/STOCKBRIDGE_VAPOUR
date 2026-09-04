import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, MapPin, Sparkles, Filter, ChevronDown, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import type { Listing } from '../types';
import { ListingCard } from '../components/ListingCard';

const CITIES = [
  { name: 'All Locations', lat: null, lng: null },
  { name: 'Mumbai (MH)',   lat: 19.076, lng: 72.877 },
  { name: 'Delhi NCR',     lat: 28.613, lng: 77.209 },
  { name: 'Bangalore (KA)', lat: 12.971, lng: 77.594 },
  { name: 'Hyderabad (TG)', lat: 17.385, lng: 78.486 },
];

const SORT_OPTIONS = [
  { label: 'Best Match', value: 'match' },
  { label: 'Nearest First', value: 'nearest' },
  { label: 'Price: Low–High', value: 'price_asc' },
  { label: 'Price: High–Low', value: 'price_desc' },
  { label: 'Expiry: Soonest', value: 'expiry' },
];

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const MarketplacePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('match');
  const [maxDistance, setMaxDistance] = useState<number>(10);

  const selectedCategory = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('q') || '';
  const selectedUrgency = searchParams.get('urgency') || 'all';
  const selectedCityName = searchParams.get('city') || 'Mumbai (MH)';

  useEffect(() => {
    api.get('/listings/meta/categories')
      .then(res => setCategories(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: any = { limit: 50 };
    if (selectedCategory !== 'all') params.category = selectedCategory;
    if (searchQuery) params.search = searchQuery;

    api.get('/listings', { params }).then(res => {
      let results: Listing[] = res.data.listings || [];
      if (selectedUrgency !== 'all') results = results.filter(l => l.urgency === selectedUrgency);

      const activeCity = CITIES.find(c => c.name === selectedCityName);
      if (activeCity?.lat && activeCity?.lng) {
        results = results.map(l => {
          if (l.seller?.lat && l.seller?.lng) {
            const d = haversine(activeCity.lat!, activeCity.lng!, l.seller.lat, l.seller.lng);
            return { ...l, distanceKm: d };
          }
          return l;
        });
      }

      // Filter by max distance if active
      if (maxDistance < 50) {
        results = results.filter(l => (l.distanceKm ?? 0) <= maxDistance);
      }

      // Sort
      if (sortBy === 'nearest') {
        results.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
      } else if (sortBy === 'price_asc') {
        results.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
      } else if (sortBy === 'price_desc') {
        results.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
      } else if (sortBy === 'expiry') {
        results.sort((a, b) => {
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        });
      }

      setListings(results);
      setTotalCount(results.length);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedCategory, searchQuery, selectedUrgency, selectedCityName, sortBy, maxDistance]);

  const updateParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams);
    if (value && value !== 'all' && value !== 'All Locations') p.set(key, value);
    else p.delete(key);
    setSearchParams(p);
  };

  return (
    <div style={{ background: 'var(--sb-background, #F7F7F2)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--sb-primary-pale, #EAF1E7)', border: '1px solid var(--sb-primary-soft, #DCE8D8)',
            borderRadius: 4, padding: '4px 10px', marginBottom: 12,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sb-primary, #6F8F69)' }} className="animate-pulse" />
            <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600, color: 'var(--sb-primary, #6F8F69)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Refined Discovery State
            </span>
          </div>

          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 32, color: 'var(--sb-text-primary, #182018)', margin: '0 0 8px' }}>
            Buy Surplus Stock
          </h1>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: 'var(--sb-text-secondary, #4F5A51)', margin: 0 }}>
            Discover and reserve discounted inventory lots from verified neighboring businesses.
          </p>
        </div>

        {/* ── Search & Filter Controls ── */}
        <div style={{ background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 8, padding: 20, marginBottom: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          
          {/* Main search bar + location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center' }}>
            {/* Keyword Search */}
            <div style={{
              display: 'flex', alignItems: 'center', background: 'var(--sb-surface-soft, #F2F6EF)',
              border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 4, padding: '0 14px',
            }}>
              <Search size={16} color="var(--sb-text-muted, #7A847A)" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => updateParam('q', e.target.value)}
                placeholder="Search by SKU, brand, product, or merchant..."
                style={{
                  width: '100%', background: 'transparent', border: 'none',
                  outline: 'none', padding: '12px 10px',
                  fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: 'var(--sb-text-primary, #182018)',
                }}
              />
            </div>

            {/* City / Hub Selector */}
            <div style={{
              display: 'flex', alignItems: 'center', background: 'var(--sb-surface-soft, #F2F6EF)',
              border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 4, padding: '0 12px',
            }}>
              <MapPin size={14} color="var(--sb-primary, #6F8F69)" />
              <select
                value={selectedCityName}
                onChange={e => updateParam('city', e.target.value)}
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  padding: '12px 6px', fontFamily: 'Work Sans, sans-serif',
                  fontSize: 13, color: 'var(--sb-text-primary, #182018)', cursor: 'pointer',
                }}
              >
                {CITIES.map(c => (
                  <option key={c.name} value={c.name} style={{ background: 'var(--sb-surface, #FFFFFF)', color: 'var(--sb-text-primary, #182018)' }}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div style={{
              display: 'flex', alignItems: 'center', background: 'var(--sb-surface-soft, #F2F6EF)',
              border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 4, padding: '0 12px',
            }}>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  padding: '12px 6px', fontFamily: 'Work Sans, sans-serif',
                  fontSize: 13, color: 'var(--sb-text-secondary, #4F5A51)', cursor: 'pointer',
                }}
              >
                {SORT_OPTIONS.map(s => (
                  <option key={s.value} value={s.value} style={{ background: 'var(--sb-surface, #FFFFFF)', color: 'var(--sb-text-primary, #182018)' }}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Chips Bar */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '16px 0 8px', scrollbarWidth: 'none' }}>
            <button
              onClick={() => updateParam('category', 'all')}
              style={{
                background: selectedCategory === 'all' ? 'var(--sb-primary, #6F8F69)' : 'transparent',
                color: selectedCategory === 'all' ? '#FFFFFF' : 'var(--sb-text-secondary, #4F5A51)',
                border: `1px solid ${selectedCategory === 'all' ? 'var(--sb-primary, #6F8F69)' : 'var(--sb-border, #D8E0D5)'}`,
                borderRadius: 4, padding: '6px 14px',
                fontFamily: 'Work Sans, sans-serif', fontSize: 12, fontWeight: 600,
                whiteSpace: 'nowrap', cursor: 'pointer',
              }}
            >
              All Lots
            </button>
            {categories.map(cat => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => updateParam('category', active ? 'all' : cat)}
                  style={{
                    background: active ? 'var(--sb-primary, #6F8F69)' : 'transparent',
                    color: active ? '#FFFFFF' : 'var(--sb-text-secondary, #4F5A51)',
                    border: `1px solid ${active ? 'var(--sb-primary, #6F8F69)' : 'var(--sb-border, #D8E0D5)'}`,
                    borderRadius: 4, padding: '6px 14px',
                    fontFamily: 'Work Sans, sans-serif', fontSize: 12, fontWeight: 600,
                    whiteSpace: 'nowrap', cursor: 'pointer',
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Urgency & Distance Sub-filters */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--sb-border, #D8E0D5)', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Urgency:</span>
              {(['all', 'high', 'medium', 'low'] as const).map(u => {
                const active = selectedUrgency === u;
                return (
                  <button
                    key={u}
                    onClick={() => updateParam('urgency', u)}
                    style={{
                      background: active ? 'var(--sb-primary-pale, #EAF1E7)' : 'transparent',
                      color: active ? 'var(--sb-primary, #6F8F69)' : 'var(--sb-text-muted, #7A847A)',
                      border: `1px solid ${active ? 'var(--sb-primary, #6F8F69)' : 'var(--sb-border, #D8E0D5)'}`,
                      borderRadius: 4, padding: '3px 10px',
                      fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600,
                      textTransform: 'capitalize', cursor: 'pointer',
                    }}
                  >
                    {u === 'all' ? 'Any' : u}
                  </button>
                );
              })}
            </div>

            {/* Radius Slider Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Radius: <strong style={{ color: 'var(--sb-primary, #6F8F69)' }}>{maxDistance} km</strong>
              </span>
              <input
                type="range" min="2" max="50" step="2"
                value={maxDistance}
                onChange={e => setMaxDistance(Number(e.target.value))}
                style={{ accentColor: 'var(--sb-primary, #6F8F69)', cursor: 'pointer', width: 100 }}
              />
            </div>
          </div>
        </div>

        {/* ── Results Count Bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-muted, #7A847A)', margin: 0 }}>
            Showing <strong style={{ color: 'var(--sb-text-primary, #182018)' }}>{totalCount}</strong> available surplus lots
            {selectedCategory !== 'all' && ` in ${selectedCategory}`}
          </p>
        </div>

        {/* ── Listings Grid ── */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '30vh' }}>
            <div style={{ width: 32, height: 32, border: '2px solid var(--sb-border, #D8E0D5)', borderTopColor: 'var(--sb-primary, #6F8F69)', borderRadius: '50%' }} className="animate-stitch-spin" />
          </div>
        ) : listings.length === 0 ? (
          <div style={{
            background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)',
            borderRadius: 8, padding: '64px 24px', textAlign: 'center',
          }}>
            <Search size={36} color="var(--sb-border-strong, #BEC9BA)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, color: 'var(--sb-text-primary, #182018)', margin: '0 0 8px' }}>
              No matching surplus lots found
            </h3>
            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: 'var(--sb-text-muted, #7A847A)', maxWidth: 360, margin: '0 auto 20px' }}>
              Try broadening your category or expanding your location radius.
            </p>
            <button
              onClick={() => {
                setSearchParams(new URLSearchParams());
                setMaxDistance(50);
              }}
              className="stitch-btn-ghost"
              style={{ padding: '8px 20px', fontSize: 12, borderRadius: 4 }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
