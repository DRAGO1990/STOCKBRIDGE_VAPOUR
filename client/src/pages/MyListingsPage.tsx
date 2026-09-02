import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, ChevronDown, Edit, Eye, AlertTriangle, Store,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import type { Listing } from '../types';

type FilterTab = 'all' | 'active' | 'reserved' | 'sold' | 'attention';

const TAB_LABELS: { key: FilterTab; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'active',    label: 'Active' },
  { key: 'reserved',  label: 'Reserved' },
  { key: 'sold',      label: 'Sold' },
  { key: 'attention', label: 'Needs Attention' },
];

const statusStyle = (status: string): React.CSSProperties => {
  switch (status) {
    case 'active':   return { color: '#6bd8cb', background: 'rgba(107,216,203,0.1)', border: '1px solid rgba(107,216,203,0.2)' };
    case 'reserved': return { color: '#ddb7ff', background: 'rgba(221,183,255,0.1)', border: '1px solid rgba(221,183,255,0.2)' };
    case 'sold':     return { color: '#bcc9c6', background: 'rgba(188,201,198,0.1)', border: '1px solid rgba(188,201,198,0.2)' };
    default:         return { color: '#f6b351', background: 'rgba(246,179,81,0.1)',   border: '1px solid rgba(246,179,81,0.2)' };
  }
};

