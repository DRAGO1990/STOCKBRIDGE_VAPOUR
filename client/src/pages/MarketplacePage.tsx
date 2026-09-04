import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import api from '../lib/api';
import type { Listing } from '../types';
import { ListingCard } from '../components/ListingCard';
import { useAuthStore } from '../stores/authStore';
import { useLocationStore } from '../stores/locationStore';
import { SUPPORTED_LOCATIONS, findLocationByName } from '../config/locations';

const CITIES = [
  { name: 'All Locations', lat: null, lng: null, defaultRadiusKm: 500 },
  ...SUPPORTED_LOCATIONS.map((loc) => ({
    name: loc.name,
    lat: loc.lat,
    lng: loc.lng,
    defaultRadiusKm: loc.defaultRadiusKm,
  })),
];

const SORT_OPTIONS = [
  { label: 'Best Match', value: 'match' },
  { label: 'Nearest First', value: 'nearest' },
  { label: 'Price: Low–High', value: 'price_asc' },
  { label: 'Price: High–Low', value: 'price_desc' },
  { label: 'Expiry: Soonest', value: 'expiry' },
];

export const MarketplacePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const { activeLocation, setLocation, radiusKm, setRadius } = useLocationStore();

  const urlCity = searchParams.get('city');

  // If URL explicitly requests a city different from activeLocation, sync it
  useEffect(() => {
    if (urlCity && urlCity !== activeLocation.name) {
      const match = findLocationByName(urlCity);
      if (match) {
        setLocation(match);
      }
    }
  }, [urlCity, activeLocation.name, setLocation]);

  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('match');
  const [maxDistance, setMaxDistance] = useState<number>(radiusKm || activeLocation.defaultRadiusKm);

  const selectedCategory = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('q') || '';
  const selectedUrgency = searchParams.get('urgency') || 'all';

  useEffect(() => {
    api.get('/listings/meta/categories')
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  // Fetch listings with real backend location, radius and category filtering
  useEffect(() => {
    setLoading(true);
    const params: any = {
      limit: 100,
      lat: activeLocation.lat,
      lng: activeLocation.lng,
      radiusKm: maxDistance,
      city: activeLocation.name,
      sort: sortBy,
    };
    if (selectedCategory !== 'all') params.category = selectedCategory;
    if (searchQuery) params.search = searchQuery;
    if (selectedUrgency !== 'all') params.urgency = selectedUrgency;

    api.get('/listings', { params }).then((res) => {
      const results: Listing[] = res.data.listings || [];
      setListings(results);
      setTotalCount(res.data.total ?? results.length);
      setLoading(false);
    }).catch((err) => {
      console.error('Failed to fetch marketplace listings:', err);
      setLoading(false);
    });
  }, [selectedCategory, searchQuery, selectedUrgency, activeLocation.id, sortBy, maxDistance]);

  const updateParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams);
    if (value && value !== 'all' && value !== 'All Locations') {
      p.set(key, value);
    } else {
      p.delete(key);
    }
    setSearchParams(p);
  };

  const handleCitySelect = (cityName: string) => {
    setLocation(cityName);
    updateParam('city', cityName);
  };

  const handleRadiusChange = (radius: number) => {
    setMaxDistance(radius);
    setRadius(radius);
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
              Multi-Hub Liquidation Marketplace
            </span>
          </div>

          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 32, color: 'var(--sb-text-primary, #182018)', margin: '0 0 8px' }}>
            Buy Surplus Stock
          </h1>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: 'var(--sb-text-secondary, #4F5A51)', margin: 0 }}>
            Discover and reserve discounted inventory lots from verified neighboring businesses in {activeLocation.name}.
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
                onChange={(e) => updateParam('q', e.target.value)}
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
                value={activeLocation.name}
                onChange={(e) => handleCitySelect(e.target.value)}
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  padding: '12px 6px', fontFamily: 'Work Sans, sans-serif',
                  fontSize: 13, color: 'var(--sb-text-primary, #182018)', cursor: 'pointer',
                }}
              >
                {CITIES.filter(c => c.name !== 'All Locations').map((c) => (
                  <option key={c.name} value={c.name} style={{ background: 'var(--sb-surface, #FFFFFF)', color: 'var(--sb-text-primary, #182018)' }}>
                    {c.name}
                  </option>
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
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  padding: '12px 6px', fontFamily: 'Work Sans, sans-serif',
                  fontSize: 13, color: 'var(--sb-text-secondary, #4F5A51)', cursor: 'pointer',
                }}
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value} style={{ background: 'var(--sb-surface, #FFFFFF)', color: 'var(--sb-text-primary, #182018)' }}>
                    {s.label}
                  </option>
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
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => updateParam('category', cat)}
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

          {/* Extra Row: Urgency & Proximity Radius Slider */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--sb-border, #D8E0D5)', paddingTop: 16, marginTop: 8, flexWrap: 'wrap', gap: 16 }}>
            {/* Urgency Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Urgency:</span>
              {(['all', 'high', 'medium', 'low'] as const).map((u) => {
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
                Radius:{' '}
                <strong style={{ color: 'var(--sb-primary, #6F8F69)' }}>
                  {maxDistance >= 100 ? 'All Distances' : `${maxDistance} km`}
                </strong>
              </span>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={maxDistance}
                onChange={(e) => handleRadiusChange(Number(e.target.value))}
                style={{ accentColor: 'var(--sb-primary, #6F8F69)', cursor: 'pointer', width: 120 }}
              />
            </div>
          </div>
        </div>

        {/* ── Results Count Bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-muted, #7A847A)', margin: 0 }}>
            Showing <strong style={{ color: 'var(--sb-text-primary, #182018)' }}>{totalCount}</strong> available surplus lots
            {selectedCategory !== 'all' && ` in ${selectedCategory}`} in <strong style={{ color: 'var(--sb-text-primary, #182018)' }}>{activeLocation.name}</strong>
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
              No matching surplus lots found in {activeLocation.name}
            </h3>
            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: 'var(--sb-text-muted, #7A847A)', maxWidth: 360, margin: '0 auto 20px' }}>
              Try broadening your category or expanding your location radius to discover cross-city inventory.
            </p>
            <button
              onClick={() => {
                setSearchParams(new URLSearchParams());
                setMaxDistance(100);
              }}
              className="stitch-btn-ghost"
              style={{ padding: '8px 20px', fontSize: 12, borderRadius: 4 }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
