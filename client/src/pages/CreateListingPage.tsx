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
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { VoiceListingPanel } from '../components/VoiceListingPanel';
import type { ExtractedFields } from '../components/VoiceListingPanel';
import { ProductImageUpload } from '../components/ProductImageUpload';
import { InvoiceImageUpload } from '../components/InvoiceImageUpload';
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
  color: 'var(--sb-text-secondary, #4F5A51)',
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'var(--sb-surface, #FFFFFF)',
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
  const fromInventory = searchParams.get('fromInventory');
  const isEditMode = Boolean(editId);

  const user = useAuthStore((s) => s.user);

  const [mode, setMode] = useState<'manual' | 'voice'>('manual');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [quantity, setQuantity] = useState<number>(0);
  const [unit, setUnit] = useState('packets');
  const [pricePerUnit, setPrice] = useState<number>(0);
  const [originalMrp, setOriginalMrp] = useState<number>(0);
  const [invoiceVerificationId, setInvoiceVerificationId] = useState<string | null>(null);
  const [verifiedInvoiceItem, setVerifiedInvoiceItem] = useState<string>('');
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
        setOriginalMrp(item.originalMrp ?? item.mrp ?? 0);
        setInvoiceVerificationId(item.invoiceVerificationId || null);
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

  // Smart Inventory recommendation pre-fill (Original MRP is NOT pre-filled as editable text)
  useEffect(() => {
    if (editId) return;

    const prefillTitle = searchParams.get('title');
    const prefillCategory = searchParams.get('category');
    const prefillQty = searchParams.get('quantity');
    const prefillUnit = searchParams.get('unit');
    const prefillExpiry = searchParams.get('expiryDate');

    if (prefillTitle) setTitle(prefillTitle);
    if (prefillCategory && CATEGORIES.includes(prefillCategory)) setCategory(prefillCategory);
    if (prefillQty) {
      const q = parseFloat(prefillQty);
      if (!isNaN(q) && q > 0) setQuantity(q);
    }
    if (prefillUnit && UNITS.includes(prefillUnit)) setUnit(prefillUnit);
    if (prefillExpiry) setExpiry(prefillExpiry);
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
    setPrice(fields.pricePerUnit || 0);
    if (fields.expiryDate) {
      setExpiry(fields.expiryDate);
    }
    setVoiceAutoFilled(true);
    setMode('manual');
    setError('');
  };

  const handleInvoiceVerificationSuccess = (verificationId: string, mrp: number, matchedProduct?: string) => {
    setInvoiceVerificationId(verificationId);
    setOriginalMrp(mrp);
    if (matchedProduct) setVerifiedInvoiceItem(matchedProduct);
    setError('');
  };

  const handleInvoiceVerificationReset = () => {
    setInvoiceVerificationId(null);
    setOriginalMrp(0);
    setVerifiedInvoiceItem('');
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

    // Validate Invoice Image Verification: Required
    if (!isEditMode && !invoiceVerificationId) {
      setError('Please upload the product invoice to verify the Original MRP.');
      return;
    }

    // Validate Original MRP is verified
    if (!originalMrp || originalMrp <= 0) {
      setError('Please upload the product invoice to verify the Original MRP.');
      return;
    }

    // Validate pricePerUnit <= originalMrp
    if (pricePerUnit > originalMrp) {
      setError(`Selling price (₹${pricePerUnit}) cannot exceed the verified Original MRP (₹${originalMrp}).`);
      return;
    }

    // Validate product image: required on create
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

      // If user uploaded a new product image file, upload it
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
        originalMrp: Number(originalMrp),
        pricePerUnit: Number(pricePerUnit),
        expiryDate: new Date(expiryDate).toISOString(),
        imageUrl: finalImageUrl,
        invoiceVerificationId,
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
  const discountPercent = originalMrp > 0 && pricePerUnit > 0 && pricePerUnit <= originalMrp
    ? Math.round(((originalMrp - pricePerUnit) / originalMrp) * 100)
    : 0;

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
            >
              <ArrowLeft size={14} /> Back to listing
            </Link>
          </div>
        )}

        {/* ── Page Header ── */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 32,
            color: 'var(--sb-text-primary, #182018)', marginBottom: 8, letterSpacing: '-0.01em',
          }}>
            {isEditMode ? 'Edit Stock Listing' : 'List Surplus Stock'}
          </h1>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: 'var(--sb-text-secondary, #4F5A51)' }}>
            {isEditMode
              ? 'Update listing details or extend shelf life. Original MRP is verified from your invoice.'
              : 'Turn your expiring inventory into recovered cash. Original MRP is verified from your invoice image by AI.'}
          </p>
        </div>

        {/* Smart Inventory Source Notice Banner */}
        {fromInventory && !isEditMode && (
          <div style={{
            background: 'var(--sb-primary-pale, #EAF1E7)',
            border: '1px solid var(--sb-primary-soft, #DCE8D8)',
            borderRadius: 6,
            padding: '12px 16px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <Sparkles size={16} color="var(--sb-primary, #6F8F69)" style={{ flexShrink: 0 }} />
            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-primary, #6F8F69)', margin: 0, lineHeight: 1.4 }}>
              Pre-filled from your <strong>Smart Inventory Predictor</strong>. Please upload the product image and invoice to verify the Original MRP.
            </p>
          </div>
        )}

        {/* ── Mode Toggle: Voice vs Manual ── */}
        {!isEditMode && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <button
              type="button"
              onClick={() => setMode('manual')}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 4,
                fontFamily: 'Work Sans, sans-serif', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: mode === 'manual' ? 'var(--sb-surface, #FFFFFF)' : 'transparent',
                color: mode === 'manual' ? 'var(--sb-text-primary, #182018)' : 'var(--sb-text-muted, #7A847A)',
                border: mode === 'manual' ? '1px solid var(--sb-border, #D8E0D5)' : '1px solid transparent',
                boxShadow: mode === 'manual' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <Pencil size={15} /> Manual Entry
            </button>
            <button
              type="button"
              onClick={() => setMode('voice')}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 4,
                fontFamily: 'Work Sans, sans-serif', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: mode === 'voice' ? 'var(--sb-surface, #FFFFFF)' : 'transparent',
                color: mode === 'voice' ? 'var(--sb-primary, #6F8F69)' : 'var(--sb-text-muted, #7A847A)',
                border: mode === 'voice' ? '1px solid var(--sb-border, #D8E0D5)' : '1px solid transparent',
                boxShadow: mode === 'voice' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <Mic size={15} /> Voice Input (Indian Languages)
            </button>
          </div>
        )}

        {/* ── Voice Mode Panel ── */}
        {mode === 'voice' && !isEditMode && (
          <VoiceListingPanel onFieldsExtracted={handleVoiceFieldsExtracted} />
        )}

        {/* ── Manual Mode Form ── */}
        {(mode === 'manual' || isEditMode) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {voiceAutoFilled && (
              <div style={{
                background: 'var(--sb-primary-pale, #EAF1E7)',
                border: '1px solid var(--sb-primary-soft, #DCE8D8)',
                borderRadius: 6,
                padding: '10px 16px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--sb-primary, #6F8F69)',
                fontSize: 13,
              }}>
                <CheckCircle size={15} />
                <span>Product fields auto-filled from speech. Please upload the product image and invoice image to complete verification.</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{
                background: 'var(--sb-surface, #FFFFFF)',
                border: '1px solid var(--sb-border, #D8E0D5)',
                borderRadius: 8,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}>

                {/* ── Section 1: Product Information ── */}
                <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--sb-border, #D8E0D5)' }}>
                  <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--sb-text-primary, #182018)', marginBottom: 6 }}>
                    Product Details
                  </p>
                  <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-muted, #7A847A)', marginBottom: 20 }}>
                    Enter product name, category, and quantity available for trade.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={labelStyle}>Product Name *</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        placeholder="e.g., Britannia 50-50 Maska Chaska Biscuits"
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={labelStyle}>Category *</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          style={inputStyle}
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={labelStyle}>Unit of Measurement *</label>
                        <select
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          style={inputStyle}
                        >
                          {UNITS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Quantity & Selling Price (NO manual editable MRP input) */}
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
                            borderColor: originalMrp > 0 && pricePerUnit > originalMrp ? 'var(--sb-danger, #A65C55)' : 'var(--sb-border, #D8E0D5)',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Section 2: Product Image Upload (Public) ── */}
                <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--sb-border, #D8E0D5)' }}>
                  <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--sb-text-primary, #182018)', marginBottom: 6 }}>
                    Product Image *
                  </p>
                  <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-muted, #7A847A)', marginBottom: 16 }}>
                    Publicly displayed to buyers in the StockBridge marketplace (JPG, PNG, WEBP, max 5 MB).
                  </p>
                  <ProductImageUpload
                    imageFile={imageFile}
                    imagePreview={imagePreview}
                    imageError={imageError}
                    onImageSelected={handleImageSelected}
                    onImageRemoved={handleImageRemoved}
                    onErrorChange={(err) => setImageError(err)}
                    disabled={loading}
                    label="Product Image (Buyer-Visible)"
                  />
                </div>

                {/* ── Section 3: Invoice Image & Original MRP Verification (Private) ── */}
                <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--sb-border, #D8E0D5)' }}>
                  <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--sb-text-primary, #182018)', marginBottom: 6 }}>
                    Original MRP & Invoice Verification *
                  </p>
                  <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-muted, #7A847A)', marginBottom: 16 }}>
                    To prevent false discounts, Original MRP cannot be entered manually. It is automatically verified from your uploaded invoice by AI.
                  </p>

                  <InvoiceImageUpload
                    invoiceVerificationId={invoiceVerificationId}
                    verifiedOriginalMrp={originalMrp}
                    productName={title}
                    category={category}
                    onVerificationSuccess={handleInvoiceVerificationSuccess}
                    onVerificationReset={handleInvoiceVerificationReset}
                    disabled={loading}
                  />

                  {/* Read-Only Original MRP Banner */}
                  <div style={{ marginTop: 16 }}>
                    {originalMrp > 0 ? (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 18px', borderRadius: 6,
                        background: pricePerUnit > originalMrp ? 'rgba(166,92,85,0.08)' : 'var(--sb-primary-pale, #EAF1E7)',
                        border: `1px solid ${pricePerUnit > originalMrp ? 'rgba(166,92,85,0.25)' : 'var(--sb-primary-soft, #DCE8D8)'}`,
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ShieldCheck size={16} color="var(--sb-primary, #6F8F69)" />
                            <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--sb-primary, #6F8F69)' }}>
                              Original MRP (Read-only)
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--sb-text-muted, #7A847A)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <Lock size={10} /> Verified
                            </span>
                          </div>
                          <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--sb-text-primary, #182018)', margin: '4px 0 0' }}>
                            ₹{originalMrp} <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, fontWeight: 400, color: 'var(--sb-text-muted, #7A847A)' }}>per {unit}</span>
                          </p>
                          {pricePerUnit > originalMrp ? (
                            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-danger, #A65C55)', fontWeight: 600, margin: '6px 0 0' }}>
                              ⚠️ Selling price (₹{pricePerUnit}) cannot exceed the verified Original MRP (₹{originalMrp}).
                            </p>
                          ) : (
                            pricePerUnit > 0 && (
                              <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-primary, #6F8F69)', fontWeight: 600, margin: '6px 0 0' }}>
                                Offering {discountPercent}% discount off verified Original MRP.
                              </p>
                            )
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        background: 'var(--sb-surface-soft, #F2F6EF)',
                        border: '1px dashed var(--sb-border, #D8E0D5)',
                        borderRadius: 6, padding: '12px 16px',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <Lock size={16} color="var(--sb-text-muted, #7A847A)" />
                        <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-muted, #7A847A)' }}>
                          Original MRP will be automatically locked and displayed here once invoice image is uploaded and verified.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Section 4: Expiry Date & Urgency ── */}
                <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--sb-border, #D8E0D5)' }}>
                  <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--sb-text-primary, #182018)', marginBottom: 6 }}>
                    Expiry Date & Urgency
                  </p>
                  <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-muted, #7A847A)', marginBottom: 20 }}>
                    Urgency is automatically calculated strictly based on product expiry date.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
                    <div>
                      <label style={labelStyle}>Product Expiry Date *</label>
                      <div style={{
                        display: 'flex', alignItems: 'center', background: 'var(--sb-surface, #FFFFFF)',
                        border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 4, padding: '0 14px',
                      }}>
                        <Calendar size={16} color="var(--sb-text-muted, #7A847A)" style={{ flexShrink: 0 }} />
                        <input
                          type="date"
                          value={expiryDate}
                          min={minExpiryDate}
                          onChange={(e) => handleExpiryChange(e.target.value)}
                          required
                          style={{
                            ...inputStyle, padding: '11px 10px', border: 'none', background: 'transparent',
                            width: '100%', colorScheme: 'light',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--sb-text-muted, #7A847A)', display: 'block', marginTop: 4 }}>
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
                          background: 'var(--sb-surface-soft, #F2F6EF)',
                          border: `1px solid ${urgency === 'high' ? 'rgba(166,92,85,0.4)' : urgency === 'medium' ? 'rgba(184,138,69,0.4)' : 'var(--sb-border, #D8E0D5)'}`,
                          borderRadius: 4,
                          padding: '10px 14px',
                          minHeight: 44,
                          boxSizing: 'border-box',
                        }}
                      >
                        {urgency === 'high' && (
                          <Flame size={16} color="var(--sb-danger, #A65C55)" style={{ flexShrink: 0 }} className="animate-pulse" />
                        )}
                        <span
                          id="current-urgency-value"
                          style={{
                            fontFamily: 'Sora, sans-serif',
                            fontWeight: 700,
                            fontSize: 14,
                            letterSpacing: '0.04em',
                            color: urgency === 'high' ? 'var(--sb-danger, #A65C55)' : urgency === 'medium' ? 'var(--sb-warning, #B88A45)' : 'var(--sb-primary, #6F8F69)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {urgency.toUpperCase()}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: 'Work Sans, sans-serif',
                            color: 'var(--sb-text-muted, #7A847A)',
                            background: 'var(--sb-surface, #FFFFFF)',
                            border: '1px solid var(--sb-border, #D8E0D5)',
                            padding: '2px 8px',
                            borderRadius: 3,
                            marginLeft: 'auto',
                            fontWeight: 500,
                          }}
                        >
                          Read-only
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--sb-text-muted, #7A847A)', display: 'block', marginTop: 4 }}>
                        Automatically calculated from expiry date
                      </span>
                      {expiryDate && calculatedUrgency.daysRemaining !== null && (
                        <span style={{ fontSize: 11, color: 'var(--sb-text-secondary, #4F5A51)', display: 'block', marginTop: 2 }}>
                          {calculatedUrgency.statusText}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--sb-text-muted, #7A847A)', display: 'block', marginTop: 2 }}>
                        11–25d: High · 26–50d: Medium · &gt;50d: Low
                      </span>
                    </div>
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

export default CreateListingPage;