export const MyListingsPage: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [sortOpen, setSortOpen] = useState(false);

  const fetchListings = () => {
    setLoading(true);
    api.get('/listings/my/all')
      .then(res => { setListings(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchListings(); }, []);

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this listing?')) return;
    try { await api.delete(`/listings/${id}`); fetchListings(); } catch { /* noop */ }
  };

  const activeCount   = listings.filter(l => l.status === 'active' && l.active).length;
  const reservedCount = listings.filter(l => l.status === 'reserved').length;
  const soldCount     = listings.filter(l => l.status === 'sold').length;
  const totalValue    = listings.reduce((s, l) => s + l.quantity * l.pricePerUnit, 0);

  const expiringCount = listings.filter(l => {
    if (!l.expiryDate) return false;
    const days = Math.ceil((new Date(l.expiryDate).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 7;
  }).length;

  const filtered = listings.filter(l => {
    if (search && !l.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (tab === 'active')    return l.status === 'active' && l.active;
    if (tab === 'reserved')  return l.status === 'reserved';
    if (tab === 'sold')      return l.status === 'sold';
    if (tab === 'attention') {
      const days = l.expiryDate ? Math.ceil((new Date(l.expiryDate).getTime() - Date.now()) / 86400000) : 999;
      return days <= 7 || l.status === 'reserved';
    }
    return true;
  });

  const S = {
    label: { fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#879391' } as React.CSSProperties,
  };

  return (
    <div style={{ background: '#131313', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 32, color: '#e5e2e1', marginBottom: 8, letterSpacing: '-0.01em' }}>
              My Stock
            </h1>
            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: '#bcc9c6' }}>
              Manage your listed inventory, track reservations and see what needs attention.
            </p>
          </div>
          <Link
            to="/create-listing"
            className="stitch-btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', textDecoration: 'none', borderRadius: 4 }}
          >
            <Plus size={16} /> List New Stock
          </Link>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #3d4947', marginBottom: 28 }} />

        {/* ── Stats row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 1, background: '#3d4947', borderRadius: 8, overflow: 'hidden', marginBottom: 28 }}>
          {[
            { label: 'Active Listings',    value: activeCount,                               color: '#6bd8cb' },
            { label: 'Reserved',           value: reservedCount,                             color: '#ddb7ff' },
            { label: 'Sold / Completed',   value: soldCount,                                 color: '#bcc9c6' },
            { label: 'Total Listed Value', value: `₹${totalValue.toLocaleString('en-IN')}`, color: '#6bd8cb' },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#1c1b1b', padding: '20px 20px 24px' }}>
              <p style={S.label}>{stat.label}</p>
              <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 28, color: stat.color, marginTop: 8 }}>
                {stat.value}
              </p>
            </div>
          ))}

          {/* Needs Attention cell */}
          {expiringCount > 0 && (
            <div style={{ background: '#1c1b1b', padding: '20px 20px 24px', gridColumn: 'span 1' }}>
              <p style={{ ...S.label, color: '#f6b351', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertTriangle size={10} /> Needs Attention
              </p>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#bcc9c6' }}>{expiringCount} listings expiring soon</span>
                  <button style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 600, color: '#6bd8cb', letterSpacing: '0.05em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer' }}>Review</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Filter Tabs + Search ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #3d4947' }}>
            {TAB_LABELS.map(t => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    padding: '10px 16px',
                    fontFamily: 'Work Sans, sans-serif',
                    fontWeight: active ? 600 : 400,
                    fontSize: t.key === 'attention' ? 11 : 13,
                    color: active ? '#6bd8cb' : (t.key === 'attention' ? '#f6b351' : '#bcc9c6'),
                    background: 'transparent', border: 'none',
                    borderBottom: active ? '2px solid #6bd8cb' : '2px solid transparent',
                    cursor: 'pointer', marginBottom: -1,
                    textTransform: t.key === 'attention' ? 'uppercase' as const : 'none' as const,
                    letterSpacing: t.key === 'attention' ? '0.04em' : 0,
                  } as React.CSSProperties}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Search + sort */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#1c1b1b', border: '1px solid #3d4947', borderRadius: 4, padding: '0 12px' }}>
              <Search size={14} color="#879391" />
              <input
                type="text" placeholder="Search my listings"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', padding: '9px 10px', fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#e5e2e1', width: 180 }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setSortOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#1c1b1b', border: '1px solid #3d4947',
                  borderRadius: 4, padding: '9px 14px',
                  fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#bcc9c6', cursor: 'pointer',
                }}
              >
                Expiring soon <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Listing Rows ── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: '#1c1b1b', border: '1px solid #3d4947', borderRadius: 8, height: 100 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: '#1c1b1b', border: '1px solid #3d4947', borderRadius: 8, padding: '60px 24px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, color: '#e5e2e1', marginBottom: 8 }}>No listings here</p>
            <Link to="/create-listing" className="stitch-btn-primary" style={{ display: 'inline-block', padding: '10px 24px', marginTop: 12, textDecoration: 'none', borderRadius: 4 }}>
              + List New Stock
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#3d4947', borderRadius: 8, overflow: 'hidden' }}>
            {filtered.map((listing, i) => {
              const days = listing.expiryDate
                ? Math.ceil((new Date(listing.expiryDate).getTime() - Date.now()) / 86400000)
                : null;
              return (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  style={{
                    background: '#1c1b1b',
                    padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: 16,
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    width: 70, height: 70, borderRadius: 6,
                    background: '#2a2a2a', overflow: 'hidden', flexShrink: 0,
                    border: '1px solid #3d4947', position: 'relative',
                  }}>
                    {listing.imageUrl ? (
                      <img src={listing.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Store size={22} color="#3d4947" />
                      </div>
                    )}
                    {/* Status overlay */}
                    <div style={{
                      position: 'absolute', top: 4, left: 4,
                      padding: '2px 6px', borderRadius: 3,
                      fontFamily: 'Work Sans, sans-serif', fontSize: 9, fontWeight: 700,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      ...statusStyle(listing.status),
                    }}>
                      {listing.status}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#879391', marginBottom: 4 }}>
                      {listing.category}
                    </p>
                    <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 15, color: '#e5e2e1', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {listing.title}
                    </h3>
                    <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#879391' }}>
                      {listing.quantity} {listing.unit} remaining
                    </p>
                  </div>

                  {/* Value */}
                  <div style={{ textAlign: 'right', minWidth: 120 }}>
                    <p style={S.label}>Value</p>
                    <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: '#e5e2e1', marginTop: 4 }}>
                      ₹{(listing.quantity * listing.pricePerUnit).toLocaleString('en-IN')}
                    </p>
                    <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: '#879391' }}>
                      (₹{listing.pricePerUnit}/{listing.unit})
                    </p>
                  </div>

                  {/* Status + days */}
                  <div style={{ minWidth: 140 }}>
                    <p style={S.label}>Status</p>
                    {days !== null && (
                      <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: days <= 7 ? '#f6b351' : '#bcc9c6', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        {days <= 7 && <AlertTriangle size={12} />}
                        {days <= 0 ? 'Expired' : `${days} days left`}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <Link
                      to={`/listings/${listing.id}`}
                      className="stitch-btn-ghost"
                      style={{ padding: '7px 14px', fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <Eye size={13} /> View Listing
                    </Link>
                    {listing.status !== 'sold' && (
                      <Link
                        to={`/create-listing?edit=${listing.id}`}
                        className="stitch-btn-primary"
                        style={{ padding: '7px 14px', fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}
                      >
                        <Edit size={13} /> Edit
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
