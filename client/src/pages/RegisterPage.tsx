import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Phone, User, Store, MapPin, AlertCircle, ShieldCheck, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { SUPPORTED_LOCATIONS } from '../config/locations';

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'Work Sans, sans-serif',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--sb-text-secondary, #4F5A51)',
  marginBottom: 6,
};

const InputField: React.FC<{
  icon: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}> = ({ icon, type = 'text', placeholder, value, onChange, required }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--sb-surface, #FFFFFF)',
        border: `1px solid ${focused ? 'var(--sb-primary, #6F8F69)' : 'var(--sb-border, #D8E0D5)'}`,
        borderRadius: 4,
        padding: '0 12px',
        transition: 'border-color 0.15s',
        boxShadow: focused ? '0 0 0 2px rgba(111,143,105,0.15)' : 'none',
      }}
    >
      <span
        style={{
          color: focused ? 'var(--sb-primary, #6F8F69)' : 'var(--sb-text-muted, #7A847A)',
          display: 'flex',
          transition: 'color 0.15s',
        }}
      >
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
          padding: '11px 10px',
          fontFamily: 'Work Sans, sans-serif',
          fontSize: 14,
          color: 'var(--sb-text-primary, #182018)',
        }}
      />
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    businessName: '',
    address: 'Andheri East, Mumbai (MH)',
    lat: 19.076,
    lng: 72.877,
    idDocumentType: 'PAN' as 'PAN' | 'Aadhaar',
    idDocumentNumber: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key: string) => (v: string) => setFormData((f) => ({ ...f, [key]: v }));

  const handleCityChange = (cityName: string) => {
    const loc = SUPPORTED_LOCATIONS.find((l) => l.name === cityName);
    if (loc) {
      setFormData((f) => ({
        ...f,
        address: `${loc.areas[0]}, ${loc.name}`,
        lat: loc.lat,
        lng: loc.lng,
      }));
    }
  };

  const isGoogleConfigured = Boolean(
    import.meta.env.VITE_GOOGLE_CLIENT_ID &&
    !import.meta.env.VITE_GOOGLE_CLIENT_ID.includes('your-google-oauth-client-id')
  );

  const handleGoogleRegister = async () => {
    if (!isGoogleConfigured) {
      setError('Google Sign-Up is not configured in this environment (VITE_GOOGLE_CLIENT_ID not set). Please register with your email or log in with a pre-configured demo account.');
      return;
    }
    setError('Google OAuth credentials detected. Initiating Google Sign-Up...');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', {
        ...formData,
        lat: Number(formData.lat),
        lng: Number(formData.lng),
      });
      const { user, accessToken, refreshToken } = res.data;
      login(user, accessToken, refreshToken);
      navigate('/marketplace');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 56px)',
        background: 'var(--sb-background, #F7F7F2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          width: '100%',
          maxWidth: 540,
          background: 'var(--sb-surface, #FFFFFF)',
          border: '1px solid var(--sb-border, #D8E0D5)',
          borderRadius: 8,
          padding: '40px 36px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 700,
              fontSize: 26,
              color: 'var(--sb-text-primary, #182018)',
              lineHeight: 1.3,
              marginBottom: 6,
            }}
          >
            Register your business
          </h1>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-secondary, #4F5A51)', margin: 0 }}>
            Create your StockBridge verified merchant account
          </p>
        </div>

        {/* ── Continue with Google ── */}
        <button
          type="button"
          onClick={handleGoogleRegister}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            background: '#FFFFFF',
            border: '1px solid var(--sb-border, #D8E0D5)',
            borderRadius: 4,
            padding: '11px',
            cursor: 'pointer',
            fontFamily: 'Work Sans, sans-serif',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--sb-text-primary, #182018)',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            width: '100%',
            marginBottom: 16,
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
          {!isGoogleConfigured && (
            <span style={{ fontSize: 10, color: 'var(--sb-text-muted, #7A847A)', marginLeft: 'auto' }}>
              (OAuth Not Configured)
            </span>
          )}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--sb-border, #D8E0D5)' }} />
          <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase' }}>or register with email</span>
          <div style={{ flex: 1, height: 1, background: 'var(--sb-border, #D8E0D5)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Name + Business */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Contact Person</label>
              <InputField icon={<User size={16} />} placeholder="e.g. Rahul Sharma" value={formData.name} onChange={set('name')} required />
            </div>
            <div>
              <label style={labelStyle}>Business Name</label>
              <InputField icon={<Store size={16} />} placeholder="e.g. Sharma Traders" value={formData.businessName} onChange={set('businessName')} required />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Business Email</label>
            <InputField icon={<Mail size={16} />} type="email" placeholder="trade@company.com" value={formData.email} onChange={set('email')} required />
          </div>

          {/* Phone + Password */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Phone Number</label>
              <InputField icon={<Phone size={16} />} placeholder="98XXXXXXXX" value={formData.phone} onChange={set('phone')} required />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <InputField icon={<Lock size={16} />} type="password" placeholder="At least 6 chars" value={formData.password} onChange={set('password')} required />
            </div>
          </div>

          {/* Commercial Hub / Location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Commercial Hub</label>
              <div style={{
                display: 'flex', alignItems: 'center', background: 'var(--sb-surface, #FFFFFF)',
                border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 4, padding: '0 10px',
              }}>
                <MapPin size={16} color="var(--sb-primary, #6F8F69)" />
                <select
                  onChange={(e) => handleCityChange(e.target.value)}
                  style={{
                    width: '100%', background: 'transparent', border: 'none', outline: 'none',
                    padding: '11px 6px', fontFamily: 'Work Sans, sans-serif', fontSize: 13,
                    color: 'var(--sb-text-primary, #182018)', cursor: 'pointer',
                  }}
                >
                  {SUPPORTED_LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.name}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Warehouse / Shop Area</label>
              <InputField icon={<MapPin size={16} />} placeholder="Area & City" value={formData.address} onChange={set('address')} required />
            </div>
          </div>

          {/* Identity Verification Section (PAN / Aadhaar) */}
          <div style={{
            background: 'var(--sb-surface-soft, #F2F6EF)',
            border: '1px solid var(--sb-border, #D8E0D5)',
            borderRadius: 6, padding: '16px', marginTop: 4,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <ShieldCheck size={18} color="var(--sb-primary, #6F8F69)" />
              <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--sb-text-primary, #182018)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Identity Verification (KYC)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Document Type</label>
                <select
                  value={formData.idDocumentType}
                  onChange={(e) => setFormData((f) => ({ ...f, idDocumentType: e.target.value as 'PAN' | 'Aadhaar' }))}
                  style={{
                    width: '100%', background: 'var(--sb-surface, #FFFFFF)',
                    border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 4,
                    padding: '11px 10px', fontFamily: 'Work Sans, sans-serif', fontSize: 13,
                    color: 'var(--sb-text-primary, #182018)', outline: 'none',
                  }}
                >
                  <option value="PAN">PAN Card</option>
                  <option value="Aadhaar">Aadhaar Card</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>
                  {formData.idDocumentType === 'PAN' ? 'PAN Number (e.g. ABCDE1234F)' : 'Aadhaar Number (12 Digits)'}
                </label>
                <InputField
                  icon={<FileText size={16} />}
                  placeholder={formData.idDocumentType === 'PAN' ? 'ABCDE1234F' : 'XXXX XXXX 1234'}
                  value={formData.idDocumentNumber}
                  onChange={set('idDocumentNumber')}
                />
              </div>
            </div>
            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: 'var(--sb-text-muted, #7A847A)', margin: '8px 0 0' }}>
              🔒 Document numbers are securely stored and masked. Never shared on public listings.
            </p>
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(166,92,85,0.08)', border: '1px solid rgba(166,92,85,0.2)',
              borderRadius: 4, padding: '10px 12px', color: 'var(--sb-danger, #A65C55)',
              fontSize: 13, fontFamily: 'Work Sans, sans-serif',
            }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="stitch-btn-primary"
            style={{
              padding: '13px', fontSize: 13, letterSpacing: '0.06em',
              opacity: loading ? 0.6 : 1, width: '100%', cursor: 'pointer', marginTop: 4,
            }}
          >
            {loading ? 'Creating Merchant Account...' : 'Register Business'}
          </button>

          <p style={{ textAlign: 'center', fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-secondary, #4F5A51)', margin: 0 }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: 'var(--sb-primary, #6F8F69)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};
