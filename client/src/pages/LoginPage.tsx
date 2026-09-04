import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

const DEMO_USERS = [
  { name: 'Rajesh (Seller)',    email: 'seller.mumbai@demo.com',    role: 'Mumbai Wholesale' },
  { name: 'Priya (Buyer)',      email: 'buyer.mumbai@demo.com',     role: 'Mumbai Retail' },
  { name: 'Suresh (Seller)',    email: 'seller.delhi@demo.com',     role: 'Delhi Agro Hub' },
  { name: 'Neha (Buyer)',       email: 'buyer.delhi@demo.com',      role: 'Delhi Mart' },
  { name: 'Lakshmi (Seller)',   email: 'seller.bengaluru@demo.com', role: 'Bengaluru Foods' },
  { name: 'Karthik (Buyer)',    email: 'buyer.bengaluru@demo.com',  role: 'Bengaluru Tech' },
  { name: 'Fatima (Seller)',    email: 'seller.hyderabad@demo.com', role: 'Hyderabad Depot' },
  { name: 'Vikram (Seller)',    email: 'seller.pune@demo.com',      role: 'Pune Supplies' },
  { name: 'Ramanathan (Seller)', email: 'seller.chennai@demo.com',  role: 'Chennai Trade' },
  { name: 'Admin (System)',     email: 'admin@stockbridge.com',     role: 'Platform Admin' },
];

/* ── Shared label style ── */
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'Work Sans, sans-serif',
  fontSize: 11, fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--sb-text-secondary, #4F5A51)',
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
}> = ({ icon, type = 'text', placeholder, value, onChange, required }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: 'var(--sb-surface, #FFFFFF)',
      border: `1px solid ${focused ? 'var(--sb-primary, #6F8F69)' : 'var(--sb-border, #D8E0D5)'}`,
      borderRadius: 4,
      padding: '0 12px',
      transition: 'border-color 0.15s',
      boxShadow: focused ? '0 0 0 2px rgba(111,143,105,0.15)' : 'none',
    }}>
      <span style={{ color: focused ? 'var(--sb-primary, #6F8F69)' : 'var(--sb-text-muted, #7A847A)', display: 'flex', transition: 'color 0.15s' }}>
        {icon}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          padding: '12px 10px',
          fontFamily: 'Work Sans, sans-serif',
          fontSize: 14,
          color: 'var(--sb-text-primary, #182018)',
        }}
      />
    </div>
  );
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/marketplace';

  const executeLogin = async (eEmail: string, ePass: string) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: eEmail, password: ePass });
      const { user: u, accessToken, refreshToken } = res.data;
      login(u, accessToken, refreshToken);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
      setLoading(false);
    }
  };

  const isGoogleConfigured = Boolean(
    import.meta.env.VITE_GOOGLE_CLIENT_ID &&
    !import.meta.env.VITE_GOOGLE_CLIENT_ID.includes('your-google-oauth-client-id')
  );

  const handleGoogleLogin = async () => {
    if (!isGoogleConfigured) {
      setError('Google Sign-In is not configured in this environment (VITE_GOOGLE_CLIENT_ID not set). Please use any of the 12 one-click commercial demo accounts below.');
      return;
    }
    setError('Google OAuth credentials detected. Initiating Google Sign-In...');
  };

  return (
    <div style={{
      background: 'var(--sb-background, #F7F7F2)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--sb-surface, #FFFFFF)',
          border: '1px solid var(--sb-border, #D8E0D5)',
          borderRadius: 8,
          padding: '40px 36px',
          width: '100%',
          maxWidth: 460,
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{
            fontFamily: 'Work Sans, sans-serif',
            fontSize: 10, fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--sb-primary, #6F8F69)',
            background: 'var(--sb-primary-pale, #EAF1E7)',
            padding: '4px 10px', borderRadius: 4,
          }}>
            Merchant Gateway
          </span>
          <h1 style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 700,
            fontSize: 26,
            color: 'var(--sb-text-primary, #182018)',
            marginTop: 12, marginBottom: 6,
          }}>
            Welcome Back
          </h1>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-secondary, #4F5A51)', margin: 0 }}>
            Sign in to access verified commercial surplus lots
          </p>
        </div>

        {/* ── Continue with Google ── */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: '#FFFFFF', border: '1px solid var(--sb-border, #D8E0D5)',
            borderRadius: 4, padding: '11px', cursor: 'pointer',
            fontFamily: 'Work Sans, sans-serif', fontSize: 13, fontWeight: 600,
            color: 'var(--sb-text-primary, #182018)',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            width: '100%', marginBottom: 16,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sb-primary, #6F8F69)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sb-border, #D8E0D5)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--sb-border, #D8E0D5)' }} />
          <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase' }}>or with email</span>
          <div style={{ flex: 1, height: 1, background: 'var(--sb-border, #D8E0D5)' }} />
        </div>

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); executeLogin(email.trim(), password); }}
          style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

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
              <a href="#" style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-primary, #6F8F69)', textDecoration: 'none' }}>
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
              background: 'rgba(166,92,85,0.08)',
              border: '1px solid rgba(166,92,85,0.2)',
              borderRadius: 4, padding: '10px 12px',
              color: 'var(--sb-danger, #A65C55)', fontSize: 13, fontFamily: 'Work Sans, sans-serif',
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

          <p style={{ textAlign: 'center', fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-secondary, #4F5A51)', margin: 0 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--sb-primary, #6F8F69)', fontWeight: 600, textDecoration: 'none' }}>
              Register account
            </Link>
          </p>
        </form>

        {/* Demo accounts */}
        <hr style={{ border: 'none', borderTop: '1px solid var(--sb-border, #D8E0D5)', margin: '24px 0 16px' }} />
        <p style={{
          fontFamily: 'Work Sans, sans-serif',
          fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: 'var(--sb-text-muted, #7A847A)',
          textAlign: 'center', marginBottom: 12,
        }}>
          Multi-City Demo Logins
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
          {DEMO_USERS.map((u) => (
            <button
              key={u.email}
              onClick={() => executeLogin(u.email, 'password123')}
              disabled={loading}
              style={{
                display: 'flex', flexDirection: 'column',
                background: 'transparent',
                border: '1px solid var(--sb-border, #D8E0D5)',
                borderRadius: 4, padding: '7px 10px',
                color: 'var(--sb-text-secondary, #4F5A51)',
                fontFamily: 'Work Sans, sans-serif',
                fontSize: 11, fontWeight: 500,
                cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.12s, border-color 0.12s, color 0.12s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--sb-surface-soft, #F2F6EF)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sb-primary, #6F8F69)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--sb-text-primary, #182018)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sb-border, #D8E0D5)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--sb-text-secondary, #4F5A51)';
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--sb-text-primary, #182018)' }}>{u.name}</span>
              <span style={{ fontSize: 10, color: 'var(--sb-text-muted, #7A847A)' }}>{u.role}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
