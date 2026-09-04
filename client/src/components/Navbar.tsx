import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  User as UserIcon,
  Menu,
  X,
  MapPin,
  ChevronDown,
  LogOut,
  Settings,
  Store,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';

const DEMO_ACCOUNTS = [
  { name: 'Rajesh (Distributor)', email: 'rajesh@demo.com', initials: 'RD' },
  { name: 'Suresh (Retailer)',    email: 'suresh@demo.com',  initials: 'SR' },
  { name: 'Lakshmi (Supplier)',   email: 'lakshmi@demo.com', initials: 'LS' },
  { name: 'Admin (System)',       email: 'admin@stockbridge.com', initials: 'AD' },
];

type NavLink = {
  name: string;
  path: string;
  authOnly?: boolean;
  adminOnly?: boolean;
  badge?: number;
};

export const Navbar: React.FC = () => {
  const { user, logout, login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await api.get('/messages/unread/count');
        setUnreadCount(res.data.count || 0);
      } catch { /* silent */ }
    };
    fetchUnread();
    const iv = setInterval(fetchUnread, 10000);
    return () => clearInterval(iv);
  }, [user]);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleQuickSwitch = async (email: string) => {
    setSwitching(true);
    try {
      const res = await api.post('/auth/login', { email, password: 'password123' });
      const { user: u, accessToken, refreshToken } = res.data;
      login(u, accessToken, refreshToken);
    } catch (e) {
      console.error(e);
    } finally {
      setSwitching(false);
      setUserMenuOpen(false);
    }
  };

  const navLinks: NavLink[] = user
    ? [
        { name: 'How It Works', path: '/how-it-works' },
        { name: 'Market',       path: '/marketplace' },
        { name: 'Sell Stock',   path: '/create-listing' },
        { name: 'My Stock',     path: '/my-listings',    authOnly: true },
        { name: 'Orders',       path: '/reservations',   authOnly: true, badge: unreadCount },
        { name: 'Admin Portal', path: '/admin',           adminOnly: true },
      ]
    : [
        { name: 'How It Works', path: '/how-it-works' },
        { name: 'Market',       path: '/market-preview' },
      ];

  const visibleLinks = navLinks.filter(l => {
    if (l.authOnly && !user) return false;
    if (l.adminOnly && (!user || !user.isAdmin)) return false;
    return true;
  });

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'var(--sb-surface, #FFFFFF)',
        borderBottom: '1px solid var(--sb-border, #D8E0D5)',
      }}
    >
      <div className="max-w-screen-xl mx-auto px-6 flex items-center justify-between h-14">

        {/* ── Left Side: Brand Logo + Desktop Nav ── */}
        <div className="flex items-center gap-8">
          {/* ── Brand Logo ── */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            {/* Stitch-style square icon */}
            <div style={{
              width: 32, height: 32,
              background: 'var(--sb-surface-soft, #F2F6EF)',
              border: '1px solid var(--sb-border, #D8E0D5)',
              borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Store size={16} color="var(--sb-primary, #6F8F69)" />
            </div>
            <span style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 700,
              fontSize: 18,
              color: 'var(--sb-primary, #6F8F69)',
              letterSpacing: '-0.01em',
            }}>
              StockBridge
            </span>
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--sb-text-secondary, #4F5A51)',
              background: 'var(--sb-surface-soft, #F2F6EF)',
              border: '1px solid var(--sb-border, #D8E0D5)',
              padding: '2px 6px',
              borderRadius: 4,
            }}>
              B2B
            </span>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <nav className="hidden md:flex items-center gap-1">
            {visibleLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    position: 'relative',
                    padding: '0 14px',
                    height: 56,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'Work Sans, sans-serif',
                    fontSize: 14,
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                    color: active ? 'var(--sb-primary, #6F8F69)' : 'var(--sb-text-secondary, #4F5A51)',
                    textDecoration: 'none',
                    transition: 'color 0.15s ease',
                    borderBottom: active ? '2px solid var(--sb-primary, #6F8F69)' : '2px solid transparent',
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLAnchorElement).style.color = 'var(--sb-text-primary, #182018)';
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLAnchorElement).style.color = 'var(--sb-text-secondary, #4F5A51)';
                  }}
                >
                  {link.name}
                  {link.badge && link.badge > 0 ? (
                    <span style={{
                      background: 'var(--sb-primary, #6F8F69)',
                      color: '#FFFFFF',
                      fontSize: 10, fontWeight: 700,
                      borderRadius: '50%',
                      width: 17, height: 17,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {link.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ── Right Controls ── */}
        <div className="hidden md:flex items-center gap-3">
          {/* Location pill (shown when logged in) */}
          {user && (
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'transparent',
              border: '1px solid var(--sb-border, #D8E0D5)',
              borderRadius: 20,
              padding: '5px 12px',
              color: 'var(--sb-text-secondary, #4F5A51)',
              fontFamily: 'Work Sans, sans-serif',
              fontSize: 12, fontWeight: 500,
              letterSpacing: '0.03em',
              cursor: 'pointer',
              textTransform: 'uppercase',
              transition: 'border-color 0.15s, color 0.15s',
            }}>
              <MapPin size={12} color="var(--sb-primary, #6F8F69)" />
              Mumbai · Within 25 km
            </button>
          )}

          {/* Bell (shown only when logged in) */}
          {user && (
            <button
              style={{
                width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent',
                border: '1px solid var(--sb-border, #D8E0D5)',
                borderRadius: 18,
                color: 'var(--sb-text-secondary, #4F5A51)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--sb-text-primary, #182018)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--sb-text-secondary, #4F5A51)'; }}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 7, height: 7,
                  borderRadius: '50%',
                  background: 'var(--sb-primary, #6F8F69)',
                }} />
              )}
            </button>
          )}

          {/* User / Auth */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                style={{
                  width: 36, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--sb-primary, #6F8F69)',
                  borderRadius: 18,
                  color: '#FFFFFF',
                  fontFamily: 'Sora, sans-serif',
                  fontSize: 13, fontWeight: 700,
                  border: 'none', cursor: 'pointer',
                }}
              >
                {(user.name || 'U').charAt(0).toUpperCase()}
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                      width: 240,
                      background: 'var(--sb-surface, #FFFFFF)',
                      border: '1px solid var(--sb-border, #D8E0D5)',
                      borderRadius: 8,
                      padding: '8px',
                      boxShadow: '0 12px 28px rgba(0,0,0,0.08)',
                      zIndex: 100,
                    }}
                  >
                    {/* User info */}
                    <div style={{ padding: '8px 10px 12px', borderBottom: '1px solid var(--sb-border, #D8E0D5)', marginBottom: 8 }}>
                      <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--sb-text-primary, #182018)' }}>
                        {user.businessName || user.name}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--sb-text-muted, #7A847A)', marginTop: 2 }}>{user.email}</p>
                    </div>

                    {/* Quick switch */}
                    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--sb-primary, #6F8F69)', padding: '0 10px', marginBottom: 6 }}>
                      Quick Demo Switch
                    </p>
                    {DEMO_ACCOUNTS.map(acc => (
                      <button
                        key={acc.email}
                        onClick={() => handleQuickSwitch(acc.email)}
                        disabled={switching || user.email === acc.email}
                        style={{
                          width: '100%',
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 10px',
                          borderRadius: 6,
                          background: user.email === acc.email ? 'var(--sb-primary-pale, #EAF1E7)' : 'transparent',
                          border: 'none',
                          color: user.email === acc.email ? 'var(--sb-primary, #6F8F69)' : 'var(--sb-text-secondary, #4F5A51)',
                          fontFamily: 'Work Sans, sans-serif',
                          fontSize: 13, fontWeight: 500,
                          cursor: user.email === acc.email ? 'default' : 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => {
                          if (user.email !== acc.email) (e.currentTarget as HTMLButtonElement).style.background = 'var(--sb-surface-soft, #F2F6EF)';
                        }}
                        onMouseLeave={e => {
                          if (user.email !== acc.email) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        }}
                      >
                        <span style={{
                          width: 28, height: 28, borderRadius: 14,
                          background: 'var(--sb-surface-soft, #F2F6EF)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700,
                          color: 'var(--sb-primary, #6F8F69)', flexShrink: 0,
                        }}>{acc.initials}</span>
                        <span>{acc.name}</span>
                      </button>
                    ))}

                    <div style={{ borderTop: '1px solid var(--sb-border, #D8E0D5)', marginTop: 8, paddingTop: 8 }}>
                      <button
                        onClick={() => { logout(); navigate('/login'); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 10px', borderRadius: 6,
                          background: 'transparent', border: 'none',
                          color: 'var(--sb-danger, #A65C55)', fontFamily: 'Work Sans, sans-serif',
                          fontSize: 13, fontWeight: 500, cursor: 'pointer',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(166,92,85,0.08)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        <LogOut size={14} />
                        Log Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                style={{
                  fontFamily: 'Work Sans, sans-serif',
                  fontSize: 14, fontWeight: 500,
                  color: 'var(--sb-text-primary, #182018)', textDecoration: 'none',
                  padding: '6px 12px',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--sb-primary, #6F8F69)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--sb-text-primary, #182018)'; }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="stitch-btn-primary"
                style={{ padding: '7px 16px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* ── Mobile menu toggle ── */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(v => !v)}
          style={{
            width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 6,
            color: 'var(--sb-text-primary, #182018)', cursor: 'pointer',
          }}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', borderTop: '1px solid var(--sb-border, #D8E0D5)', background: 'var(--sb-surface, #FFFFFF)' }}
          >
            <div style={{ padding: '12px 24px 20px' }}>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {visibleLinks.map(link => {
                  const active = isActive(link.path);
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileOpen(false)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 6,
                        fontFamily: 'Work Sans, sans-serif',
                        fontSize: 14, fontWeight: 500,
                        color: active ? 'var(--sb-primary, #6F8F69)' : 'var(--sb-text-secondary, #4F5A51)',
                        background: active ? 'var(--sb-primary-pale, #EAF1E7)' : 'transparent',
                        textDecoration: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}
                    >
                      {link.name}
                      {link.badge && link.badge > 0 ? (
                        <span style={{
                          background: 'var(--sb-primary, #6F8F69)', color: '#FFFFFF',
                          fontSize: 10, fontWeight: 700,
                          borderRadius: 10, padding: '1px 6px',
                        }}>{link.badge}</span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>

              <div style={{ borderTop: '1px solid var(--sb-border, #D8E0D5)', marginTop: 12, paddingTop: 12 }}>
                {user ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ fontSize: 13, color: 'var(--sb-text-secondary, #4F5A51)' }}>
                      Logged in as <strong style={{ color: 'var(--sb-text-primary, #182018)' }}>{user.name}</strong>
                    </p>
                    <button
                      onClick={() => { logout(); navigate('/login'); setMobileOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        color: 'var(--sb-danger, #A65C55)', background: 'none', border: 'none',
                        fontFamily: 'Work Sans, sans-serif', fontSize: 13,
                        cursor: 'pointer', padding: '6px 0',
                      }}
                    >
                      <LogOut size={14} /> Log Out
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Link to="/login" onClick={() => setMobileOpen(false)}
                      style={{
                        display: 'block', textAlign: 'center', padding: '10px',
                        borderRadius: 6, border: '1px solid var(--sb-border, #D8E0D5)',
                        color: 'var(--sb-text-primary, #182018)', fontFamily: 'Work Sans, sans-serif',
                        fontSize: 14, textDecoration: 'none',
                      }}>
                      Sign In
                    </Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)}
                      className="stitch-btn-primary"
                      style={{ display: 'block', textAlign: 'center', padding: '10px', textDecoration: 'none' }}>
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
