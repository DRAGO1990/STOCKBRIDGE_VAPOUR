import React, { useState } from 'react';
import { X, Upload, CheckCircle2, FileImage } from 'lucide-react';
import api from '../lib/api';

interface ProofUploadModalProps {
  reservationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProofUploadModal: React.FC<ProofUploadModalProps> = ({
  reservationId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    if (selectedFile) {
      formData.append('proof', selectedFile);
    }

    try {
      await api.post(`/reservations/${reservationId}/complete`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Complete failed', err);
      setError(err.response?.data?.error || 'Failed to complete reservation.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)',
      padding: 16,
    }}>
      <div style={{
        background: '#1c1b1b', border: '1px solid #3d4947',
        borderRadius: 8, width: '100%', maxWidth: 440,
        overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #3d4947',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#1c1b1b',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={18} color="#6bd8cb" />
            <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 15, color: '#e5e2e1', margin: 0 }}>
              Complete Handover
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: '#879391',
              cursor: 'pointer', padding: 6, borderRadius: 4, display: 'flex',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#e5e2e1')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#879391')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#bcc9c6', lineHeight: 1.5, margin: 0 }}>
            Confirm goods receipt or physical delivery. You can optionally attach proof (invoice, signed receipt, or goods photo).
          </p>

          <div style={{
            border: '2px dashed #3d4947', borderRadius: 6, padding: '24px 16px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', background: '#131313', position: 'relative', cursor: 'pointer',
          }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
            />
            {previewUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <img
                  src={previewUrl}
                  alt="Proof Preview"
                  style={{ maxHeight: 150, borderRadius: 4, objectFit: 'contain', border: '1px solid #3d4947' }}
                />
                <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#6bd8cb', display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
                  <FileImage size={13} /> Click to change image
                </p>
              </div>
            ) : (
              <>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'rgba(107,216,203,0.1)', border: '1px solid rgba(107,216,203,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#6bd8cb', marginBottom: 12,
                }}>
                  <Upload size={20} />
                </div>
                <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, fontWeight: 600, color: '#e5e2e1', margin: 0 }}>
                  Upload Handover Proof (Optional)
                </p>
                <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: '#879391', margin: '4px 0 0' }}>
                  PNG, JPG, WebP up to 10MB
                </p>
              </>
            )}
          </div>

          {error && (
            <p style={{
              fontFamily: 'Work Sans, sans-serif', fontSize: 12,
              color: '#ffb4ab', background: 'rgba(255,180,171,0.08)',
              border: '1px solid rgba(255,180,171,0.2)', borderRadius: 4,
              padding: '10px 12px', margin: 0,
            }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px', background: 'transparent', border: '1px solid #3d4947',
                borderRadius: 4, color: '#bcc9c6', fontFamily: 'Work Sans, sans-serif',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="stitch-btn-primary"
              style={{ padding: '9px 20px', borderRadius: 4, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Confirming...' : 'Mark Completed'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
