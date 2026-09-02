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
    background: '#131313',
    borderTop: '1px solid #3d4947',
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
        <Store size={16} color="#6bd8cb" />
        <span style={{
          fontFamily: 'Sora, sans-serif',
          fontWeight: 700,
          fontSize: 16,
          color: '#e5e2e1',
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
              color: '#bcc9c6',
              textDecoration: 'none',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#e5e2e1'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#bcc9c6'; }}
          >
            {l.label}
          </a>
        ))}
      </nav>

      {/* Copyright */}
      <p style={{
        fontFamily: 'Work Sans, sans-serif',
        fontSize: 12,
        color: '#879391',
      }}>
        © {new Date().getFullYear()} StockBridge B2B. All rights reserved.
      </p>
    </div>
  </footer>
);
