import React, { useEffect, useState } from 'react';
import {
  Building2, Phone, Mail, MapPin, ShieldCheck, Star, Save, CheckCircle, Clock
} from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import type { User, Rating } from '../types';
import { RatingStars } from '../components/RatingStars';

const labelStyle: React.CSSProperties = {
  fontFamily: 'Work Sans, sans-serif',
  fontSize: 11, fontWeight: 600,
  letterSpacing: '0.06em', textTransform: 'uppercase',
  color: 'var(--sb-text-muted, #7A847A)', marginBottom: 8, display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)',
  borderRadius: 4, padding: '11px 14px',
  fontFamily: 'Work Sans, sans-serif',
  fontSize: 14, color: 'var(--sb-text-primary, #182018)', outline: 'none',
};

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    businessName: '',
    address: '',
    lat: 19.076,
    lng: 72.877,
    idDocumentType: 'PAN',
    idDocumentNumber: '',
  });

  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    api
      .get('/auth/me')
      .then((res) => {
        const u = res.data;
        setFormData({
          name: u.name || '',
          phone: u.phone || '',
          businessName: u.businessName || '',
          address: u.address || '',
          lat: u.lat || 19.076,
          lng: u.lng || 72.877,
          idDocumentType: u.idDocumentType || 'PAN',
          idDocumentNumber: u.idDocumentNumber || '',
        });
        updateUser(u);
        return api.get(`/ratings/user/${u.id}`);
      })
      .then((res) => {
        setRatings(res.data);
      })
      .catch((err) => console.error('Failed to load profile data', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await api.put('/auth/profile', {
        name: formData.name,
        phone: formData.phone,
        businessName: formData.businessName,
        address: formData.address,
        lat: Number(formData.lat),
        lng: Number(formData.lng),
        idDocumentType: formData.idDocumentType,
        idDocumentNumber: formData.idDocumentNumber,
      });
      updateUser(res.data);
      setSuccessMsg('Profile and location settings updated successfully.');
    } catch (err: any) {
      console.error('Update profile error', err);
      setErrorMsg(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const isVerified = user.verificationStatus === 'verified';
  const isUnderReview = user.verificationStatus === 'under_review';

  return (
    <div style={{ background: 'var(--sb-background, #F7F7F2)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 80px' }}>
        
        {/* ── Merchant Header Card ── */}
        <div style={{
          background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)',
          borderRadius: 8, padding: '24px 28px', marginBottom: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 28,
              background: 'var(--sb-primary-soft, #DCE8D8)', color: 'var(--sb-primary, #6F8F69)',
              fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {(user.businessName || user.name).charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--sb-text-primary, #182018)', margin: 0 }}>
                  {user.businessName || user.name}
                </h1>
                {isVerified ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: 'var(--sb-primary-pale, #EAF1E7)', border: '1px solid var(--sb-primary-soft, #DCE8D8)',
                    borderRadius: 4, padding: '2px 8px',
                    fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600,
                    color: 'var(--sb-primary, #6F8F69)', textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    <ShieldCheck size={11} /> Verified
                  </span>
                ) : isUnderReview ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: '#FFF8EB', border: '1px solid #FDE68A',
                    borderRadius: 4, padding: '2px 8px',
                    fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600,
                    color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    <Clock size={11} /> Under Review
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: '#F3F4F6', border: '1px solid #E5E7EB',
                    borderRadius: 4, padding: '2px 8px',
                    fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600,
                    color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    <Clock size={11} /> Pending Verification
                  </span>
                )}
              </div>
              <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-muted, #7A847A)', margin: 0 }}>
                {user.email} · Registered Merchant
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={labelStyle}>Trust Score</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RatingStars rating={user.rating || 5} size={16} />
              <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--sb-warning, #B88A45)' }}>
                {(user.rating || 5).toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Grid: Edit Form & Reviews ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
          
          {/* Form */}
          <div style={{ background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 8, padding: '28px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 18, color: 'var(--sb-text-primary, #182018)', margin: '0 0 20px' }}>
              Merchant Profile & Location
            </h2>

            {successMsg && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
                background: 'var(--sb-primary-pale, #EAF1E7)', border: '1px solid var(--sb-primary-soft, #DCE8D8)',
                borderRadius: 4, color: 'var(--sb-success, #557A55)', fontFamily: 'Work Sans, sans-serif',
                fontSize: 13, marginBottom: 20,
              }}>
                <CheckCircle size={15} /> {successMsg}
              </div>
            )}

            {errorMsg && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
                background: 'rgba(166,92,85,0.08)', border: '1px solid rgba(166,92,85,0.25)',
                borderRadius: 4, color: 'var(--sb-danger, #A65C55)', fontFamily: 'Work Sans, sans-serif',
                fontSize: 13, marginBottom: 20,
              }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle}>Business / Firm Name</label>
                <input
                  type="text" value={formData.businessName}
                  onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="e.g. Sharma Kirana & Wholesale"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Contact Person</label>
                  <input
                    type="text" required value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <input
                    type="tel" value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Physical Warehouse / Store Address</label>
                <textarea
                  rows={3} value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, Landmark, Market Area, City, Pin"
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Latitude (GPS)</label>
                  <input
                    type="number" step="any" value={formData.lat}
                    onChange={e => setFormData({ ...formData, lat: Number(e.target.value) })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Longitude (GPS)</label>
                  <input
                    type="number" step="any" value={formData.lng}
                    onChange={e => setFormData({ ...formData, lng: Number(e.target.value) })}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Identity Verification (KYC) Section */}
              <div style={{
                background: 'var(--sb-surface-soft, #F2F6EF)',
                border: '1px solid var(--sb-border, #D8E0D5)',
                borderRadius: 6,
                padding: '16px 18px',
                marginTop: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--sb-text-primary, #182018)' }}>
                    Government Identity Verification (KYC)
                  </span>
                  <span style={{
                    fontSize: 11,
                    fontFamily: 'Work Sans, sans-serif',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: isVerified ? 'var(--sb-primary-pale, #EAF1E7)' : isUnderReview ? '#FFF8EB' : '#F3F4F6',
                    color: isVerified ? 'var(--sb-primary, #6F8F69)' : isUnderReview ? '#B45309' : '#6B7280',
                    border: `1px solid ${isVerified ? 'var(--sb-primary-soft, #DCE8D8)' : isUnderReview ? '#FDE68A' : '#E5E7EB'}`,
                  }}>
                    {isVerified ? 'Verified KYC' : isUnderReview ? 'Under Review' : 'Unverified'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Document Type</label>
                    <select
                      value={formData.idDocumentType}
                      disabled={isVerified}
                      onChange={e => setFormData({ ...formData, idDocumentType: e.target.value })}
                      style={{
                        ...inputStyle,
                        cursor: isVerified ? 'not-allowed' : 'pointer',
                        opacity: isVerified ? 0.7 : 1,
                      }}
                    >
                      <option value="PAN">PAN Card (Business / Proprietor)</option>
                      <option value="AADHAAR">Aadhaar Card (UIDAI)</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>
                      {formData.idDocumentType === 'PAN' ? 'PAN Number (10 alphanumeric)' : 'Aadhaar Number (12 digits)'}
                    </label>
                    <input
                      type="text"
                      disabled={isVerified}
                      value={formData.idDocumentNumber}
                      onChange={e => setFormData({ ...formData, idDocumentNumber: e.target.value })}
                      placeholder={formData.idDocumentType === 'PAN' ? 'e.g. ABCDE1234F' : 'e.g. 123456789012'}
                      style={{
                        ...inputStyle,
                        letterSpacing: '0.05em',
                        textTransform: formData.idDocumentType === 'PAN' ? 'uppercase' : 'none',
                        cursor: isVerified ? 'not-allowed' : 'text',
                        opacity: isVerified ? 0.7 : 1,
                      }}
                    />
                  </div>
                </div>

                <p style={{
                  fontFamily: 'Work Sans, sans-serif',
                  fontSize: 11,
                  color: 'var(--sb-text-muted, #7A847A)',
                  margin: '10px 0 0',
                  lineHeight: 1.4,
                }}>
                  🔒 <strong>Privacy Assurance:</strong> StockBridge securely stores sensitive identity records. Document numbers are masked in counterparty views and only accessed for compliance verification.
                </p>
              </div>

              <div style={{ paddingTop: 8 }}>
                <button
                  type="submit" disabled={saving}
                  className="stitch-btn-primary"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '12px 24px', fontSize: 13, borderRadius: 4,
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  <Save size={15} />
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Feedback & Ratings Column */}
          <div style={{ background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 8, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--sb-text-primary, #182018)', margin: '0 0 16px' }}>
              Counterparty Reviews ({ratings.length})
            </h3>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                <div style={{ width: 24, height: 24, border: '2px solid var(--sb-border, #D8E0D5)', borderTopColor: 'var(--sb-primary, #6F8F69)', borderRadius: '50%' }} className="animate-stitch-spin" />
              </div>
            ) : ratings.length === 0 ? (
              <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-muted, #7A847A)', margin: 0 }}>
                No transaction reviews yet. Reviews will appear here once counterparties complete trades.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ratings.map((r) => (
                  <div key={r.id} style={{ background: 'var(--sb-surface-soft, #F2F6EF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 4, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--sb-text-primary, #182018)' }}>
                        {r.fromUser?.businessName || r.fromUser?.name || 'Verified Merchant'}
                      </span>
                      <RatingStars rating={r.score} size={12} />
                    </div>
                    {r.comment && (
                      <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-secondary, #4F5A51)', margin: '0 0 4px', fontStyle: 'italic' }}>
                        "{r.comment}"
                      </p>
                    )}
                    <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 10, color: 'var(--sb-text-muted, #7A847A)' }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
