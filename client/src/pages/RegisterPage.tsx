import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Store, Mail, Phone, Lock, MapPin, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'Work Sans, sans-serif',
  fontSize: 11, fontWeight: 600,
  letterSpacing: '0.06em', textTransform: 'uppercase',
  color: '#bcc9c6', marginBottom: 6,
};

type InputFieldProps = {
  icon: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
};

const InputField: React.FC<InputFieldProps> = ({ icon, type = 'text', placeholder, value, onChange, required, minLength }) => {
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
      <span style={{ color: focused ? '#6bd8cb' : '#879391', display: 'flex', transition: 'color 0.15s', flexShrink: 0 }}>
        {icon}
      </span>
      <input
        type={type} value={value} required={required}
        minLength={minLength}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1, background: 'transparent',
          border: 'none', outline: 'none',
          padding: '11px 10px',
          fontFamily: 'Work Sans, sans-serif',
          fontSize: 14, color: '#e5e2e1',
        }}
      />
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '',
    businessName: '', address: 'Andheri West, Mumbai',
    lat: 19.076, lng: 72.877,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key: string) => (v: string) => setFormData(f => ({ ...f, [key]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', { ...formData, lat: Number(formData.lat), lng: Number(formData.lng) });
      const { user, accessToken, refreshToken } = res.data;
      login(user, accessToken, refreshToken);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed.');
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
          width: '100%', maxWidth: 500,
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
            color: '#e5e2e1', lineHeight: 1.3, marginBottom: 8,
          }}>
            Register your business
          </h1>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: '#bcc9c6' }}>
            Create your StockBridge merchant account
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #3d4947', marginBottom: 28 }} />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Name + Business */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Contact Person Name</label>
              <InputField icon={<User size={16} />} placeholder="e.g. Rahul Sharma" value={formData.name} onChange={set('name')} required />
            </div>
            <div>
              <label style={labelStyle}>Business / Entity Name</label>
              <InputField icon={<Store size={16} />} placeholder="e.g. Sharma Traders" value={formData.businessName} onChange={set('businessName')} required />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email Address</label>
            <InputField icon={<Mail size={16} />} type="email" placeholder="rahul@sharmatraders.in" value={formData.email} onChange={set('email')} required />
          </div>

          {/* Phone */}
          <div>
            <label style={labelStyle}>Phone Number</label>
            <InputField icon={<Phone size={16} />} type="tel" placeholder="+91 90000 00000" value={formData.phone} onChange={set('phone')} />
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>Secure Password</label>
            <InputField icon={<Lock size={16} />} type="password" placeholder="••••••••" value={formData.password} onChange={set('password')} required minLength={6} />
          </div>

          {/* Address */}
          <div>
            <label style={labelStyle}>Warehouse / Shop Location Address</label>
            <div style={{
              background: '#2a2a2a',
              border: '1px solid #3d4947',
              borderRadius: 4, padding: '0 12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingTop: 11 }}>
                <MapPin size={16} color="#879391" style={{ marginTop: 2, flexShrink: 0 }} />
                <textarea
                  value={formData.address}
                  onChange={e => setFormData(f => ({ ...f, address: e.target.value }))}
                  placeholder="Enter complete address..."
                  rows={3}
                  style={{
                    flex: 1, background: 'transparent',
                    border: 'none', outline: 'none', resize: 'none',
                    fontFamily: 'Work Sans, sans-serif',
                    fontSize: 14, color: '#e5e2e1',
                    padding: '0 0 10px',
                  }}
                />
              </div>
            </div>
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
            style={{
              padding: '13px', width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontSize: 13, letterSpacing: '0.06em',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Creating Account...' : <>Create Business Account <ArrowRight size={16} /></>}
          </button>

          <p style={{ textAlign: 'center', fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#bcc9c6' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#6bd8cb', fontWeight: 600, textDecoration: 'none' }}>
              Sign In
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};
