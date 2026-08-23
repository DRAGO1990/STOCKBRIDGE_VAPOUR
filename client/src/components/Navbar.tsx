import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Boxes,
  PlusCircle,
  Package,
  CalendarCheck,
  User as UserIcon,
  Shield,
  LogOut,
  Sparkles,
  ChevronDown,
  Menu,
  X,
  Compass,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';

const DEMO_ACCOUNTS = [
  { name: 'Rajesh Sharma', email: 'rajesh@demo.com', role: 'Mumbai Wholesale' },
  { name: 'Suresh Kumar', email: 'suresh@demo.com', role: 'Delhi Groceries' },
  { name: 'Lakshmi Rao', email: 'lakshmi@demo.com', role: 'Bangalore Fresh Foods' },
  { name: 'Admin', email: 'admin@stockbridge.com', role: 'Platform Admin' },
];

export const Navbar: React.FC = () => {
  const { user, logout, login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [switchingUser, setSwitchingUser] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await api.get('/messages/unread/count');
        setUnreadCount(res.data.count || 0);
      } catch (err) {
        // silent
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleQuickSwitch = async (email: string) => {
    setSwitchingUser(true);
    try {
      const res = await api.post('/auth/login', {
        email,
        password: 'password123',
      });
      const { user: loggedInUser, accessToken, refreshToken } = res.data;
      login(loggedInUser, accessToken, refreshToken);
      setMobileMenuOpen(false);
    } catch (err) {
      console.error('Quick switch failed', err);
    } finally {
      setSwitchingUser(false);
    }
  };

  const navLinks = [
    { name: 'Marketplace', path: '/', icon: Boxes },
    { name: 'Smart Match', path: '/match', icon: Sparkles },
    { name: 'Post Surplus', path: '/create-listing', icon: PlusCircle, authOnly: true },
    { name: 'My Listings', path: '/my-listings', icon: Package, authOnly: true },
    { name: 'Reservations', path: '/reservations', icon: CalendarCheck, authOnly: true, badge: unreadCount },
    { name: 'Admin Portal', path: '/admin', icon: Shield, adminOnly: true },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0F0B1A]/90 backdrop-blur-md border-b border-[#2B1F4D]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-400 p-0.5 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0F0B1A] rounded-[10px] flex items-center justify-center">
                <Compass className="text-purple-400 w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-white tracking-tight">Stock<span className="text-purple-400">Bridge</span></span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                  B2B
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block -mt-1">Surplus Inventory Exchange</p>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.authOnly && !user) return null;
              if (link.adminOnly && (!user || !user.isAdmin)) return null;

              const Icon = link.icon;
              const isActive = location.pathname === link.path;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-purple-400' : 'text-slate-400'} />
                  <span>{link.name}</span>
                  {Boolean(link.badge) && link.badge! > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full animate-bounce">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Controls / Demo Switcher */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                {/* Demo Quick Switcher Dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-1.5 text-xs bg-[#1A1330] hover:bg-[#2B1F4D] border border-[#2B1F4D] px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span className="max-w-[110px] truncate">{user.businessName || user.name}</span>
                    <ChevronDown size={12} className="text-slate-400" />
                  </button>

                  <div className="absolute right-0 mt-1 w-56 bg-[#1A1330] border border-[#2B1F4D] rounded-xl shadow-xl p-2 hidden group-hover:block group-focus-within:block z-50 animate-fade-in">
                    <div className="px-2 py-1.5 border-b border-[#2B1F4D]/60 mb-1">
                      <p className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">Quick Switch Demo User</p>
                    </div>
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        onClick={() => handleQuickSwitch(acc.email)}
                        disabled={switchingUser || user.email === acc.email}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex flex-col transition-colors ${
                          user.email === acc.email
                            ? 'bg-purple-500/20 text-purple-300 font-semibold cursor-default'
                            : 'text-slate-300 hover:bg-[#2B1F4D] hover:text-white cursor-pointer'
                        }`}
                      >
                        <span>{acc.name}</span>
                        <span className="text-[10px] text-slate-400">{acc.role}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Profile Link */}
                <Link
                  to="/profile"
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors"
                  title="My Profile"
                >
                  <UserIcon size={18} />
                </Link>

                {/* Logout */}
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-200 hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-sm font-semibold bg-purple-500 hover:bg-purple-400 text-navy-950 rounded-xl transition-all shadow-md shadow-purple-500/20"
                >
                  Register Business
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1A1330] border-b border-[#2B1F4D] px-4 pt-2 pb-6 space-y-3">
          <nav className="space-y-1">
            {navLinks.map((link) => {
              if (link.authOnly && !user) return null;
              if (link.adminOnly && (!user || !user.isAdmin)) return null;

              const Icon = link.icon;
              const isActive = location.pathname === link.path;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'bg-purple-500/20 text-purple-300 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={18} />
                    <span>{link.name}</span>
                  </div>
                  {Boolean(link.badge) && link.badge! > 0 && (
                    <span className="px-2 py-0.5 bg-rose-500 text-white text-xs font-bold rounded-full">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-[#2B1F4D]/60">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Logged in as: <strong className="text-white">{user.name}</strong></span>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                      navigate('/login');
                    }}
                    className="text-rose-400 font-semibold"
                  >
                    Logout
                  </button>
                </div>
                <div className="bg-[#0F0B1A] p-2 rounded-xl border border-[#2B1F4D]">
                  <p className="text-[10px] text-purple-400 font-semibold uppercase mb-1.5">Switch Demo Account</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        onClick={() => handleQuickSwitch(acc.email)}
                        className="text-left text-[11px] p-1.5 rounded bg-[#1A1330] hover:bg-[#2B1F4D] text-slate-300 truncate"
                      >
                        {acc.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm text-slate-200 bg-[#1A1330] rounded-xl"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-semibold bg-purple-500 text-navy-950 rounded-xl"
                >
                  Register Business
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
