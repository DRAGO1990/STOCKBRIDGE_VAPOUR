import React, { useRef, useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Lock,
  ChevronRight,
  ShieldCheck,
  EyeOff,
} from 'lucide-react';
import api from '../lib/api';
import type { InvoiceCandidate, InvoiceVerificationResponse } from '../types';

export const MAX_INVOICE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_INVOICE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
export const ALLOWED_INVOICE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

export interface InvoiceImageUploadProps {
  invoiceVerificationId: string | null;
  verifiedOriginalMrp: number | null;
  productName?: string;
  category?: string;
  onVerificationSuccess: (verificationId: string, originalMrp: number, matchedProduct?: string) => void;
  onVerificationReset: () => void;
  disabled?: boolean;
  className?: string;
}

export const InvoiceImageUpload: React.FC<InvoiceImageUploadProps> = ({
  invoiceVerificationId,
  verifiedOriginalMrp,
  productName = '',
  category = '',
  onVerificationSuccess,
  onVerificationReset,
  disabled = false,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [matchedProductName, setMatchedProductName] = useState('');
  const [candidates, setCandidates] = useState<InvoiceCandidate[]>([]);
  const [activeVerificationId, setActiveVerificationId] = useState<string | null>(invoiceVerificationId);
  const [selectingCandidate, setSelectingCandidate] = useState(false);

  const handleFile = async (file: File) => {
    if (disabled) return;
    setErrorMessage('');
    setCandidates([]);

    // File size check
    if (file.size > MAX_INVOICE_SIZE) {
      setErrorMessage('Invoice file size exceeds the 5 MB limit. Please select a smaller image.');
      return;
    }

    // MIME and extension check
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_INVOICE_MIME_TYPES.includes(file.type) && !ALLOWED_INVOICE_EXTENSIONS.includes(ext)) {
      setErrorMessage('Unsupported file format. Please upload a JPG, JPEG, PNG, or WEBP invoice image.');
      return;
    }

    setSelectedFileName(file.name);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('invoice', file);
      if (productName.trim()) formData.append('productName', productName.trim());
      if (category.trim()) formData.append('category', category.trim());

      const res = await api.post<InvoiceVerificationResponse>('/invoices/verify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data;
      setActiveVerificationId(data.verificationId);

      if (data.status === 'VERIFIED' && data.originalMrp && data.originalMrp > 0) {
        setMatchedProductName(data.matchedProduct || '');
        onVerificationSuccess(data.verificationId, data.originalMrp, data.matchedProduct || undefined);
      } else if (data.status === 'MULTIPLE_MATCHES' && data.candidates?.length > 0) {
        setCandidates(data.candidates);
        onVerificationReset();
      } else {
        onVerificationReset();
        setErrorMessage(
          data.message ||
            'Original MRP could not be verified from this invoice. Please upload a clearer invoice containing this product.'
        );
      }
    } catch (err: any) {
      onVerificationReset();
      setErrorMessage(
        err.response?.data?.error ||
          'Failed to process invoice verification. Please upload a clear invoice photo.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectCandidate = async (candidateIndex: number) => {
    if (!activeVerificationId || disabled) return;
    setSelectingCandidate(true);
    setErrorMessage('');

    try {
      const res = await api.post('/invoices/select-candidate', {
        verificationId: activeVerificationId,
        candidateIndex,
      });

      const data = res.data;
      if (data.status === 'VERIFIED' && data.originalMrp && data.originalMrp > 0) {
        setCandidates([]);
        setMatchedProductName(data.matchedProduct || '');
        onVerificationSuccess(data.verificationId, data.originalMrp, data.matchedProduct || undefined);
      } else {
        setErrorMessage('Failed to select candidate. Please try uploading the invoice again.');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to select candidate');
    } finally {
      setSelectingCandidate(false);
    }
  };

  const handleReset = () => {
    if (disabled) return;
    setSelectedFileName('');
    setErrorMessage('');
    setCandidates([]);
    setMatchedProductName('');
    setActiveVerificationId(null);
    onVerificationReset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isVerified = Boolean(invoiceVerificationId && verifiedOriginalMrp && verifiedOriginalMrp > 0);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header Label & Privacy Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileText size={15} color="var(--sb-primary, #6F8F69)" />
          <label style={{
            fontFamily: 'Work Sans, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--sb-text-primary, #182018)',
            margin: 0,
          }}>
            Product Invoice *
          </label>
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: 'var(--sb-surface-soft, #F2F6EF)',
          border: '1px solid var(--sb-border, #D8E0D5)',
          borderRadius: 4,
          padding: '2px 8px',
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--sb-text-secondary, #4F5A51)',
        }}>
          <EyeOff size={11} color="var(--sb-text-muted, #7A847A)" />
          <span>Private • Never Shown to Buyers</span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
        disabled={disabled || isAnalyzing}
        style={{ display: 'none' }}
      />

      {/* ─── State 1: Analyzing ─── */}
      {isAnalyzing && (
        <div style={{
          background: 'var(--sb-surface, #FFFFFF)',
          border: '1px dashed var(--sb-primary, #6F8F69)',
          borderRadius: 8,
          padding: '28px 20px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}>
          <Loader2 size={26} color="var(--sb-primary, #6F8F69)" className="animate-spin" style={{ margin: '0 auto 10px' }} />
          <h4 style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--sb-text-primary, #182018)', margin: '0 0 4px' }}>
            Analyzing Invoice with AI...
          </h4>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-muted, #7A847A)', margin: 0 }}>
            Verifying explicit Original MRP printed on invoice for "{productName || 'product'}".
          </p>
        </div>
      )}

      {/* ─── State 2: Verified Original MRP ─── */}
      {!isAnalyzing && isVerified && (
        <div style={{
          background: 'var(--sb-surface, #FFFFFF)',
          border: '1px solid var(--sb-primary-soft, #DCE8D8)',
          borderRadius: 8,
          padding: '16px 18px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 6,
                background: 'var(--sb-primary-pale, #EAF1E7)',
                border: '1px solid var(--sb-primary-soft, #DCE8D8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <ShieldCheck size={22} color="var(--sb-primary, #6F8F69)" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 8px', borderRadius: 4,
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                    color: 'var(--sb-primary, #6F8F69)', background: 'var(--sb-primary-pale, #EAF1E7)',
                    border: '1px solid var(--sb-primary-soft, #DCE8D8)',
                  }}>
                    <CheckCircle2 size={11} /> Verified from Invoice
                  </span>
                  {selectedFileName && (
                    <span style={{ fontSize: 11, color: 'var(--sb-text-muted, #7A847A)' }}>
                      ({selectedFileName})
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                  <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--sb-text-secondary, #4F5A51)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Original MRP:
                  </span>
                  <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--sb-text-primary, #182018)' }}>
                    ₹{verifiedOriginalMrp}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--sb-text-muted, #7A847A)' }}>
                    <Lock size={11} /> Read-only
                  </span>
                </div>

                {matchedProductName && (
                  <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-secondary, #4F5A51)', margin: '4px 0 0' }}>
                    Matched Invoice Item: <strong>{matchedProductName}</strong>
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              disabled={disabled}
              className="stitch-btn-ghost"
              style={{ padding: '6px 12px', fontSize: 11, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
              title="Replace current invoice"
            >
              <RefreshCw size={12} /> Replace
            </button>
          </div>
        </div>
      )}

      {/* ─── State 3: Multiple Matches Candidate Selection ─── */}
      {!isAnalyzing && !isVerified && candidates.length > 0 && (
        <div style={{
          background: 'var(--sb-surface, #FFFFFF)',
          border: '1px solid var(--sb-warning, #B88A45)',
          borderRadius: 8,
          padding: 18,
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--sb-warning, #B88A45)' }}>
            <AlertTriangle size={16} />
            <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600 }}>
              Multiple Invoice Items Detected
            </span>
          </div>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-secondary, #4F5A51)', margin: '0 0 14px' }}>
            We found multiple items on this invoice. Select the exact product you are listing (Original MRP cannot be manually edited):
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {candidates.map((cand, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectCandidate(idx)}
                disabled={selectingCandidate || disabled}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--sb-surface-soft, #F2F6EF)',
                  border: '1px solid var(--sb-border, #D8E0D5)',
                  borderRadius: 6, padding: '10px 14px', textAlign: 'left',
                  cursor: selectingCandidate ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  <span style={{ display: 'block', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--sb-text-primary, #182018)' }}>
                    {cand.product}
                  </span>
                  <span style={{ display: 'block', fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: 'var(--sb-text-muted, #7A847A)', marginTop: 2 }}>
                    Verified Invoice MRP: <strong style={{ color: 'var(--sb-primary, #6F8F69)' }}>₹{cand.originalMrp}</strong>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--sb-primary, #6F8F69)', fontSize: 12, fontWeight: 600 }}>
                  <span>Select</span>
                  <ChevronRight size={14} />
                </div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <button
              type="button"
              onClick={handleReset}
              disabled={selectingCandidate}
              style={{ background: 'transparent', border: 'none', color: 'var(--sb-text-muted, #7A847A)', fontSize: 11, textDecoration: 'underline', cursor: 'pointer' }}
            >
              Upload a different invoice
            </button>
          </div>
        </div>
      )}

      {/* ─── State 4: Default Dropzone ─── */}
      {!isAnalyzing && !isVerified && candidates.length === 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (!disabled && e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFile(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => {
            if (!disabled && fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
          style={{
            background: isDragging ? 'var(--sb-primary-pale, #EAF1E7)' : 'var(--sb-surface, #FFFFFF)',
            border: `1.5px dashed ${isDragging ? 'var(--sb-primary, #6F8F69)' : 'var(--sb-border, #D8E0D5)'}`,
            borderRadius: 8,
            padding: '24px 20px',
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 22,
            background: 'var(--sb-surface-soft, #F2F6EF)',
            border: '1px solid var(--sb-border, #D8E0D5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 10px',
          }}>
            <Upload size={20} color="var(--sb-primary, #6F8F69)" />
          </div>

          <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--sb-text-primary, #182018)', margin: '0 0 4px' }}>
            Click or drag & drop product invoice image
          </p>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-muted, #7A847A)', margin: '0 0 8px' }}>
            AI will extract and verify the product's Original MRP from the invoice
          </p>
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--sb-text-muted, #7A847A)' }}>
            JPG, PNG, WEBP • Max 5MB • Private & Protected
          </span>
        </div>
      )}

      {/* ─── Error Feedback ─── */}
      {errorMessage && (
        <div style={{
          background: 'rgba(166,92,85,0.08)',
          border: '1px solid rgba(166,92,85,0.25)',
          borderRadius: 6,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: 'var(--sb-danger, #A65C55)',
        }}>
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, lineHeight: 1.4 }}>
            {errorMessage}
          </span>
        </div>
      )}
    </div>
  );
};
