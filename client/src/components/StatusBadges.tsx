import React from 'react';

// ── Stitch-style badge — flat, bordered, low-alpha fill ──

type BadgeBase = { children: React.ReactNode; style?: React.CSSProperties };

const Badge: React.FC<BadgeBase> = ({ children, style }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '3px 9px',
    borderRadius: 4,
    fontFamily: 'Work Sans, sans-serif',
    fontSize: 11, fontWeight: 600,
    letterSpacing: '0.05em', textTransform: 'uppercase',
    ...style,
  }}>
    {children}
  </span>
);

const Dot: React.FC<{ color: string; pulse?: boolean }> = ({ color, pulse }) => (
  <span style={{
    width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0,
    animation: pulse ? 'stitch-pulse-teal 2s infinite' : undefined,
  }} />
);

// ── Urgency Badge ──
export const UrgencyBadge: React.FC<{ urgency: 'low' | 'medium' | 'high' }> = ({ urgency }) => {
  if (urgency === 'high') {
    return (
      <Badge style={{ color: 'var(--sb-danger, #A65C55)', background: 'rgba(166,92,85,0.12)', border: '1px solid rgba(166,92,85,0.25)' }}>
        <Dot color="var(--sb-danger, #A65C55)" pulse />
        Urgent
      </Badge>
    );
  }
  if (urgency === 'medium') {
    return (
      <Badge style={{ color: 'var(--sb-warning, #B88A45)', background: 'rgba(184,138,69,0.12)', border: '1px solid rgba(184,138,69,0.25)' }}>
        <Dot color="var(--sb-warning, #B88A45)" />
        Medium
      </Badge>
    );
  }
  return (
    <Badge style={{ color: 'var(--sb-text-secondary, #4F5A51)', background: 'rgba(79,90,81,0.08)', border: '1px solid rgba(79,90,81,0.18)' }}>
      Standard
    </Badge>
  );
};

// ── Status Badge ──
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status.toLowerCase()) {
    case 'active':
      return (
        <Badge style={{ color: 'var(--sb-success, #557A55)', background: 'rgba(85,122,85,0.12)', border: '1px solid rgba(85,122,85,0.25)' }}>
          <Dot color="var(--sb-success, #557A55)" pulse />
          Active
        </Badge>
      );
    case 'reserved':
      return (
        <Badge style={{ color: 'var(--sb-primary, #6F8F69)', background: 'rgba(111,143,105,0.12)', border: '1px solid rgba(111,143,105,0.25)' }}>
          Reserved
        </Badge>
      );
    case 'pending':
      return (
        <Badge style={{ color: 'var(--sb-warning, #B88A45)', background: 'rgba(184,138,69,0.12)', border: '1px solid rgba(184,138,69,0.25)' }}>
          Pending
        </Badge>
      );
    case 'confirmed':
      return (
        <Badge style={{ color: 'var(--sb-success, #557A55)', background: 'rgba(85,122,85,0.10)', border: '1px solid rgba(85,122,85,0.20)' }}>
          Confirmed
        </Badge>
      );
    case 'completed':
    case 'sold':
      return (
        <Badge style={{ color: 'var(--sb-text-secondary, #4F5A51)', background: 'rgba(79,90,81,0.08)', border: '1px solid rgba(79,90,81,0.18)' }}>
          {status === 'sold' ? 'Sold' : 'Completed'}
        </Badge>
      );
    case 'cancelled':
    case 'expired':
      return (
        <Badge style={{ color: 'var(--sb-text-muted, #7A847A)', background: 'rgba(122,132,122,0.08)', border: '1px solid rgba(122,132,122,0.18)' }}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    case 'expiry_unlisted':
      return (
        <Badge style={{ color: 'var(--sb-danger, #A65C55)', background: 'rgba(166,92,85,0.14)', border: '1px solid rgba(166,92,85,0.28)' }}>
          <Dot color="var(--sb-danger, #A65C55)" />
          Auto Unlisted – Expiry Too Close
        </Badge>
      );
    case 'suspended':
      return (
        <Badge style={{ color: 'var(--sb-danger, #A65C55)', background: 'rgba(166,92,85,0.12)', border: '1px solid rgba(166,92,85,0.25)' }}>
          Suspended
        </Badge>
      );
    default:
      return (
        <Badge style={{ color: 'var(--sb-text-muted, #7A847A)', background: 'rgba(122,132,122,0.08)', border: '1px solid rgba(122,132,122,0.18)' }}>
          {status}
        </Badge>
      );
  }
};
