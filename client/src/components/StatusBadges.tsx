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
      <Badge style={{ color: '#ffb4ab', background: 'rgba(255,180,171,0.12)', border: '1px solid rgba(255,180,171,0.25)' }}>
        <Dot color="#ffb4ab" pulse />
        Urgent
      </Badge>
    );
  }
  if (urgency === 'medium') {
    return (
      <Badge style={{ color: '#f6b351', background: 'rgba(246,179,81,0.10)', border: '1px solid rgba(246,179,81,0.20)' }}>
        <Dot color="#f6b351" />
        Medium
      </Badge>
    );
  }
  return (
    <Badge style={{ color: '#bcc9c6', background: 'rgba(188,201,198,0.08)', border: '1px solid rgba(188,201,198,0.15)' }}>
      Standard
    </Badge>
  );
};

// ── Status Badge ──
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status.toLowerCase()) {
    case 'active':
      return (
        <Badge style={{ color: '#6bd8cb', background: 'rgba(107,216,203,0.10)', border: '1px solid rgba(107,216,203,0.20)' }}>
          <Dot color="#6bd8cb" pulse />
          Active
        </Badge>
      );
    case 'reserved':
      return (
        <Badge style={{ color: '#ddb7ff', background: 'rgba(221,183,255,0.10)', border: '1px solid rgba(221,183,255,0.20)' }}>
          Reserved
        </Badge>
      );
    case 'pending':
      return (
        <Badge style={{ color: '#f6b351', background: 'rgba(246,179,81,0.10)', border: '1px solid rgba(246,179,81,0.20)' }}>
          Pending
        </Badge>
      );
    case 'confirmed':
      return (
        <Badge style={{ color: '#6bd8cb', background: 'rgba(107,216,203,0.08)', border: '1px solid rgba(107,216,203,0.15)' }}>
          Confirmed
        </Badge>
      );
    case 'completed':
    case 'sold':
      return (
        <Badge style={{ color: '#bcc9c6', background: 'rgba(188,201,198,0.10)', border: '1px solid rgba(188,201,198,0.20)' }}>
          {status === 'sold' ? 'Sold' : 'Completed'}
        </Badge>
      );
    case 'cancelled':
    case 'expired':
      return (
        <Badge style={{ color: '#879391', background: 'rgba(135,147,145,0.08)', border: '1px solid rgba(135,147,145,0.15)' }}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    case 'suspended':
      return (
        <Badge style={{ color: '#ffb4ab', background: 'rgba(255,180,171,0.10)', border: '1px solid rgba(255,180,171,0.20)' }}>
          Suspended
        </Badge>
      );
    default:
      return (
        <Badge style={{ color: '#879391', background: 'rgba(135,147,145,0.08)', border: '1px solid rgba(135,147,145,0.15)' }}>
          {status}
        </Badge>
      );
  }
};
