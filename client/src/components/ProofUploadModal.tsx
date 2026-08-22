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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#1b2151] border border-[#3f4b81] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#3f4b81] flex items-center justify-between bg-[#151a41]">
          <div className="flex items-center gap-2 text-teal-400">
            <CheckCircle2 size={20} />
            <h3 className="font-semibold text-white">Complete Handover</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-slate-300">
            Confirm goods receipt or delivery. You can optionally attach a proof photograph (invoice, receipt, or goods photo) for records.
          </p>

          <div className="border-2 border-dashed border-[#3f4b81] hover:border-teal-400/60 transition-colors rounded-xl p-6 flex flex-col items-center justify-center text-center bg-[#0f1329]/40 relative cursor-pointer group">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {previewUrl ? (
              <div className="space-y-2">
                <img
                  src={previewUrl}
                  alt="Proof Preview"
                  className="max-h-40 rounded-lg object-contain mx-auto border border-[#3f4b81]"
                />
                <p className="text-xs text-teal-300 flex items-center justify-center gap-1">
                  <FileImage size={14} /> Click or drag to change image
                </p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 mb-2 group-hover:scale-110 transition-transform">
                  <Upload size={22} />
                </div>
                <p className="text-sm font-medium text-slate-200">
                  Upload Handover Proof (Optional)
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  PNG, JPG, WebP up to 10MB
                </p>
              </>
            )}
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/60">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-navy-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 rounded-xl transition-colors cursor-pointer shadow-lg shadow-teal-400/20"
            >
              {loading ? 'Confirming...' : 'Mark Completed'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
