import React from 'react';
import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';

const footerLinks = [
  { label: 'Trust Center',   href: '#' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Contact Support', href: '#' },
];

export const Footer: React.FC = () => (
  <footer style={{
    background: 'var(--sb-surface, #FFFFFF)',
    borderTop: '1px solid var(--sb-border, #D8E0D5)',
    marginTop: 'auto',
  }}>
    <div style={{
      maxWidth: 1200,
      margin: '0 auto',
      padding: '20px 24px',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    }}>
      {/* Brand */}
      <Link to="/" style={{
        display: 'flex', alignItems: 'center', gap: 8,
        textDecoration: 'none',
      }}>
        <Store size={16} color="var(--sb-primary, #6F8F69)" />
        <span style={{
          fontFamily: 'Sora, sans-serif',
          fontWeight: 700,
          fontSize: 16,
          color: 'var(--sb-text-primary, #182018)',
          letterSpacing: '-0.01em',
        }}>
          StockBridge
        </span>
      </Link>

      {/* Nav links */}
      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px' }}>
        {footerLinks.map(l => (
          <a
            key={l.label}
            href={l.href}
            style={{
              fontFamily: 'Work Sans, sans-serif',
              fontSize: 13,
              color: 'var(--sb-text-secondary, #4F5A51)',
              textDecoration: 'none',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--sb-text-primary, #182018)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--sb-text-secondary, #4F5A51)'; }}
          >
            {l.label}
          </a>
        ))}
      </nav>

      {/* Copyright */}
      <p style={{
        fontFamily: 'Work Sans, sans-serif',
        fontSize: 12,
        color: 'var(--sb-text-muted, #7A847A)',
      }}>
        © {new Date().getFullYear()} StockBridge B2B. All rights reserved.
      </p>
    </div>
  </footer>
);
