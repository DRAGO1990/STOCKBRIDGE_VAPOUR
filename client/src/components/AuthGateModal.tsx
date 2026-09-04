import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShieldCheck, ArrowRight, Store, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  actionContext?: string;
}

export const AuthGateModal: React.FC<AuthGateModalProps> = ({
  isOpen,
  onClose,
  title = 'Merchant Authentication Required',
  description = 'Sign in or register your business to access full marketplace inventory, place reservations, or list surplus stock.',
  actionContext,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSignIn = () => {
    onClose();
    navigate('/login');
  };

  const handleRegister = () => {
    onClose();
    navigate('/register');
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(6px)',
          padding: 16,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{
            background: 'var(--sb-surface, #FFFFFF)',
            border: '1px solid var(--sb-border, #D8E0D5)',
            borderRadius: 12,
            width: '100%',
            maxWidth: 440,
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
            position: 'relative',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top accent line */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, var(--sb-primary, #6F8F69), var(--sb-primary-soft, #DCE8D8))' }} />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              background: 'transparent',
              border: 'none',
              color: 'var(--sb-text-muted, #7A847A)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 6,
              borderRadius: 6,
              transition: 'color 0.15s, background-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--sb-text-primary, #182018)';
              e.currentTarget.style.backgroundColor = 'var(--sb-surface-soft, #F2F6EF)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--sb-text-muted, #7A847A)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={18} />
          </button>

          <div style={{ padding: '28px 24px 24px' }}>
            {/* Header Icon & Tag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  background: 'var(--sb-primary-pale, #EAF1E7)',
                  border: '1px solid var(--sb-border, #D8E0D5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--sb-primary, #6F8F69)',
                }}
              >
                <Store size={22} />
              </div>
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'var(--sb-surface-soft, #F2F6EF)',
                    padding: '2px 8px',
                    borderRadius: 4,
                    border: '1px solid var(--sb-border, #D8E0D5)',
                  }}
                >
                  <Lock size={10} color="var(--sb-primary, #6F8F69)" />
                  <span
                    style={{
                      fontFamily: 'Work Sans, sans-serif',
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'var(--sb-primary, #6F8F69)',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Merchant Gateway
                  </span>
                </div>
                {actionContext && (
                  <p
                    style={{
                      fontFamily: 'Work Sans, sans-serif',
                      fontSize: 11,
                      color: 'var(--sb-text-muted, #7A847A)',
                      margin: '3px 0 0',
                    }}
                  >
                    Action: <span style={{ color: 'var(--sb-text-secondary, #4F5A51)' }}>{actionContext}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Title & Description */}
            <h3
              style={{
                fontFamily: 'Sora, sans-serif',
                fontWeight: 700,
                fontSize: 20,
                color: 'var(--sb-text-primary, #182018)',
                margin: '0 0 8px',
                lineHeight: 1.3,
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontFamily: 'Work Sans, sans-serif',
                fontSize: 14,
                color: 'var(--sb-text-secondary, #4F5A51)',
                margin: '0 0 20px',
                lineHeight: 1.55,
              }}
            >
              {description}
            </p>

            {/* Value checklist */}
            <div
              style={{
                background: 'var(--sb-surface-soft, #F2F6EF)',
                border: '1px solid var(--sb-border, #D8E0D5)',
                borderRadius: 8,
                padding: '12px 14px',
                marginBottom: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={14} color="var(--sb-primary, #6F8F69)" />
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-primary, #182018)' }}>
                  Verified merchant counterparty protection
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={14} color="var(--sb-primary, #6F8F69)" />
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-primary, #182018)' }}>
                  Zero advance fee · 24-hour stock reservations
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={14} color="var(--sb-primary, #6F8F69)" />
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-primary, #182018)' }}>
                  Direct local pickup and coordinate in chat
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleSignIn}
                className="stitch-btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: 14,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  borderRadius: 6,
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                <span>Sign In to Continue</span>
                <ArrowRight size={15} />
              </button>

              <button
                onClick={handleRegister}
                className="stitch-btn-ghost"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: 14,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                Register New Business
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
