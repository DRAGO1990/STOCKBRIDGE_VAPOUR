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
            <Star size={18} color="#f6b351" style={{ fill: '#f6b351' }} />
            <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 15, color: '#e5e2e1', margin: 0 }}>
              Rate Transaction
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
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#bcc9c6', margin: 0 }}>
            How was your transaction experience with <strong style={{ color: '#e5e2e1' }}>{toUserName}</strong>?
          </p>

          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '20px 16px', background: '#131313', border: '1px solid #3d4947',
            borderRadius: 6, gap: 10,
          }}>
            <span style={{
              fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase', color: '#879391',
            }}>
              Select Star Rating
            </span>
            <RatingStars
              rating={score}
              interactive={true}
              size={28}
              onChange={(newRating) => setScore(newRating)}
            />
            <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, fontWeight: 600, color: '#f6b351' }}>
              {score === 5 && '★ Excellent — Highly Recommended'}
              {score === 4 && '★ Good — Smooth Handover'}
              {score === 3 && '★ Average — Acceptable'}
              {score === 2 && '★ Poor — Encountered Issues'}
              {score === 1 && '★ Critical — Not Recommended'}
            </span>
          </div>

          <div>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase', color: '#879391',
              marginBottom: 8,
            }}>
              <MessageSquare size={13} color="#879391" />
              Feedback / Review Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g., Quick pickup, genuine goods as described in lot..."
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#2a2a2a', border: '1px solid #3d4947',
                borderRadius: 4, padding: '12px 14px',
                fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#e5e2e1',
                outline: 'none', resize: 'vertical',
              }}
            />
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
              {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
