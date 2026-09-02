import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Users, Package, CalendarCheck, CheckCircle, Search, Store, X, MapPin, Phone, Mail, ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import type { AdminStats, User, Listing } from '../types';
import { StatusBadge } from '../components/StatusBadges';
import { RatingStars } from '../components/RatingStars';

const TH: React.FC<{ children: React.ReactNode; right?: boolean }> = ({ children, right }) => (
  <th style={{
    padding: '12px 16px', textAlign: right ? 'right' : 'left',
    fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 600,
    letterSpacing: '0.06em', textTransform: 'uppercase', color: '#879391',
    background: '#1c1b1b', borderBottom: '1px solid #3d4947',
    whiteSpace: 'nowrap',
  }}>
    {children}
  </th>
);

const labelStyle: React.CSSProperties = {
  fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 600,
  letterSpacing: '0.06em', textTransform: 'uppercase', color: '#879391', marginBottom: 6, display: 'block',
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
    <div style={{ background: '#131313', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Shield size={16} color="#ffb4ab" />
              <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#ffb4ab' }}>
                Restricted Admin Command Center
              </span>
            </div>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 30, color: '#e5e2e1', letterSpacing: '-0.01em', marginBottom: 6 }}>
              Platform Operations
            </h1>
            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: '#bcc9c6', margin: 0 }}>
              Audit merchant registrations, moderate surplus listings, and supervise trade fulfillment.
            </p>
          </div>
          <Link to="/" style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#6bd8cb', textDecoration: 'none' }}>
            ← Back to Platform
          </Link>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #3d4947', marginBottom: 28 }} />

        {/* ── KPI cards ── */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1, background: '#3d4947', borderRadius: 8, overflow: 'hidden', marginBottom: 28 }}>
            {[
              { icon: <Users size={20} color="#6bd8cb" />, label: 'Total Users',        value: stats.users,        color: '#6bd8cb' },
              { icon: <Package size={20} color="#ddb7ff" />, label: 'Active Listings',  value: stats.listings,     color: '#ddb7ff' },
              { icon: <CalendarCheck size={20} color="#f6b351" />, label: 'Reservations', value: stats.reservations, color: '#f6b351' },
              { icon: <CheckCircle size={20} color="#6bd8cb" />, label: 'Completed',     value: stats.completed,    color: '#6bd8cb' },
            ].map(k => (
              <div key={k.label} style={{ background: '#1c1b1b', padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  {k.icon}
                  <p style={labelStyle}>{k.label}</p>
                </div>
                <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 32, color: k.color, margin: 0 }}>{k.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Table section ── */}
        <div style={{ background: '#1c1b1b', border: '1px solid #3d4947', borderRadius: 8, overflow: 'hidden' }}>
          {/* Section header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', borderBottom: '1px solid #3d4947', flexWrap: 'wrap', gap: 12,
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
                    color: activeTab === t ? '#6bd8cb' : '#bcc9c6',
                    background: 'transparent', border: 'none',
                    borderBottom: `2px solid ${activeTab === t ? '#6bd8cb' : 'transparent'}`,
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}
                >
                  {t === 'users' ? `Merchant Accounts (${users.length})` : `Surplus Listings (${listings.length})`}
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#2a2a2a', border: '1px solid #3d4947', borderRadius: 4, padding: '0 12px' }}>
              <Search size={14} color="#879391" />
              <input
                type="text" placeholder="Filter..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', padding: '9px 10px', fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#e5e2e1', width: 180 }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <div style={{ width: 32, height: 32, border: '2px solid #3d4947', borderTopColor: '#6bd8cb', borderRadius: '50%' }} className="animate-stitch-spin" />
            </div>
          ) : activeTab === 'users' ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <TH>Merchant / Business</TH>
                    <TH>Email / Contact</TH>
                    <TH>Trust Score</TH>
                    <TH>Lots / Orders</TH>
                    <TH>Status</TH>
                    <TH right>Actions</TH>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      style={{ borderBottom: '1px solid #3d4947', cursor: 'pointer' }}
                      onClick={() => setSelectedMerchant(u)}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(107,216,203,0.04)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 17, background: '#2a2a2a', border: '1px solid #3d4947', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 700, color: '#6bd8cb', flexShrink: 0 }}>
                            {(u.businessName || u.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, color: '#e5e2e1', margin: 0 }}>{u.businessName || u.name}</p>
                            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#879391', margin: '2px 0 0' }}>{u.name}{u.isAdmin && ' · Admin'}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#bcc9c6' }}>
                        <p style={{ margin: 0 }}>{u.email}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#879391' }}>{u.phone || 'No phone'}</p>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <RatingStars rating={u.rating || 5} size={12} />
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#bcc9c6' }}>
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
                              ? { color: '#ffb4ab', borderColor: 'rgba(255,180,171,0.3)', background: 'rgba(255,180,171,0.08)' }
                              : { color: '#6bd8cb', borderColor: 'rgba(107,216,203,0.3)', background: 'rgba(107,216,203,0.08)' }
                            ),
                          }}
                        >
                          {u.active !== false ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
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
                      style={{ borderBottom: '1px solid #3d4947' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(107,216,203,0.03)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 6, background: '#2a2a2a', border: '1px solid #3d4947', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {l.imageUrl ? <img src={l.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} /> : <Store size={16} color="#3d4947" />}
                          </div>
                          <div>
                            <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, color: '#e5e2e1', margin: '0 0 2px' }}>{l.title}</p>
                            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: '#879391', margin: 0 }}>#SB-{l.id.substring(0, 8).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#bcc9c6', background: 'rgba(188,201,198,0.1)', border: '1px solid rgba(188,201,198,0.15)', borderRadius: 4, padding: '3px 8px' }}>
                          {l.category}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, fontWeight: 600, color: '#e5e2e1', margin: 0 }}>{l.quantity} {l.unit}</p>
                        <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#6bd8cb', margin: '2px 0 0' }}>₹{l.pricePerUnit}/{l.unit}</p>
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
                              ? { color: '#f6b351', borderColor: 'rgba(246,179,81,0.3)', background: 'rgba(246,179,81,0.08)' }
                              : { color: '#6bd8cb', borderColor: 'rgba(107,216,203,0.3)', background: 'rgba(107,216,203,0.08)' }
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
              backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)',
              padding: 16,
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  background: '#1c1b1b', border: '1px solid #3d4947',
                  borderRadius: 8, width: '100%', maxWidth: 640,
                  maxHeight: '90vh', overflowY: 'auto',
                  boxShadow: '0 24px 48px rgba(0,0,0,0.7)',
                }}
              >
                {/* Header */}
                <div style={{
                  padding: '20px 24px', borderBottom: '1px solid #3d4947',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: '#29a195', color: '#003732',
                      fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {(selectedMerchant.businessName || selectedMerchant.name).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: '#e5e2e1', margin: 0 }}>
                        {selectedMerchant.businessName || selectedMerchant.name}
                      </h3>
                      <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#879391', margin: '2px 0 0' }}>
                        Merchant ID #M-{selectedMerchant.id.substring(0, 8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    style={{ background: 'transparent', border: 'none', color: '#879391', cursor: 'pointer', padding: 6 }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body Details */}
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  
                  {/* Status & Trust Overview */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, background: '#2a2a2a', border: '1px solid #3d4947', borderRadius: 6, padding: 16 }}>
                    <div>
                      <span style={labelStyle}>Account Status</span>
                      <StatusBadge status={selectedMerchant.active !== false ? 'active' : 'suspended'} />
                    </div>
                    <div>
                      <span style={labelStyle}>Trust Rating</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <RatingStars rating={selectedMerchant.rating || 5} size={12} />
                        <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 700, color: '#f6b351' }}>
                          {(selectedMerchant.rating || 5).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span style={labelStyle}>Role</span>
                      <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, fontWeight: 600, color: '#6bd8cb' }}>
                        {selectedMerchant.isAdmin ? 'Admin' : 'Verified Merchant'}
                      </span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={labelStyle}>Contact & Logistics</span>
                    <div style={{ background: '#131313', border: '1px solid #3d4947', borderRadius: 6, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#e5e2e1' }}>
                        <Mail size={14} color="#879391" /> {selectedMerchant.email}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#e5e2e1' }}>
                        <Phone size={14} color="#879391" /> {selectedMerchant.phone || 'No phone number on file'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#e5e2e1' }}>
                        <MapPin size={14} color="#879391" /> {selectedMerchant.address || 'Address unlisted'}
                      </div>
                    </div>
                  </div>

                  {/* Active listings by this merchant */}
                  <div>
                    <span style={labelStyle}>Active Lots Listed by Merchant ({merchantListings.length})</span>
                    {merchantListings.length === 0 ? (
                      <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#879391', margin: 0 }}>
                        This merchant has no active surplus listings.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                        {merchantListings.map(l => (
                          <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#2a2a2a', border: '1px solid #3d4947', borderRadius: 4, padding: '8px 12px' }}>
                            <div>
                              <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, color: '#e5e2e1', margin: 0 }}>{l.title}</p>
                              <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: '#879391', margin: '2px 0 0' }}>{l.quantity} {l.unit} · ₹{l.pricePerUnit}/{l.unit}</p>
                            </div>
                            <StatusBadge status={l.status} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Moderation Toggle CTA */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid #3d4947' }}>
                    <button
                      onClick={() => toggleUser(selectedMerchant.id)}
                      style={{
                        padding: '10px 20px', borderRadius: 4,
                        fontFamily: 'Work Sans, sans-serif', fontSize: 12, fontWeight: 600,
                        letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer',
                        border: '1px solid',
                        ...(selectedMerchant.active !== false
                          ? { color: '#ffb4ab', borderColor: 'rgba(255,180,171,0.3)', background: 'rgba(255,180,171,0.1)' }
                          : { color: '#6bd8cb', borderColor: 'rgba(107,216,203,0.3)', background: 'rgba(107,216,203,0.1)' }
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
