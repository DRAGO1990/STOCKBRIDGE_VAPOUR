import React, { useRef, useState } from 'react';
import { Upload, X, RefreshCw, AlertCircle, FileImage } from 'lucide-react';

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export interface ProductImageUploadProps {
  imageFile: File | null;
  imagePreview: string | null;
  imageError?: string;
  onImageSelected: (file: File) => void;
  onImageRemoved: () => void;
  onErrorChange?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  imageFile,
  imagePreview,
  imageError = '',
  onImageSelected,
  onImageRemoved,
  onErrorChange,
  disabled = false,
  className = '',
  label = 'Product Image',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSelectFile = (file: File) => {
    if (disabled) return;

    if (onErrorChange) onErrorChange('');

    // Check size <= 5 MB
    if (file.size > MAX_IMAGE_SIZE) {
      const err = 'Image file size exceeds the 5 MB limit. Please select a smaller image.';
      if (onErrorChange) onErrorChange(err);
      return;
    }

    // Check MIME type and file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type) && !ALLOWED_IMAGE_EXTENSIONS.includes(fileExt)) {
      const err = 'Unsupported file format. Please upload a JPG, JPEG, PNG, or WEBP image.';
      if (onErrorChange) onErrorChange(err);
      return;
    }

    onImageSelected(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    if (disabled) return;
    onImageRemoved();
    if (onErrorChange) onErrorChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <label style={{
          display: 'block',
          fontFamily: 'Work Sans, sans-serif',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--sb-text-primary, #182018)',
        }}>
          {label}
        </label>
        <span style={{ fontSize: 11, color: 'var(--sb-text-muted, #7A847A)' }}>
          JPG, PNG, WEBP • Max 5MB
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />

      {imagePreview ? (
        /* Image Selected Preview State */
        <div style={{
          background: 'var(--sb-surface, #FFFFFF)',
          border: '1px solid var(--sb-border, #D8E0D5)',
          borderRadius: 8,
          padding: 14,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            position: 'relative',
            borderRadius: 6,
            overflow: 'hidden',
            border: '1px solid var(--sb-border, #D8E0D5)',
            background: 'var(--sb-surface-soft, #F2F6EF)',
          }}>
            <img
              src={imagePreview}
              alt="Product Preview"
              style={{ width: '100%', height: 200, objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
              padding: '12px 10px 6px',
            }}>
              <span style={{ fontSize: 11, color: '#FFFFFF' }}>
                {imageFile ? `${imageFile.name} (${(imageFile.size / (1024 * 1024)).toFixed(2)} MB)` : 'Uploaded Image'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <FileImage size={15} color="var(--sb-primary, #6F8F69)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--sb-text-secondary, #4F5A51)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {imageFile?.name || 'Product Photo Selected'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="stitch-btn-ghost"
                style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <RefreshCw size={12} />
                Change
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                style={{
                  padding: '6px 12px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 500,
                  background: 'rgba(166,92,85,0.08)',
                  border: '1px solid rgba(166,92,85,0.25)',
                  color: 'var(--sb-danger, #A65C55)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <X size={12} />
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Drag & Drop Upload Zone */
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: `1.5px dashed ${isDragging ? 'var(--sb-primary, #6F8F69)' : 'var(--sb-border-strong, #BEC9BA)'}`,
            borderRadius: 8,
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            background: isDragging ? 'var(--sb-primary-pale, #EAF1E7)' : 'var(--sb-surface-soft, #F2F6EF)',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{
            width: 40, height: 40,
            borderRadius: 8,
            background: 'var(--sb-surface, #FFFFFF)',
            border: '1px solid var(--sb-border, #D8E0D5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 10,
          }}>
            <Upload size={18} color="var(--sb-primary, #6F8F69)" />
          </div>
          <p style={{
            fontFamily: 'Sora, sans-serif',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--sb-text-primary, #182018)',
            margin: '0 0 2px',
          }}>
            Upload Product Stock Photo
          </p>
          <p style={{
            fontFamily: 'Work Sans, sans-serif',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--sb-primary, #6F8F69)',
            margin: '0 0 4px',
          }}>
            Drag & Drop or Click to Browse
          </p>
          <p style={{
            fontFamily: 'Work Sans, sans-serif',
            fontSize: 11,
            color: 'var(--sb-text-muted, #7A847A)',
            margin: 0,
          }}>
            JPG, PNG, WEBP • Max 5MB
          </p>
        </div>
      )}

      {/* Error Message */}
      {imageError && (
        <p style={{
          fontSize: 12,
          color: 'var(--sb-danger, #A65C55)',
          background: 'rgba(166,92,85,0.08)',
          border: '1px solid rgba(166,92,85,0.25)',
          padding: '8px 12px',
          borderRadius: 4,
          display: 'flex', alignItems: 'center', gap: 6,
          margin: '6px 0 0',
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          {imageError}
        </p>
      )}
    </div>
  );
};
