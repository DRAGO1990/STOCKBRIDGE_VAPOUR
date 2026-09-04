import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Users, Package, CalendarCheck, CheckCircle, Search, Store, X, MapPin, Phone, Mail, ShieldCheck, Check, AlertCircle, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import type { AdminStats, User, Listing } from '../types';
import { StatusBadge } from '../components/StatusBadges';
import { RatingStars } from '../components/RatingStars';
import { SUPPORTED_LOCATIONS, detectUserLocation } from '../config/locations';

const TH: React.FC<{ children: React.ReactNode; right?: boolean }> = ({ children, right }) => (
  <th style={{
    padding: '12px 16px', textAlign: right ? 'right' : 'left',
    fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 600,
    letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--sb-text-muted, #7A847A)',
    background: 'var(--sb-surface-soft, #F2F6EF)', borderBottom: '1px solid var(--sb-border, #D8E0D5)',
    whiteSpace: 'nowrap',
  }}>
    {children}
  </th>
);

const labelStyle: React.CSSProperties = {
  fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 600,
  letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--sb-text-muted, #7A847A)', marginBottom: 6, display: 'block',
};

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats]     = useState<AdminStats | null>(null);
  const [users, setUsers]     = useState<User[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'listings'>('users');
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedMerchant, setSelectedMerchant] = useState<User | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [s, u, l] = await Promise.all([
        api.get('/admin/stats'), api.get('/admin/users'), api.get('/admin/listings'),
      ]);
      setStats(s.data); setUsers(u.data); setListings(l.data);
    } catch { /* noop */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchAdminData(); }, []);

  const toggleUser = async (id: string) => {
    try {
      await api.post(`/admin/users/${id}/toggle`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
      if (selectedMerchant?.id === id) {
        setSelectedMerchant(prev => prev ? { ...prev, active: !prev.active } : null);
      }
    } catch { /* noop */ }
  };

  const verifyUser = async (id: string, status: 'verified' | 'rejected') => {
    try {
      await api.post(`/admin/users/${id}/verify`, { status });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, verificationStatus: status } : u));
      if (selectedMerchant?.id === id) {
        setSelectedMerchant(prev => prev ? { ...prev, verificationStatus: status } : null);
      }
    } catch (err) {
      console.error('Failed to verify user', err);
    }
  };

  const toggleListing = async (id: string) => {
    try {
      const res = await api.post(`/admin/listings/${id}/toggle`);
      setListings(prev => prev.map(l => l.id === id ? { ...l, active: res.data.active, status: res.data.status } : l));
    } catch { /* noop */ }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.businessName?.toLowerCase().includes(search.toLowerCase()))
  );
  const filteredListings = listings.filter(l =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.category.toLowerCase().includes(search.toLowerCase())
  );

  const merchantListings = selectedMerchant
    ? listings.filter(l => l.sellerId === selectedMerchant.id)
    : [];

  return (
    <div style={{ background: 'var(--sb-background, #F7F7F2)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Shield size={16} color="var(--sb-danger, #A65C55)" />
              <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--sb-danger, #A65C55)' }}>
                Restricted Admin Command Center
              </span>
            </div>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 30, color: 'var(--sb-text-primary, #182018)', letterSpacing: '-0.01em', marginBottom: 6 }}>
              Platform Operations
            </h1>
            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: 'var(--sb-text-secondary, #4F5A51)', margin: 0 }}>
              Audit merchant registrations, moderate surplus listings, and supervise trade fulfillment.
            </p>
          </div>
          <Link to="/" style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-primary, #6F8F69)', textDecoration: 'none' }}>
            ← Back to Platform
          </Link>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--sb-border, #D8E0D5)', marginBottom: 28 }} />

        {/* ── KPI cards ── */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1, background: 'var(--sb-border, #D8E0D5)', borderRadius: 8, overflow: 'hidden', marginBottom: 28, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            {[
              { icon: <Users size={20} color="var(--sb-primary, #6F8F69)" />, label: 'Total Users',        value: stats.users,        color: 'var(--sb-primary, #6F8F69)' },
              { icon: <Package size={20} color="var(--sb-text-primary, #182018)" />, label: 'Active Listings',  value: stats.listings,     color: 'var(--sb-text-primary, #182018)' },
              { icon: <CalendarCheck size={20} color="var(--sb-warning, #B88A45)" />, label: 'Reservations', value: stats.reservations, color: 'var(--sb-warning, #B88A45)' },
              { icon: <CheckCircle size={20} color="var(--sb-success, #557A55)" />, label: 'Completed',     value: stats.completed,    color: 'var(--sb-success, #557A55)' },
            ].map(k => (
              <div key={k.label} style={{ background: 'var(--sb-surface, #FFFFFF)', padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  {k.icon}
                  <p style={labelStyle}>{k.label}</p>
                </div>
                <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 32, color: k.color, margin: 0 }}>{k.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Multi-Location Distribution Card ── */}
        <div style={{
          background: 'var(--sb-surface, #FFFFFF)',
          border: '1px solid var(--sb-border, #D8E0D5)',
          borderRadius: 8,
          padding: '16px 20px',
          marginBottom: 28,
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={15} color="var(--sb-primary, #6F8F69)" />
              <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--sb-text-primary, #182018)' }}>
                Multi-Hub Commercial Distribution (6 Indian Markets)
              </span>
            </div>
            <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: 'var(--sb-text-muted, #7A847A)' }}>
              Active coverage across wholesale clusters
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            {SUPPORTED_LOCATIONS.map(loc => {
              const count = users.filter(u => detectUserLocation(u.address, u.lat, u.lng).id === loc.id).length;
              return (
                <div key={loc.id} style={{
                  background: 'var(--sb-surface-soft, #F2F6EF)',
                  border: '1px solid var(--sb-border, #D8E0D5)',
                  borderRadius: 6,
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--sb-text-primary, #182018)', margin: 0 }}>
                      {loc.shortName}
                    </p>
                    <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 10, color: 'var(--sb-text-muted, #7A847A)', margin: '2px 0 0' }}>
                      {loc.defaultRadiusKm} km radius
                    </p>
                  </div>
                  <span style={{
                    fontFamily: 'Sora, sans-serif',
                    fontSize: 14,
                    fontWeight: 700,
                    color: count > 0 ? 'var(--sb-primary, #6F8F69)' : 'var(--sb-text-muted, #7A847A)',
                    background: 'var(--sb-surface, #FFFFFF)',
                    padding: '2px 8px',
                    borderRadius: 4,
                    border: '1px solid var(--sb-border, #D8E0D5)',
                  }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Table section ── */}
        <div style={{ background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          {/* Section header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', borderBottom: '1px solid var(--sb-border, #D8E0D5)', flexWrap: 'wrap', gap: 12,
          }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0 }}>
              {(['users', 'listings'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  style={{
                    padding: '8px 16px',
                    fontFamily: 'Work Sans, sans-serif', fontSize: 13, fontWeight: activeTab === t ? 600 : 400,
                    color: activeTab === t ? 'var(--sb-primary, #6F8F69)' : 'var(--sb-text-muted, #7A847A)',
                    background: 'transparent', border: 'none',
                    borderBottom: `2px solid ${activeTab === t ? 'var(--sb-primary, #6F8F69)' : 'transparent'}`,
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}
                >
                  {t === 'users' ? `Merchant Accounts (${users.length})` : `Surplus Listings (${listings.length})`}
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--sb-surface-soft, #F2F6EF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 4, padding: '0 12px' }}>
              <Search size={14} color="var(--sb-text-muted, #7A847A)" />
              <input
                type="text" placeholder="Filter..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', padding: '9px 10px', fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-primary, #182018)', width: 180 }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <div style={{ width: 32, height: 32, border: '2px solid var(--sb-border, #D8E0D5)', borderTopColor: 'var(--sb-primary, #6F8F69)', borderRadius: '50%' }} className="animate-stitch-spin" />
            </div>
          ) : activeTab === 'users' ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <TH>Merchant / Business</TH>
                    <TH>Hub Location</TH>
                    <TH>KYC Verification</TH>
                    <TH>Trust Score</TH>
                    <TH>Lots / Orders</TH>
                    <TH>Status</TH>
                    <TH right>Actions</TH>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => {
                    const hub = detectUserLocation(u.address, u.lat, u.lng);
                    const isVerified = u.verificationStatus === 'verified';
                    const isReview = u.verificationStatus === 'under_review';
                    return (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        style={{ borderBottom: '1px solid var(--sb-border, #D8E0D5)', cursor: 'pointer' }}
                        onClick={() => setSelectedMerchant(u)}
                        onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(111,143,105,0.06)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 17, background: 'var(--sb-primary-pale, #EAF1E7)', border: '1px solid var(--sb-primary-soft, #DCE8D8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--sb-primary, #6F8F69)', flexShrink: 0 }}>
                              {(u.businessName || u.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--sb-text-primary, #182018)', margin: 0 }}>{u.businessName || u.name}</p>
                              <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-muted, #7A847A)', margin: '2px 0 0' }}>{u.name}{u.isAdmin && ' · Admin'}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 4,
                            fontFamily: 'Work Sans, sans-serif', fontSize: 12, fontWeight: 600,
                            background: 'var(--sb-surface-soft, #F2F6EF)', border: '1px solid var(--sb-border, #D8E0D5)',
                            color: 'var(--sb-text-primary, #182018)'
                          }}>
                            <MapPin size={11} color="var(--sb-primary, #6F8F69)" /> {hub.shortName}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '2px 8px', borderRadius: 4,
                            fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                            background: isVerified ? 'var(--sb-primary-pale, #EAF1E7)' : isReview ? '#FFF8EB' : '#F3F4F6',
                            color: isVerified ? 'var(--sb-primary, #6F8F69)' : isReview ? '#B45309' : '#6B7280',
                            border: `1px solid ${isVerified ? 'var(--sb-primary-soft, #DCE8D8)' : isReview ? '#FDE68A' : '#E5E7EB'}`,
                          }}>
                            {isVerified ? <ShieldCheck size={11} /> : <Clock size={11} />}
                            {isVerified ? 'Verified' : isReview ? 'Under Review' : 'Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <RatingStars rating={u.rating || 5} size={12} />
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-secondary, #4F5A51)' }}>
                          {u._count?.listings || 0} lots / {u._count?.reservations || 0} orders
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <StatusBadge status={u.active !== false ? 'active' : 'suspended'} />
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleUser(u.id);
                            }}
                            style={{
                              padding: '6px 12px', borderRadius: 4,
                              fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600,
                              letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer',
                              border: '1px solid',
                              ...(u.active !== false
                                ? { color: 'var(--sb-danger, #A65C55)', borderColor: 'rgba(166,92,85,0.3)', background: 'rgba(166,92,85,0.08)' }
                                : { color: 'var(--sb-primary, #6F8F69)', borderColor: 'rgba(111,143,105,0.3)', background: 'rgba(111,143,105,0.08)' }
                              ),
                            }}
                          >
                            {u.active !== false ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <TH>Listing</TH>
                    <TH>Category</TH>
                    <TH>Qty / Price</TH>
                    <TH>Status</TH>
                    <TH right>Moderation</TH>
                  </tr>
                </thead>
                <tbody>
                  {filteredListings.map((l, i) => (
                    <motion.tr
                      key={l.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      style={{ borderBottom: '1px solid var(--sb-border, #D8E0D5)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(111,143,105,0.06)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--sb-surface-soft, #F2F6EF)', border: '1px solid var(--sb-border, #D8E0D5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {l.imageUrl ? <img src={l.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} /> : <Store size={16} color="var(--sb-text-muted, #7A847A)" />}
                          </div>
                          <div>
                            <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--sb-text-primary, #182018)', margin: '0 0 2px' }}>{l.title}</p>
                            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: 'var(--sb-text-muted, #7A847A)', margin: 0 }}>#SB-{l.id.substring(0, 8).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--sb-text-secondary, #4F5A51)', background: 'var(--sb-surface-soft, #F2F6EF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 4, padding: '3px 8px' }}>
                          {l.category}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--sb-text-primary, #182018)', margin: 0 }}>{l.quantity} {l.unit}</p>
                        <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-primary, #6F8F69)', margin: '2px 0 0' }}>₹{l.pricePerUnit}/{l.unit}</p>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <StatusBadge status={l.status} />
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => toggleListing(l.id)}
                          style={{
                            padding: '6px 12px', borderRadius: 4,
                            fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600,
                            letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer',
                            border: '1px solid',
                            ...(l.active
                              ? { color: 'var(--sb-warning, #B88A45)', borderColor: 'rgba(184,138,69,0.3)', background: 'rgba(184,138,69,0.08)' }
                              : { color: 'var(--sb-primary, #6F8F69)', borderColor: 'rgba(111,143,105,0.3)', background: 'rgba(111,143,105,0.08)' }
                            ),
                          }}
                        >
                          {l.active ? 'Expire' : 'Activate'}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Merchant Detail Modal (matching stockbridge_admin_merchant_detail) ── */}
        <AnimatePresence>
          {selectedMerchant && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(24, 32, 24, 0.45)', backdropFilter: 'blur(4px)',
              padding: 16,
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)',
                  borderRadius: 8, width: '100%', maxWidth: 640,
                  maxHeight: '90vh', overflowY: 'auto',
                  boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
                }}
              >
                {/* Header */}
                <div style={{
                  padding: '20px 24px', borderBottom: '1px solid var(--sb-border, #D8E0D5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: 'var(--sb-primary-soft, #DCE8D8)', color: 'var(--sb-primary, #6F8F69)',
                      fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {(selectedMerchant.businessName || selectedMerchant.name).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--sb-text-primary, #182018)', margin: 0 }}>
                        {selectedMerchant.businessName || selectedMerchant.name}
                      </h3>
                      <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-muted, #7A847A)', margin: '2px 0 0' }}>
                        Merchant ID #M-{selectedMerchant.id.substring(0, 8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--sb-text-muted, #7A847A)', cursor: 'pointer', padding: 6 }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body Details */}
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  
                  {/* Status & Trust Overview */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, background: 'var(--sb-surface-soft, #F2F6EF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 6, padding: 16 }}>
                    <div>
                      <span style={labelStyle}>Account Status</span>
                      <StatusBadge status={selectedMerchant.active !== false ? 'active' : 'suspended'} />
                    </div>
                    <div>
                      <span style={labelStyle}>Trust Rating</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <RatingStars rating={selectedMerchant.rating || 5} size={12} />
                        <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--sb-warning, #B88A45)' }}>
                          {(selectedMerchant.rating || 5).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span style={labelStyle}>Role</span>
                      <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--sb-primary, #6F8F69)' }}>
                        {selectedMerchant.isAdmin ? 'Admin' : 'Verified Merchant'}
                      </span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={labelStyle}>Contact & Logistics</span>
                    <div style={{ background: 'var(--sb-background, #F7F7F2)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 6, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-primary, #182018)' }}>
                        <Mail size={14} color="var(--sb-text-muted, #7A847A)" /> {selectedMerchant.email}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-primary, #182018)' }}>
                        <Phone size={14} color="var(--sb-text-muted, #7A847A)" /> {selectedMerchant.phone || 'No phone number on file'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-primary, #182018)' }}>
                        <MapPin size={14} color="var(--sb-text-muted, #7A847A)" /> {selectedMerchant.address || 'Address unlisted'}
                      </div>
                    </div>
                  </div>

                  {/* KYC Compliance & Government ID Audit */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={labelStyle}>Government Identity Verification (KYC)</span>
                    <div style={{ background: 'var(--sb-surface-soft, #F2F6EF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 6, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <ShieldCheck size={16} color="var(--sb-primary, #6F8F69)" />
                          <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--sb-text-primary, #182018)' }}>
                            Document: {selectedMerchant.idDocumentType || 'PAN'}
                          </span>
                        </div>
                        <span style={{
                          fontSize: 11,
                          fontFamily: 'Work Sans, sans-serif',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: selectedMerchant.verificationStatus === 'verified' ? 'var(--sb-primary-pale, #EAF1E7)' : selectedMerchant.verificationStatus === 'under_review' ? '#FFF8EB' : '#F3F4F6',
                          color: selectedMerchant.verificationStatus === 'verified' ? 'var(--sb-primary, #6F8F69)' : selectedMerchant.verificationStatus === 'under_review' ? '#B45309' : '#6B7280',
                          border: `1px solid ${selectedMerchant.verificationStatus === 'verified' ? 'var(--sb-primary-soft, #DCE8D8)' : selectedMerchant.verificationStatus === 'under_review' ? '#FDE68A' : '#E5E7EB'}`,
                        }}>
                          {selectedMerchant.verificationStatus === 'verified' ? 'Verified KYC' : selectedMerchant.verificationStatus === 'under_review' ? 'Under Review' : selectedMerchant.verificationStatus === 'rejected' ? 'Rejected' : 'Pending'}
                        </span>
                      </div>
                      
                      <div style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-secondary, #4F5A51)', marginBottom: 12 }}>
                        Masked Identifier: <strong style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--sb-text-primary, #182018)' }}>{selectedMerchant.idDocumentNumber || 'No document submitted'}</strong>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => verifyUser(selectedMerchant.id, 'verified')}
                          disabled={selectedMerchant.verificationStatus === 'verified'}
                          style={{
                            padding: '6px 14px', borderRadius: 4,
                            fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600,
                            letterSpacing: '0.04em', textTransform: 'uppercase', cursor: selectedMerchant.verificationStatus === 'verified' ? 'default' : 'pointer',
                            background: 'var(--sb-primary, #6F8F69)', color: '#FFFFFF', border: 'none',
                            opacity: selectedMerchant.verificationStatus === 'verified' ? 0.6 : 1,
                          }}
                        >
                          ✓ Approve KYC
                        </button>
                        <button
                          onClick={() => verifyUser(selectedMerchant.id, 'rejected')}
                          disabled={selectedMerchant.verificationStatus === 'rejected'}
                          style={{
                            padding: '6px 14px', borderRadius: 4,
                            fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600,
                            letterSpacing: '0.04em', textTransform: 'uppercase', cursor: selectedMerchant.verificationStatus === 'rejected' ? 'default' : 'pointer',
                            background: 'rgba(166,92,85,0.1)', color: 'var(--sb-danger, #A65C55)', border: '1px solid rgba(166,92,85,0.3)',
                            opacity: selectedMerchant.verificationStatus === 'rejected' ? 0.6 : 1,
                          }}
                        >
                          ✕ Reject KYC
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Active listings by this merchant */}
                  <div>
                    <span style={labelStyle}>Active Lots Listed by Merchant ({merchantListings.length})</span>
                    {merchantListings.length === 0 ? (
                      <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-muted, #7A847A)', margin: 0 }}>
                        This merchant has no active surplus listings.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                        {merchantListings.map(l => (
                          <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--sb-surface-soft, #F2F6EF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 4, padding: '8px 12px' }}>
                            <div>
                              <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--sb-text-primary, #182018)', margin: 0 }}>{l.title}</p>
                              <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: 'var(--sb-text-muted, #7A847A)', margin: '2px 0 0' }}>{l.quantity} {l.unit} · ₹{l.pricePerUnit}/{l.unit}</p>
                            </div>
                            <StatusBadge status={l.status} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Moderation Toggle CTA */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--sb-border, #D8E0D5)' }}>
                    <button
                      onClick={() => toggleUser(selectedMerchant.id)}
                      style={{
                        padding: '10px 20px', borderRadius: 4,
                        fontFamily: 'Work Sans, sans-serif', fontSize: 12, fontWeight: 600,
                        letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer',
                        border: '1px solid',
                        ...(selectedMerchant.active !== false
                          ? { color: 'var(--sb-danger, #A65C55)', borderColor: 'rgba(166,92,85,0.3)', background: 'rgba(166,92,85,0.1)' }
                          : { color: 'var(--sb-primary, #6F8F69)', borderColor: 'rgba(111,143,105,0.3)', background: 'rgba(111,143,105,0.1)' }
                        ),
                      }}
                    >
                      {selectedMerchant.active !== false ? 'Suspend Merchant Account' : 'Reactivate Merchant Account'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
