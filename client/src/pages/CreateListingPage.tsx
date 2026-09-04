import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  AlertCircle,
  Mic,
  Pencil,
  Calendar,
  Save,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Package,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { VoiceListingPanel } from '../components/VoiceListingPanel';
import type { ExtractedFields } from '../components/VoiceListingPanel';

const CATEGORIES = [
  'Groceries',
  'Stationery',
  'Electronics',
  'Packaging',
  'Textiles',
  'Hardware',
  'Dairy & Beverages',
  'Prepared Food & Bakery',
];

const UNITS = ['kg', 'pieces', 'packets', 'bags', 'cans', 'litres', 'boxes', 'reams', 'cartons'];

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'Work Sans, sans-serif',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--sb-text-secondary, #4F5A51)',
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'var(--sb-surface-soft, #F2F6EF)',
  border: '1px solid var(--sb-border, #D8E0D5)',
  borderRadius: 4,
  padding: '11px 14px',
  fontFamily: 'Work Sans, sans-serif',
  fontSize: 14,
  color: 'var(--sb-text-primary, #182018)',
  outline: 'none',
};

export const CreateListingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = Boolean(editId);

  const user = useAuthStore((s) => s.user);

  const [mode, setMode] = useState<'manual' | 'voice'>('manual');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [quantity, setQuantity] = useState<number>(0);
  const [unit, setUnit] = useState('packets');
  const [pricePerUnit, setPrice] = useState<number>(0);
  const [expiryDate, setExpiry] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('low');
  const [loading, setLoading] = useState(false);
  const [fetchingListing, setFetchingListing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [voiceAutoFilled, setVoiceAutoFilled] = useState(false);

  const minExpiryDate = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];

  // If in edit mode, fetch existing listing details immediately and prefill the form
  useEffect(() => {
    if (!editId) return;

    setFetchingListing(true);
    setError('');

    api
      .get(`/listings/${editId}`)
      .then((res) => {
        const item = res.data;
        setTitle(item.title || '');
        if (CATEGORIES.includes(item.category)) setCategory(item.category);
        setQuantity(item.quantity || 0);
        if (UNITS.includes(item.unit)) setUnit(item.unit);
        setPrice(item.pricePerUnit || 0);
        if (item.expiryDate) {
          setExpiry(item.expiryDate.split('T')[0]);
        }
        setUrgency(item.urgency || 'low');
        setFetchingListing(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Failed to load existing listing details.');
        setFetchingListing(false);
      });
  }, [editId]);

  const handleUrgencyChange = (u: 'low' | 'medium' | 'high') => {
    setUrgency(u);
    if (u === 'high' && expiryDate) {
      const exp = new Date(expiryDate);
      const max = new Date(Date.now() + 15 * 86400000);
      const min = new Date(Date.now() + 10 * 86400000);
      if (exp < min || exp > max) {
        setExpiry(new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0]);
      }
    }
  };

  const handleVoiceFieldsExtracted = (fields: ExtractedFields) => {
    setTitle(fields.title || '');
    if (CATEGORIES.includes(fields.category)) setCategory(fields.category);
    setQuantity(fields.quantity || 0);
    if (UNITS.includes(fields.unit)) setUnit(fields.unit);
    setPrice(fields.pricePerUnit || 0);
    setExpiry(fields.expiryDate || '');
    setUrgency(fields.urgency || 'low');
    setVoiceAutoFilled(true);
    setMode('manual');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!title.trim() || quantity <= 0 || pricePerUnit <= 0 || !expiryDate) {
      setError('Please fill in all required fields.');
      return;
    }

    const selectedExpiry = new Date(expiryDate);
    const minReq = new Date(Date.now() + 10 * 86400000);
    minReq.setHours(0, 0, 0, 0);

    if (urgency === 'high') {
      const maxReq = new Date(Date.now() + 15 * 86400000);
      if (selectedExpiry < minReq || selectedExpiry > maxReq) {
        setError('High urgency listings must expire between 10–15 days from today.');
        return;
      }
    } else if (selectedExpiry < minReq) {
      setError('Expiry date must be at least 10 days from today.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        title: title.trim(),
        category,
        quantity: Number(quantity),
        unit,
        pricePerUnit: Number(pricePerUnit),
        expiryDate: new Date(expiryDate).toISOString(),
        urgency,
      };

      if (isEditMode && editId) {
        // Update existing listing
        const res = await api.put(`/listings/${editId}`, payload);
        setSuccessMsg('Listing details updated successfully.');
        setTimeout(() => {
          navigate(`/listings/${res.data.id || editId}`);
        }, 600);
      } else {
        // Create new listing
        const res = await api.post('/listings', payload);
        navigate(`/listings/${res.data.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'publish'} listing.`);
      setLoading(false);
    }
  };

  const totalValue = quantity * pricePerUnit;

  if (fetchingListing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: 16 }}>
        <Loader2 size={32} color="var(--sb-primary, #6F8F69)" className="animate-spin" />
        <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: 'var(--sb-text-secondary, #4F5A51)' }}>
          Loading existing stock details...
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--sb-background, #F7F7F2)', minHeight: '100vh', color: 'var(--sb-text-primary, #182018)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>
        
        {/* ── Back button in Edit Mode ── */}
        {isEditMode && (
          <div style={{ marginBottom: 20 }}>
            <Link
              to={`/listings/${editId}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-muted, #7A847A)',
                textDecoration: 'none', transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--sb-primary, #6F8F69)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--sb-text-muted, #7A847A)')}
            >
              <ArrowLeft size={16} /> Cancel & Return to Listing
            </Link>
          </div>
        )}

        {/* ── Page Header ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 32, color: 'var(--sb-text-primary, #182018)', margin: 0, letterSpacing: '-0.01em' }}>
              {isEditMode ? 'Edit Stock Listing' : 'List New Stock'}
            </h1>
            {isEditMode && (
              <span style={{
                fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 700,
                color: 'var(--sb-primary, #6F8F69)', background: 'var(--sb-primary-pale, #EAF1E7)',
                border: '1px solid var(--sb-primary-soft, #DCE8D8)', borderRadius: 4, padding: '3px 8px',
              }}>
                Editing #{editId?.substring(0, 8).toUpperCase()}
              </span>
            )}
          </div>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: 'var(--sb-text-secondary, #4F5A51)', margin: 0 }}>
            {isEditMode
              ? 'Update price, quantity, or terms. Existing lot details have been loaded into the form below.'
              : 'Fill in the details or use voice to quickly create a listing.'}
          </p>
        </motion.div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--sb-border, #D8E0D5)', marginBottom: 28 }} />

        {/* ── Mode Toggle (Only show on new listing) ── */}
        {!isEditMode && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            {([
              { key: 'manual', label: 'Manual Entry', icon: <Pencil size={14} /> },
              { key: 'voice', label: 'Voice Input', icon: <Mic size={14} /> },
            ] as const).map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 18px', borderRadius: 4,
                  fontFamily: 'Work Sans, sans-serif', fontSize: 13, fontWeight: 600,
                  border: '1px solid',
                  cursor: 'pointer', transition: 'all 0.15s',
                  ...(mode === m.key
                    ? { background: 'var(--sb-primary-pale, #EAF1E7)', borderColor: 'var(--sb-primary, #6F8F69)', color: 'var(--sb-primary, #6F8F69)' }
                    : { background: 'var(--sb-surface, #FFFFFF)', borderColor: 'var(--sb-border, #D8E0D5)', color: 'var(--sb-text-secondary, #4F5A51)' }),
                }}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        )}

        {mode === 'voice' && !isEditMode ? (
          <VoiceListingPanel onFieldsExtracted={handleVoiceFieldsExtracted} />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {voiceAutoFilled && (
              <div style={{
                background: 'var(--sb-primary-pale, #EAF1E7)', border: '1px solid var(--sb-primary-soft, #DCE8D8)',
                borderRadius: 4, padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <AlertCircle size={14} color="var(--sb-primary, #6F8F69)" />
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-primary, #6F8F69)' }}>
                  Voice data auto-filled — please review before publishing.
                </span>
              </div>
            )}

            {isEditMode && (
              <div style={{
                background: 'var(--sb-primary-pale, #EAF1E7)', border: '1px solid var(--sb-primary-soft, #DCE8D8)',
                borderRadius: 6, padding: '12px 16px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <CheckCircle size={16} color="var(--sb-primary, #6F8F69)" />
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-primary, #182018)' }}>
                  Existing stock details loaded. Modify the price, quantity, or urgency below and save.
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                
                {/* ── Section: Basics ── */}
                <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--sb-border, #D8E0D5)' }}>
                  <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--sb-text-primary, #182018)', marginBottom: 20 }}>
                    Basics
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {/* Title */}
                    <div>
                      <label style={labelStyle}>Listing Title *</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        placeholder="e.g., 500 Britannia Biscuit Packets (MRP ₹10)"
                        style={inputStyle}
                      />
                    </div>

                    {/* Category + Unit */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={labelStyle}>Category *</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          style={{ ...inputStyle, cursor: 'pointer' }}
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c} style={{ background: 'var(--sb-surface, #FFFFFF)', color: 'var(--sb-text-primary, #182018)' }}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Unit *</label>
                        <select
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          style={{ ...inputStyle, cursor: 'pointer' }}
                        >
                          {UNITS.map((u) => (
                            <option key={u} value={u} style={{ background: 'var(--sb-surface, #FFFFFF)', color: 'var(--sb-text-primary, #182018)' }}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Qty + Price */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={labelStyle}>Quantity Available *</label>
                        <input
                          type="number"
                          min="1"
                          value={quantity || ''}
                          onChange={(e) => setQuantity(Number(e.target.value))}
                          required
                          placeholder="0"
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Price per {unit} (₹) *</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={pricePerUnit || ''}
                          onChange={(e) => setPrice(Number(e.target.value))}
                          required
                          placeholder="0.00"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Section: Urgency ── */}
                <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--sb-border, #D8E0D5)' }}>
                  <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--sb-text-primary, #182018)', marginBottom: 8 }}>
                    Urgency
                  </p>
                  <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-muted, #7A847A)', marginBottom: 16 }}>
                    Marks how urgently you need to liquidate this lot.
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['low', 'medium', 'high'] as const).map((u) => {
                      const active = urgency === u;
                      const colors: Record<string, { color: string; bg: string; border: string }> = {
                        low: { color: 'var(--sb-text-secondary, #4F5A51)', bg: 'var(--sb-surface-soft, #F2F6EF)', border: 'var(--sb-border-strong, #BEC9BA)' },
                        medium: { color: 'var(--sb-warning, #B88A45)', bg: 'rgba(184,138,69,0.1)', border: 'rgba(184,138,69,0.3)' },
                        high: { color: 'var(--sb-danger, #A65C55)', bg: 'rgba(166,92,85,0.1)', border: 'rgba(166,92,85,0.3)' },
                      };
                      return (
                        <button
                          key={u}
                          type="button"
                          onClick={() => handleUrgencyChange(u)}
                          style={{
                            padding: '8px 20px', borderRadius: 4,
                            border: `1px solid ${active ? colors[u].border : 'var(--sb-border, #D8E0D5)'}`,
                            background: active ? colors[u].bg : 'transparent',
                            color: active ? colors[u].color : 'var(--sb-text-muted, #7A847A)',
                            fontFamily: 'Work Sans, sans-serif', fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', textTransform: 'capitalize',
                          }}
                        >
                          {u}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Section: Expiry ── */}
                <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--sb-border, #D8E0D5)' }}>
                  <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--sb-text-primary, #182018)', marginBottom: 8 }}>
                    Expiry Date
                  </p>
                  <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-muted, #7A847A)', marginBottom: 16 }}>
                    Must be at least 10 days from today{urgency === 'high' ? ' and no more than 15 days (high urgency)' : ''}.
                  </p>
                  <div style={{
                    display: 'flex', alignItems: 'center', background: 'var(--sb-surface-soft, #F2F6EF)',
                    border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 4, padding: '0 14px', maxWidth: 280,
                  }}>
                    <Calendar size={16} color="var(--sb-text-muted, #7A847A)" style={{ flexShrink: 0 }} />
                    <input
                      type="date"
                      value={expiryDate}
                      min={minExpiryDate}
                      max={urgency === 'high' ? new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0] : undefined}
                      onChange={(e) => setExpiry(e.target.value)}
                      required
                      style={{
                        ...inputStyle, padding: '11px 10px', border: 'none', background: 'transparent',
                        width: '100%', colorScheme: 'light',
                      }}
                    />
                  </div>
                </div>

                {/* ── Live Value Preview ── */}
                {quantity > 0 && pricePerUnit > 0 && (
                  <div style={{
                    padding: '20px 28px', background: 'var(--sb-surface-soft, #F2F6EF)', borderBottom: '1px solid var(--sb-border, #D8E0D5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-muted, #7A847A)', marginBottom: 4 }}>
                        Estimated Lot Value
                      </p>
                      <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 26, color: 'var(--sb-primary, #6F8F69)', margin: 0 }}>
                        ₹{totalValue.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-muted, #7A847A)', margin: 0 }}>
                      {quantity} {unit} × ₹{pricePerUnit}
                    </p>
                  </div>
                )}

                {/* ── Alerts & Submit ── */}
                <div style={{ padding: '24px 28px' }}>
                  {error && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                      background: 'rgba(166,92,85,0.08)', border: '1px solid rgba(166,92,85,0.2)',
                      borderRadius: 4, padding: '12px 16px',
                      color: 'var(--sb-danger, #A65C55)', fontFamily: 'Work Sans, sans-serif', fontSize: 13,
                    }}>
                      <AlertCircle size={14} /> {error}
                    </div>
                  )}

                  {successMsg && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                      background: 'var(--sb-primary-pale, #EAF1E7)', border: '1px solid var(--sb-primary-soft, #DCE8D8)',
                      borderRadius: 4, padding: '12px 16px',
                      color: 'var(--sb-primary, #6F8F69)', fontFamily: 'Work Sans, sans-serif', fontSize: 13,
                    }}>
                      <CheckCircle size={14} /> {successMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="stitch-btn-primary"
                    style={{
                      padding: '14px', width: '100%', fontSize: 14,
                      letterSpacing: '0.04em', opacity: loading ? 0.6 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>{isEditMode ? 'Saving Changes...' : 'Publishing...'}</span>
                      </>
                    ) : (
                      <>
                        {isEditMode ? <Save size={16} /> : <Package size={16} />}
                        <span>{isEditMode ? 'Save Listing Changes' : 'Publish Listing'}</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
};
