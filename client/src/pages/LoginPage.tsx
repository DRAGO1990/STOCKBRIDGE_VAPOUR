import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Store, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

const DEMO_USERS = [
  { name: 'Rajesh (Distributor)', email: 'rajesh@demo.com',         role: 'Mumbai Wholesale' },
  { name: 'Suresh (Retailer)',    email: 'suresh@demo.com',          role: 'Delhi Groceries' },
  { name: 'Lakshmi (Supplier)',   email: 'lakshmi@demo.com',         role: 'Bangalore Fresh' },
  { name: 'Admin (System)',       email: 'admin@stockbridge.com',    role: 'Platform Admin' },
];

/* ── Shared label style ── */
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'Work Sans, sans-serif',
  fontSize: 11, fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#bcc9c6',
  marginBottom: 6,
};

/* ── Input wrapper with icon ── */
const InputRow: React.FC<{
  icon: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  rightElement?: React.ReactNode;
}> = ({ icon, type = 'text', placeholder, value, onChange, required, rightElement }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: '#2a2a2a',
      border: `1px solid ${focused ? '#6bd8cb' : '#3d4947'}`,
      borderRadius: 4,
      padding: '0 12px',
      transition: 'border-color 0.15s',
      boxShadow: focused ? '0 0 0 2px rgba(107,216,203,0.1)' : 'none',
    }}>
      <span style={{ color: focused ? '#6bd8cb' : '#879391', display: 'flex', transition: 'color 0.15s' }}>
        {icon}
      </span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none', outline: 'none',
          padding: '11px 10px',
          fontFamily: 'Work Sans, sans-serif',
          fontSize: 14, color: '#e5e2e1',
        }}
      />
      {rightElement}
    </div>
  );
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const executeLogin = async (e: string, p: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email: e, password: p });
      const { user, accessToken, refreshToken } = res.data;
      login(user, accessToken, refreshToken);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      background: '#131313',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          width: '100%', maxWidth: 440,
          background: '#1c1b1b',
          border: '1px solid #3d4947',
          borderRadius: 8,
          padding: '40px 40px 36px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 700, fontSize: 28,
            color: '#e5e2e1',
            lineHeight: 1.3,
            marginBottom: 8,
          }}>
            Welcome back to<br />StockBridge
          </h1>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: '#bcc9c6' }}>
            Sign in to manage your stock and orders
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #3d4947', marginBottom: 28 }} />

        {/* Form */}
        <form onSubmit={e => { e.preventDefault(); executeLogin(email.trim(), password); }}
          style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div>
            <label style={labelStyle}>Registered Email</label>
            <InputRow
              icon={<Mail size={16} />}
              type="email" placeholder="you@company.com"
              value={email} onChange={setEmail} required
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
              <a href="#" style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#6bd8cb', textDecoration: 'none' }}>
                Forgot?
              </a>
            </div>
            <InputRow
              icon={<Lock size={16} />}
              type="password" placeholder="••••••••"
              value={password} onChange={setPassword} required
            />
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,180,171,0.08)',
              border: '1px solid rgba(255,180,171,0.2)',
              borderRadius: 4, padding: '10px 12px',
              color: '#ffb4ab', fontSize: 13, fontFamily: 'Work Sans, sans-serif',
            }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="stitch-btn-primary"
            style={{ padding: '13px', width: '100%', fontSize: 13, letterSpacing: '0.06em', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>

          <p style={{ textAlign: 'center', fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#bcc9c6' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#6bd8cb', fontWeight: 600, textDecoration: 'none' }}>
              Register account
            </Link>
          </p>
        </form>

        {/* Demo accounts */}
        <hr style={{ border: 'none', borderTop: '1px solid #3d4947', margin: '28px 0 20px' }} />
        <p style={{
          fontFamily: 'Work Sans, sans-serif',
          fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: '#879391',
          textAlign: 'center', marginBottom: 14,
        }}>
          Quick Demo Access
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {DEMO_USERS.map(u => (
            <button
              key={u.email}
              onClick={() => executeLogin(u.email, 'password123')}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'transparent',
                border: '1px solid #3d4947',
                borderRadius: 4, padding: '9px 12px',
                color: '#bcc9c6',
                fontFamily: 'Work Sans, sans-serif',
                fontSize: 12, fontWeight: 500,
                cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.12s, border-color 0.12s, color 0.12s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#6bd8cb';
                (e.currentTarget as HTMLButtonElement).style.color = '#e5e2e1';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#3d4947';
                (e.currentTarget as HTMLButtonElement).style.color = '#bcc9c6';
              }}
            >
              <User size={14} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.name}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
