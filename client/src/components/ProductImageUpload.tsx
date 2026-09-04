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
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-[#e5e2e1] uppercase tracking-wider font-mono">
          {label}
        </label>
        <span className="text-[11px] text-[#879391]">
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
        <div className="space-y-3 bg-[#1c1b1b] border border-[#3d4947] rounded-lg p-3.5 shadow-md">
          <div className="relative rounded-md overflow-hidden border border-[#3d4947] bg-[#131313] group">
            <img
              src={imagePreview}
              alt="Product Preview"
              className="w-full h-44 sm:h-52 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
              <span className="text-xs text-[#e5e2e1] truncate">
                {imageFile?.name} ({(imageFile ? (imageFile.size / (1024 * 1024)).toFixed(2) : 0)} MB)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs text-[#bcc9c6] min-w-0">
              <FileImage size={15} className="text-[#6bd8cb] flex-shrink-0" />
              <span className="truncate">{imageFile?.name || 'Selected Image'}</span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#353534] border border-[#3d4947] disabled:opacity-50 text-[#6bd8cb] rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw size={12} />
                Change
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="px-3 py-1.5 bg-rose-950/30 hover:bg-rose-950/60 disabled:opacity-50 border border-rose-800/50 text-[#ffb4ab] rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
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
          className={`border border-dashed rounded-lg p-5 sm:p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group ${
            disabled ? 'opacity-50 cursor-not-allowed border-[#3d4947]' : ''
          } ${
            isDragging
              ? 'border-[#6bd8cb] bg-[#6bd8cb]/10 scale-[1.01]'
              : 'border-[#3d4947] hover:border-[#6bd8cb] bg-[#1c1b1b] hover:bg-[#201f1f]'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-[#2a2a2a] border border-[#3d4947] flex items-center justify-center text-[#6bd8cb] mb-2.5 group-hover:scale-110 transition-transform">
            <Upload size={18} />
          </div>
          <p className="text-sm font-semibold text-[#e5e2e1] mb-0.5">
            Upload Product Stock Photo
          </p>
          <p className="text-xs text-[#6bd8cb] font-medium mb-1">
            Drag & Drop or Click to Browse
          </p>
          <p className="text-[11px] text-[#879391]">
            JPG, PNG, WEBP • Max 5MB
          </p>
        </div>
      )}

      {/* Error Message */}
      {imageError && (
        <p className="text-xs text-[#ffb4ab] bg-rose-950/30 p-2.5 rounded border border-rose-800/50 flex items-center gap-2">
          <AlertCircle size={14} className="flex-shrink-0" />
          {imageError}
        </p>
      )}
    </div>
  );
};
