import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Flame,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { VoiceListingPanel } from '../components/VoiceListingPanel';
import type { ExtractedFields } from '../components/VoiceListingPanel';
import { ProductImageUpload } from '../components/ProductImageUpload';
import { calculateUrgencyFromExpiry, validateExpiryDate, MIN_EXPIRY_DAYS } from '../utils/urgency';

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
  color: '#bcc9c6',
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#2a2a2a',
  border: '1px solid #3d4947',
  borderRadius: 4,
  padding: '11px 14px',
  fontFamily: 'Work Sans, sans-serif',
  fontSize: 14,
  color: '#e5e2e1',
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
  const [mrp, setMrp] = useState<number>(0);
  const [pricePerUnit, setPrice] = useState<number>(0);
  const [expiryDate, setExpiry] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingListing, setFetchingListing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [voiceAutoFilled, setVoiceAutoFilled] = useState(false);

  // Dynamic urgency auto-calculated strictly from expiry date (Read-only for seller)
  const calculatedUrgency = useMemo(() => {
    return calculateUrgencyFromExpiry(expiryDate);
  }, [expiryDate]);

  const urgency = calculatedUrgency.urgency;

  // Minimum date boundary (at least 11 days from today)
  const minExpiryDate = new Date(Date.now() + MIN_EXPIRY_DAYS * 86400000).toISOString().split('T')[0];

  const handleExpiryChange = useCallback((newExpiry: string) => {
    setExpiry(newExpiry);
  }, []);

  const handleImageSelected = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageError('');
  };

  const handleImageRemoved = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
    setImageError('');
  };

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
        setMrp(item.mrp || 0);
        setPrice(item.pricePerUnit || 0);
        if (item.expiryDate) {
          setExpiry(item.expiryDate.split('T')[0]);
        }
        if (item.imageUrl) {
          setImageUrl(item.imageUrl);
          setImagePreview(item.imageUrl);
        }
        setFetchingListing(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Failed to load existing listing details.');
        setFetchingListing(false);
      });
  }, [editId]);

  // Smart Inventory recommendation pre-fill
  useEffect(() => {
    if (editId) return;

    const prefillTitle = searchParams.get('title');
    const prefillCategory = searchParams.get('category');
    const prefillQty = searchParams.get('quantity');
    const prefillUnit = searchParams.get('unit');
    const prefillExpiry = searchParams.get('expiryDate');
    const prefillMrp = searchParams.get('mrp');

    if (prefillTitle) setTitle(prefillTitle);
    if (prefillCategory && CATEGORIES.includes(prefillCategory)) setCategory(prefillCategory);
    if (prefillQty) {
      const q = parseFloat(prefillQty);
      if (!isNaN(q) && q > 0) setQuantity(q);
    }
    if (prefillUnit && UNITS.includes(prefillUnit)) setUnit(prefillUnit);
    if (prefillExpiry) setExpiry(prefillExpiry);
    if (prefillMrp) {
      const m = parseFloat(prefillMrp);
      if (!isNaN(m) && m > 0) {
        setMrp(m);
        setPrice(Math.round(m * 0.8));
      }
    }
  }, [editId, searchParams]);

  const handleVoiceFieldsExtracted = (fields: ExtractedFields) => {
    // Validate expiry before auto-filling
    if (fields.expiryDate) {
      const expiryValidation = validateExpiryDate(fields.expiryDate);
      if (!expiryValidation.valid) {
        setError(expiryValidation.error || 'This product cannot be listed because less than 11 days are remaining until expiry.');
        setMode('manual');
        return;
      }
    }

    setTitle(fields.title || '');
    if (CATEGORIES.includes(fields.category)) setCategory(fields.category);
    setQuantity(fields.quantity || 0);
    if (UNITS.includes(fields.unit)) setUnit(fields.unit);
    if (fields.mrp) setMrp(fields.mrp);
    setPrice(fields.pricePerUnit || 0);
    if (fields.expiryDate) {
      setExpiry(fields.expiryDate);
    }
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

    // Validate MRP
    if (!mrp || mrp <= 0) {
      setError('Product MRP must be a positive number.');
      return;
    }

    if (pricePerUnit > mrp) {
      setError(`Selling price (₹${pricePerUnit}) cannot exceed the Product MRP (₹${mrp}).`);
      return;
    }

    // Validate image: required on create
    if (!isEditMode && !imageFile && !imageUrl) {
      const imgMsg = 'Product image is required. Please upload a product photo.';
      setImageError(imgMsg);
      setError(imgMsg);
      return;
    }

    // Validate expiry date: minimum 11 days remaining
    const expiryValidation = validateExpiryDate(expiryDate);
    if (!expiryValidation.valid) {
      setError(expiryValidation.error || 'This product cannot be listed because less than 11 days are remaining until expiry.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let finalImageUrl = imageUrl;

      // If user uploaded a new image file, upload it
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await api.post('/listings/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalImageUrl = uploadRes.data.imageUrl;
      }

      const payload = {
        title: title.trim(),
        category,
        quantity: Number(quantity),
        unit,
        mrp: Number(mrp),
        pricePerUnit: Number(pricePerUnit),
        expiryDate: new Date(expiryDate).toISOString(),
        imageUrl: finalImageUrl,
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
  const discountPercent = mrp > 0 && pricePerUnit > 0 && pricePerUnit <= mrp
    ? Math.round(((mrp - pricePerUnit) / mrp) * 100)
    : 0;

  if (fetchingListing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: 16 }}>
        <Loader2 size={32} color="#6bd8cb" className="animate-spin" />
        <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: '#bcc9c6' }}>
          Loading existing stock details...
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: '#131313', minHeight: '100vh', color: '#e5e2e1' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>
        
        {/* ── Back button in Edit Mode ── */}
        {isEditMode && (
          <div style={{ marginBottom: 20 }}>
            <Link
              to={`/listings/${editId}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#879391',
                textDecoration: 'none', transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#6bd8cb')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#879391')}
            >
              <ArrowLeft size={16} /> Cancel & Return to Listing
            </Link>
          </div>
        )}

        {/* Banner if prefilled from Smart Inventory */}
        {searchParams.get('fromInventory') && (
          <div style={{
            background: 'rgba(107,216,203,0.1)', border: '1px solid rgba(107,216,203,0.3)',
            borderRadius: 6, padding: '12px 16px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Sparkles size={16} color="#6bd8cb" />
            <span style={{ fontSize: 13, color: '#6bd8cb', fontFamily: 'Work Sans, sans-serif' }}>
              Prefilled from Smart Inventory Recommendation. Review lot details and adjust liquidation price before publishing.
            </span>
          </div>
        )}

        {/* ── Page Header ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 32, color: '#e5e2e1', margin: 0, letterSpacing: '-0.01em' }}>
              {isEditMode ? 'Edit Stock Listing' : 'List New Stock'}
            </h1>
            {isEditMode && (
              <span style={{
                fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 700,
                color: '#6bd8cb', background: 'rgba(107,216,203,0.1)',
                border: '1px solid rgba(107,216,203,0.25)', borderRadius: 4, padding: '3px 8px',
              }}>
                Editing #{editId?.substring(0, 8).toUpperCase()}
              </span>
            )}
          </div>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: '#bcc9c6', margin: 0 }}>
            {isEditMode
              ? 'Update price, quantity, or terms. Existing lot details have been loaded into the form below.'
              : 'Fill in the details or use voice to quickly create a listing.'}
          </p>
        </motion.div>

        <hr style={{ border: 'none', borderTop: '1px solid #3d4947', marginBottom: 28 }} />

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
                    ? { background: 'rgba(107,216,203,0.1)', borderColor: '#6bd8cb', color: '#6bd8cb' }
                    : { background: 'transparent', borderColor: '#3d4947', color: '#bcc9c6' }),
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
                background: 'rgba(107,216,203,0.08)', border: '1px solid rgba(107,216,203,0.2)',
                borderRadius: 4, padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <AlertCircle size={14} color="#6bd8cb" />
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#6bd8cb' }}>
                  Voice data auto-filled — please review before publishing.
                </span>
              </div>
            )}

            {isEditMode && (
              <div style={{
                background: 'rgba(107,216,203,0.08)', border: '1px solid rgba(107,216,203,0.25)',
                borderRadius: 6, padding: '12px 16px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <CheckCircle size={16} color="#6bd8cb" />
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#e5e2e1' }}>
                  Existing stock details loaded. Modify the price, quantity, or details below and save.
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ background: '#1c1b1b', border: '1px solid #3d4947', borderRadius: 8, overflow: 'hidden' }}>
                
                {/* ── Section: Basics ── */}
                <div style={{ padding: '24px 28px', borderBottom: '1px solid #3d4947' }}>
                  <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16, color: '#e5e2e1', marginBottom: 20 }}>
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
                            <option key={c} value={c} style={{ background: '#1c1b1b' }}>
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
                            <option key={u} value={u} style={{ background: '#1c1b1b' }}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Qty, MRP & Selling Price */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
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
                        <label style={labelStyle}>Product MRP (₹) *</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={mrp || ''}
                          onChange={(e) => setMrp(Number(e.target.value))}
                          required
                          placeholder="e.g. 100"
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Selling Price per {unit} (₹) *</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={pricePerUnit || ''}
                          onChange={(e) => setPrice(Number(e.target.value))}
                          required
                          placeholder="0.00"
                          style={{
                            ...inputStyle,
                            borderColor: mrp > 0 && pricePerUnit > mrp ? '#ffb4ab' : '#3d4947',
                          }}
                        />
                      </div>
                    </div>

                    {/* MRP & Discount Helper */}
                    {mrp > 0 && pricePerUnit > 0 && (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', borderRadius: 4,
                        background: pricePerUnit > mrp ? 'rgba(255,180,171,0.1)' : 'rgba(107,216,203,0.06)',
                        border: `1px solid ${pricePerUnit > mrp ? 'rgba(255,180,171,0.3)' : 'rgba(107,216,203,0.2)'}`,
                      }}>
                        <span style={{
                          fontFamily: 'Work Sans, sans-serif', fontSize: 12,
                          color: pricePerUnit > mrp ? '#ffb4ab' : '#6bd8cb', fontWeight: 500,
                        }}>
                          {pricePerUnit > mrp
                            ? `⚠️ Selling price exceeds MRP! Maximum allowed price is ₹${mrp}.`
                            : `Offering ${discountPercent}% discount off MRP (₹${mrp} printed).`}
                        </span>
                        <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: '#879391' }}>
                          MRP Rule Active
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Section: Product Image Upload ── */}
                <div style={{ padding: '24px 28px', borderBottom: '1px solid #3d4947' }}>
                  <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16, color: '#e5e2e1', marginBottom: 6 }}>
                    Product Image *
                  </p>
                  <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#879391', marginBottom: 16 }}>
                    Upload a clear photo of your surplus stock or packaging lot (JPG, PNG, WEBP, max 5 MB).
                  </p>
                  <ProductImageUpload
                    imageFile={imageFile}
                    imagePreview={imagePreview}
                    imageError={imageError}
                    onImageSelected={handleImageSelected}
                    onImageRemoved={handleImageRemoved}
                    onErrorChange={(err) => setImageError(err)}
                    disabled={loading}
                    label="Upload Product Image (Required)"
                  />
                </div>

                {/* ── Section: Expiry Date & Urgency ── */}
                <div style={{ padding: '24px 28px', borderBottom: '1px solid #3d4947' }}>
                  <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16, color: '#e5e2e1', marginBottom: 6 }}>
                    Expiry Date & Urgency
                  </p>
                  <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#879391', marginBottom: 20 }}>
                    Urgency is automatically calculated strictly based on product expiry date.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
                    <div>
                      <label style={labelStyle}>Product Expiry Date *</label>
                      <div style={{
                        display: 'flex', alignItems: 'center', background: '#2a2a2a',
                        border: '1px solid #3d4947', borderRadius: 4, padding: '0 14px',
                      }}>
                        <Calendar size={16} color="#879391" style={{ flexShrink: 0 }} />
                        <input
                          type="date"
                          value={expiryDate}
                          min={minExpiryDate}
                          onChange={(e) => handleExpiryChange(e.target.value)}
                          required
                          style={{
                            ...inputStyle, padding: '11px 10px', border: 'none', background: 'transparent',
                            width: '100%', colorScheme: 'dark',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 11, color: '#879391', display: 'block', marginTop: 4 }}>
                        Must be at least {MIN_EXPIRY_DAYS} days in the future.
                      </span>
                    </div>

                    <div>
                      <label style={labelStyle}>Urgency Level</label>
                      <div
                        id="urgency-display-badge"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          background: '#222222',
                          border: `1px solid ${urgency === 'high' ? 'rgba(255,180,171,0.4)' : urgency === 'medium' ? 'rgba(246,179,81,0.4)' : '#3d4947'}`,
                          borderRadius: 4,
                          padding: '10px 14px',
                          minHeight: 44,
                          boxSizing: 'border-box',
                        }}
                      >
                        {urgency === 'high' && (
                          <Flame size={16} color="#ffb4ab" style={{ flexShrink: 0 }} className="animate-pulse" />
                        )}
                        <span
                          id="current-urgency-value"
                          style={{
                            fontFamily: 'Sora, sans-serif',
                            fontWeight: 700,
                            fontSize: 14,
                            letterSpacing: '0.04em',
                            color: urgency === 'high' ? '#ffb4ab' : urgency === 'medium' ? '#f6b351' : '#6bd8cb',
                            textTransform: 'uppercase',
                          }}
                        >
                          {urgency.toUpperCase()}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: 'Work Sans, sans-serif',
                            color: '#879391',
                            background: 'rgba(135,147,145,0.12)',
                            border: '1px solid rgba(135,147,145,0.2)',
                            padding: '2px 8px',
                            borderRadius: 3,
                            marginLeft: 'auto',
                            fontWeight: 500,
                          }}
                        >
                          Read-only
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: '#879391', display: 'block', marginTop: 4 }}>
                        Automatically calculated from expiry date
                      </span>
                      {expiryDate && calculatedUrgency.daysRemaining !== null && (
                        <span style={{ fontSize: 11, color: '#bcc9c6', display: 'block', marginTop: 2 }}>
                          {calculatedUrgency.statusText}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: '#879391', display: 'block', marginTop: 2 }}>
                        11–25d: High · 26–50d: Medium · &gt;50d: Low
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Live Value Preview ── */}
                {quantity > 0 && pricePerUnit > 0 && (
                  <div style={{
                    padding: '20px 28px', background: '#131313', borderBottom: '1px solid #3d4947',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#879391', marginBottom: 4 }}>
                        Estimated Lot Value
                      </p>
                      <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 26, color: '#6bd8cb', margin: 0 }}>
                        ₹{totalValue.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#879391', margin: 0 }}>
                      {quantity} {unit} × ₹{pricePerUnit}
                    </p>
                  </div>
                )}

                {/* ── Alerts & Submit ── */}
                <div style={{ padding: '24px 28px' }}>
                  {error && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                      background: 'rgba(255,180,171,0.08)', border: '1px solid rgba(255,180,171,0.2)',
                      borderRadius: 4, padding: '12px 16px',
                      color: '#ffb4ab', fontFamily: 'Work Sans, sans-serif', fontSize: 13,
                    }}>
                      <AlertCircle size={14} /> {error}
                    </div>
                  )}

                  {successMsg && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                      background: 'rgba(107,216,203,0.1)', border: '1px solid rgba(107,216,203,0.25)',
                      borderRadius: 4, padding: '12px 16px',
                      color: '#6bd8cb', fontFamily: 'Work Sans, sans-serif', fontSize: 13,
                    }}>
                      <CheckCircle size={14} /> {successMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="stitch-btn-primary glow-teal"
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
