import React, { useState } from 'react';
import { X, Star, MessageSquare } from 'lucide-react';
import api from '../lib/api';
import { RatingStars } from './RatingStars';

interface RateModalProps {
  reservationId: string;
  toUserId: string;
  toUserName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RateModal: React.FC<RateModalProps> = ({
  reservationId,
  toUserId,
  toUserName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [score, setScore] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/ratings', {
        reservationId,
        toUserId,
        score,
        comment: comment.trim(),
      });
      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Rating failed', err);
      setError(err.response?.data?.error || 'Failed to submit rating.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#1b2151] border border-[#3f4b81] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#3f4b81] flex items-center justify-between bg-[#151a41]">
          <div className="flex items-center gap-2 text-amber-400">
            <Star size={20} className="fill-amber-400" />
            <h3 className="font-semibold text-white">Rate Transaction</h3>
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
            How was your transaction experience with <span className="font-semibold text-teal-300">{toUserName}</span>?
          </p>

          <div className="flex flex-col items-center justify-center py-3 bg-[#0f1329]/60 rounded-xl border border-[#3f4b81]/50 gap-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Select Star Rating</span>
            <div className="flex items-center gap-2">
              <RatingStars
                rating={score}
                interactive={true}
                size={32}
                onChange={(newRating) => setScore(newRating)}
              />
            </div>
            <span className="text-xs text-teal-300 font-semibold">
              {score === 5 && '🌟 Excellent — Highly Recommended'}
              {score === 4 && '👍 Good — Smooth Transaction'}
              {score === 3 && '👌 Average — Acceptable'}
              {score === 2 && '👎 Poor — Encountered Issues'}
              {score === 1 && '⚠️ Terrible — Not Recommended'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
              <MessageSquare size={14} className="text-teal-400" />
              Feedback / Review Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g., Quick pickup, genuine goods as described in lot..."
              className="w-full bg-[#0f1329] border border-[#3f4b81] rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
            />
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
              className="px-5 py-2 text-sm font-semibold text-navy-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-xl transition-colors cursor-pointer shadow-lg shadow-amber-400/20"
            >
              {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
