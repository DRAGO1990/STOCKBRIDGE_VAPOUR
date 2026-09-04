import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Store,
  Mic,
  Radar,
  ArrowRight,
  Check,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  Package,
  Layers,
  ChevronRight,
  Star,
  Search,
  Zap,
  Lock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import type { Listing } from '../types';
import { ListingCard } from '../components/ListingCard';
import { AuthGateModal } from '../components/AuthGateModal';
import { useAuthStore } from '../stores/authStore';

// Subtle, intuitive staggered animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVoicePrompt, setActiveVoicePrompt] = useState(0);

  const [authGate, setAuthGate] = useState<{
    isOpen: boolean;
    title?: string;
    description?: string;
    actionContext?: string;
  }>({ isOpen: false });

  const requireAuth = (
    actionContext: string,
    action: () => void,
    title?: string,
    description?: string
  ) => {
    if (user) {
      action();
    } else {
      setAuthGate({
        isOpen: true,
        title: title || 'Merchant Authentication Required',
        description:
          description ||
          'Sign in or register your business to access full marketplace inventory, place reservations, or list surplus stock.',
        actionContext,
      });
    }
  };

  const voiceDemos = [
    {
      text: '"Mere paas 50 biscuit ke packets hain, ₹15 packet, expiry 12 din mein hai."',
      title: 'Parle-G Gold Biscuits',
      category: 'Food & Bakery',
      qty: '50 pkts',
      price: '₹15 /pkt',
      expiry: '12 Days Left',
      urgency: 'high',
      img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=60',
    },
    {
      text: '"We have 20 boxes of Classmate notebooks, 80 rupees each, fresh sealed condition."',
      title: 'Classmate A4 Spiral Notebooks',
      category: 'Stationery',
      qty: '20 boxes',
      price: '₹80 /box',
      expiry: 'Standard Lot',
      urgency: 'low',
      img: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500&auto=format&fit=crop&q=60',
    },
    {
      text: '"Fortune Sunflower oil 1L pouches ke 30 packets hain, rate 110 rupees per packet."',
      title: 'Fortune Refined Sunflower Oil 1L',
      category: 'Groceries',
      qty: '30 packets',
      price: '₹110 /packet',
      expiry: '18 Days Left',
      urgency: 'medium',
      img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60',
    },
  ];

  useEffect(() => {
    api
      .get('/listings?limit=6')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data.listings || []);
        setFeaturedListings(list.slice(0, 3));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Auto cycle voice demo periodically for smooth interactive demo
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveVoicePrompt((prev) => (prev + 1) % voiceDemos.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [voiceDemos.length]);

  return (
    <div style={{ background: 'var(--sb-background, #F7F7F2)', color: 'var(--sb-text-primary, #182018)', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* ── 1. HERO SECTION ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px 80px', borderBottom: '1px solid var(--sb-border, #D8E0D5)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'center' }}>
          
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--sb-surface-soft, #F2F6EF)', border: '1px solid var(--sb-border, #D8E0D5)',
              borderRadius: 4, padding: '4px 12px', width: 'fit-content',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sb-primary, #6F8F69)' }} className="animate-pulse" />
              <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--sb-primary, #6F8F69)' }}>
                Verified B2B Surplus Exchange
              </span>
            </div>

            <h1 style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(32px, 5vw, 52px)',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: 'var(--sb-text-primary, #182018)',
              margin: 0,
            }}>
              Buy and sell extra stock from businesses near you.
            </h1>

            <p style={{
              fontFamily: 'Work Sans, sans-serif',
              fontSize: 'clamp(15px, 2vw, 18px)',
              lineHeight: 1.6,
              color: 'var(--sb-text-secondary, #4F5A51)',
              margin: 0,
              maxWidth: 540,
            }}>
              Find deeply discounted surplus inventory nearby or turn excess stock into working capital before it loses value.
            </p>

            {/* CTA Group */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, paddingTop: 8 }}>
              <button
                type="button"
                onClick={() => navigate(user ? '/marketplace' : '/market-preview')}
                className="stitch-btn-primary"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '14px 28px', fontSize: 14, textDecoration: 'none',
                  borderRadius: 6, letterSpacing: '0.04em', cursor: 'pointer', border: 'none',
                }}
              >
                <ShoppingCart size={16} />
                <span>Find Stock</span>
              </button>
              <button
                type="button"
                onClick={() => requireAuth('Sell Extra Stock', () => navigate('/create-listing'), 'Sell Business Surplus', 'Sign in to list excess inventory, set unit prices, and connect with nearby verified buyers.')}
                className="stitch-btn-ghost"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '14px 28px', fontSize: 14, textDecoration: 'none',
                  borderRadius: 6, letterSpacing: '0.04em', cursor: 'pointer',
                }}
              >
                <Store size={16} />
                <span>Sell Extra Stock</span>
              </button>
            </div>

            {/* Key trust badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, paddingTop: 16, borderTop: '1px solid var(--sb-border, #D8E0D5)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={16} color="var(--sb-primary, #6F8F69)" />
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-muted, #7A847A)' }}>100% Verified Merchants</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={16} color="var(--sb-primary, #6F8F69)" />
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-muted, #7A847A)' }}>10km Proximity Engine</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={16} color="var(--sb-primary, #6F8F69)" />
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-muted, #7A847A)' }}>Zero Advance Risk</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Interactive 3D Stack Mockup */}
          <div style={{ position: 'relative', height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(circle at 60% 40%, rgba(111,143,105,0.08), transparent 70%)',
              border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 8,
            }} />

            {/* Card 1: Top Tilted Card */}
            <motion.div
              initial={{ opacity: 0, x: -20, rotate: -4 }}
              animate={{ opacity: 1, x: 0, rotate: -3 }}
              whileHover={{ rotate: 0, scale: 1.02, zIndex: 30 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute', top: 32, left: 16, width: 280,
                background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)',
                borderRadius: 8, padding: 14,
                boxShadow: '0 12px 28px rgba(0,0,0,0.06)',
                cursor: 'pointer', zIndex: 10,
              }}
              onClick={() => requireAuth('Preview Cooking Oil Lot', () => navigate('/marketplace'), 'Surplus Lot Inspection', 'Sign in or register your business to review batch details and reserve this lot.')}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <img
                  src="https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=160&auto=format&fit=crop&q=60"
                  alt="Cooking Oil"
                  style={{ width: 64, height: 64, borderRadius: 4, objectFit: 'cover', background: 'var(--sb-surface-soft, #F2F6EF)' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--sb-text-primary, #182018)', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Premium Cooking Oil
                  </h4>
                  <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: 'var(--sb-text-muted, #7A847A)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Store size={11} color="var(--sb-text-muted, #7A847A)" /> Kumar Groceries
                  </p>
                  <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600, color: 'var(--sb-primary, #6F8F69)', margin: '2px 0 0' }}>
                    ★ 4.8 · Verified
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12, paddingTop: 8, borderTop: '1px solid var(--sb-border, #D8E0D5)' }}>
                <div>
                  <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 9, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</span>
                  <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--sb-primary, #6F8F69)', margin: 0 }}>
                    ₹1,800 <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--sb-text-muted, #7A847A)' }}>/can</span>
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: 'var(--sb-text-secondary, #4F5A51)' }}>
                  <MapPin size={11} color="var(--sb-primary, #6F8F69)" /> 1.2 km away
                </div>
              </div>
            </motion.div>

            {/* Card 2: Bottom Tilted Card */}
            <motion.div
              initial={{ opacity: 0, x: 20, rotate: 4 }}
              animate={{ opacity: 1, x: 0, rotate: 3 }}
              whileHover={{ rotate: 0, scale: 1.02, zIndex: 30 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute', bottom: 32, right: 16, width: 280,
                background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)',
                borderRadius: 8, padding: 14,
                boxShadow: '0 14px 32px rgba(0,0,0,0.07)',
                cursor: 'pointer', zIndex: 20,
              }}
              onClick={() => requireAuth('Preview Basmati Rice Lot', () => navigate('/marketplace'), 'Surplus Lot Inspection', 'Sign in or register your business to review batch details and reserve this lot.')}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <img
                  src="https://images.unsplash.com/photo-1586201375761-83865001e31c?w=160&auto=format&fit=crop&q=60"
                  alt="Basmati Rice"
                  style={{ width: 64, height: 64, borderRadius: 4, objectFit: 'cover', background: 'var(--sb-surface-soft, #F2F6EF)' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--sb-text-primary, #182018)', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Basmati Rice (25kg)
                  </h4>
                  <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: 'var(--sb-text-muted, #7A847A)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Store size={11} color="var(--sb-text-muted, #7A847A)" /> Singh Traders
                  </p>
                  <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600, color: 'var(--sb-primary, #6F8F69)', margin: '2px 0 0' }}>
                    ★ 4.5 · Verified
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12, paddingTop: 8, borderTop: '1px solid var(--sb-border, #D8E0D5)' }}>
                <div>
                  <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 9, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</span>
                  <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--sb-primary, #6F8F69)', margin: 0 }}>
                    ₹1,200 <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--sb-text-muted, #7A847A)' }}>/bag</span>
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: 'var(--sb-text-secondary, #4F5A51)' }}>
                  <MapPin size={11} color="var(--sb-primary, #6F8F69)" /> 3.5 km away
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. "WHAT CAN I DO WITH STOCKBRIDGE?" ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px', borderBottom: '1px solid var(--sb-border, #D8E0D5)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 30, color: 'var(--sb-text-primary, #182018)', margin: '0 0 8px' }}>
            What can I do with StockBridge?
          </h2>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 15, color: 'var(--sb-text-secondary, #4F5A51)', margin: 0 }}>
            An intuitive platform built for the daily inventory realities of Indian businesses.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}
        >
          {[
            {
              icon: <Search size={22} color="var(--sb-primary, #6F8F69)" />,
              title: 'Buy Stock',
              desc: 'Find useful surplus inventory nearby at attractive business liquidation prices.',
              link: '/marketplace',
            },
            {
              icon: <Store size={22} color="var(--sb-primary, #6F8F69)" />,
              title: 'Sell Extra Stock',
              desc: 'Turn unused or slow-moving stock into immediate liquid working capital.',
              link: '/create-listing',
            },
            {
              icon: <Mic size={22} color="var(--sb-primary, #6F8F69)" />,
              title: 'Sell with your Voice',
              desc: 'Speak naturally in Hindi, English, Kannada or Punjabi instead of filling forms.',
              link: '/create-listing',
            },
            {
              icon: <Radar size={22} color="var(--sb-primary, #6F8F69)" />,
              title: 'Smart Matching',
              desc: 'Tell us your stock needs and get instant AI-matched lots within 10km.',
              link: '/marketplace',
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -3, borderColor: 'var(--sb-primary, #6F8F69)' }}
              style={{
                background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)',
                borderRadius: 8, padding: '24px 20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s',
                display: 'flex', flexDirection: 'column',
              }}
              onClick={() => {
                if (item.link === '/marketplace') {
                  navigate(user ? '/marketplace' : '/market-preview');
                } else {
                  requireAuth(
                    item.title,
                    () => navigate(item.link),
                    `${item.title} Portal`,
                    'Sign in or register your merchant account to access surplus inventory management and selling tools.'
                  );
                }
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 6,
                background: 'var(--sb-primary-pale, #EAF1E7)', border: '1px solid var(--sb-border, #D8E0D5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                {item.icon}
              </div>
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 18, color: 'var(--sb-text-primary, #182018)', margin: '0 0 8px' }}>
                {item.title}
              </h3>
              <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-secondary, #4F5A51)', lineHeight: 1.5, margin: 0, flex: 1 }}>
                {item.desc}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 16, fontFamily: 'Work Sans, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--sb-primary, #6F8F69)' }}>
                Explore <ChevronRight size={13} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── 3. "HOW STOCKBRIDGE WORKS" (Side-by-Side Dual Flow) ── */}
      <section id="how-it-works" style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px', borderBottom: '1px solid var(--sb-border, #D8E0D5)' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 30, color: 'var(--sb-text-primary, #182018)', margin: '0 0 8px' }}>
            How StockBridge Works
          </h2>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 15, color: 'var(--sb-text-secondary, #4F5A51)', margin: 0 }}>
            A streamlined 4-step process designed for zero friction.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          
          {/* Buying Process */}
          <div style={{ background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 8, padding: 32, boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, color: 'var(--sb-primary, #6F8F69)' }}>
              <ShoppingCart size={20} />
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 20, color: 'var(--sb-text-primary, #182018)', margin: 0 }}>
                Buying Process
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { step: '1', title: 'Tell us what you need', desc: 'Search keywords, select categories, or use Smart Match radius search.' },
                { step: '2', title: 'See suitable stock nearby', desc: 'Browse available lots with verified merchant ratings, distance, and unit prices.' },
                { step: '3', title: 'Lock your 24h reservation', desc: 'Reserve the lot with zero advance payment to open direct chat with the seller.' },
                { step: '4', title: 'Coordinate & handover', desc: 'Confirm handover terms in chat, verify the goods in person, and complete trade.' },
              ].map((s) => (
                <div key={s.step} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--sb-primary, #6F8F69)', color: '#FFFFFF',
                    fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 2,
                  }}>
                    {s.step}
                  </div>
                  <div>
                    <h4 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--sb-text-primary, #182018)', margin: '0 0 4px' }}>
                      {s.title}
                    </h4>
                    <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-secondary, #4F5A51)', margin: 0, lineHeight: 1.4 }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selling Process */}
          <div style={{ background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 8, padding: 32, boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, color: 'var(--sb-primary-hover, #5F7E5A)' }}>
              <Store size={20} />
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 20, color: 'var(--sb-text-primary, #182018)', margin: 0 }}>
                Selling Process
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { step: '1', title: 'Enter or speak details', desc: 'Speak in your regional language or use quick manual entry.' },
                { step: '2', title: 'AI creates the listing', desc: 'Automatic extraction of lot quantity, price per unit, urgency, and expiry date.' },
                { step: '3', title: 'Nearby businesses discover it', desc: 'Your listing is promoted to registered verified merchants within 10km.' },
                { step: '4', title: 'Confirm & collect payment', desc: 'Accept reservations, chat with buyers, hand over stock, and collect cash.' },
              ].map((s) => (
                <div key={s.step} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--sb-primary-hover, #5F7E5A)', color: '#FFFFFF',
                    fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 2,
                  }}>
                    {s.step}
                  </div>
                  <div>
                    <h4 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--sb-text-primary, #182018)', margin: '0 0 4px' }}>
                      {s.title}
                    </h4>
                    <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-secondary, #4F5A51)', margin: 0, lineHeight: 1.4 }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. "STOCK NEAR YOU" (Marketplace Preview Showcase) ── */}
      <section id="market-preview" style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px', borderBottom: '1px solid var(--sb-border, #D8E0D5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--sb-primary-pale, #EAF1E7)', border: '1px solid var(--sb-primary-soft, #DCE8D8)',
              borderRadius: 4, padding: '3px 10px', marginBottom: 8,
            }}>
              <Lock size={11} color="var(--sb-primary, #6F8F69)" />
              <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--sb-primary, #6F8F69)' }}>
                Marketplace Preview
              </span>
            </div>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 30, color: 'var(--sb-text-primary, #182018)', margin: '0 0 6px' }}>
              Stock Near You
            </h2>
            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: 'var(--sb-text-secondary, #4F5A51)', margin: 0, maxWidth: 640 }}>
              Live sample surplus lots listed by verified merchants. Sign in to browse complete inventory, review batch certificates, and place instant 24h reservations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(user ? '/marketplace' : '/market-preview')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: 'Work Sans, sans-serif', fontSize: 13, fontWeight: 600,
              color: 'var(--sb-primary, #6F8F69)', textDecoration: 'none', background: 'transparent',
              border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            <span>View All Marketplace Lots</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <div style={{ width: 32, height: 32, border: '2px solid var(--sb-border, #D8E0D5)', borderTopColor: 'var(--sb-primary, #6F8F69)', borderRadius: '50%' }} className="animate-stitch-spin" />
          </div>
        ) : featuredListings.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {featuredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isPublicPreview={!user}
                onPreviewClick={() => requireAuth(`Lot: ${listing.title}`, () => navigate(`/listings/${listing.id}`), 'Unlock Lot Details', 'Sign in or register your business to review full lot certificates, unit quantities, and lock 24-hour reservations.')}
              />
            ))}
          </div>
        ) : (
          <div style={{ background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 8, padding: '32px 24px', textAlign: 'center' }}>
            <Package size={32} color="var(--sb-text-muted, #7A847A)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 15, color: 'var(--sb-text-primary, #182018)', margin: '0 0 6px' }}>Explore Available Lots</p>
            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-muted, #7A847A)', margin: '0 0 16px' }}>Discover surplus inventory across your local area.</p>
            <button
              type="button"
              onClick={() => navigate(user ? '/marketplace' : '/market-preview')}
              className="stitch-btn-primary"
              style={{ padding: '8px 20px', fontSize: 12, borderRadius: 4, cursor: 'pointer', border: 'none' }}
            >
              Browse Marketplace
            </button>
          </div>
        )}
      </section>

      {/* ── 5. "EXPLORE BY CATEGORY" ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px', borderBottom: '1px solid var(--sb-border, #D8E0D5)' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 28, color: 'var(--sb-text-primary, #182018)', margin: '0 0 8px' }}>
            Explore by Category
          </h2>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: 'var(--sb-text-secondary, #4F5A51)', margin: 0 }}>
            Find high-margin surplus inventory across all standard business sectors.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { name: 'Groceries', count: '14 lots', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=60' },
            { name: 'Prepared Food & Bakery', count: '9 lots', img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=60' },
            { name: 'Packaging', count: '18 lots', img: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=400&auto=format&fit=crop&q=60' },
            { name: 'Electronics', count: '7 lots', img: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400&auto=format&fit=crop&q=60' },
            { name: 'Stationery', count: '12 lots', img: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&auto=format&fit=crop&q=60' },
            { name: 'Textiles', count: '8 lots', img: 'https://images.unsplash.com/photo-1528458909336-e7a0adfed0a5?w=400&auto=format&fit=crop&q=60' },
            { name: 'Hardware', count: '15 lots', img: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=400&auto=format&fit=crop&q=60' },
            { name: 'Dairy & Beverages', count: '11 lots', img: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=400&auto=format&fit=crop&q=60' },
          ].map((cat) => (
            <motion.div
              key={cat.name}
              whileHover={{ scale: 1.02 }}
              style={{
                position: 'relative', height: 130, borderRadius: 6,
                overflow: 'hidden', border: '1px solid var(--sb-border, #D8E0D5)',
                cursor: 'pointer',
              }}
              onClick={() => {
                if (user) {
                  navigate(`/marketplace?category=${encodeURIComponent(cat.name)}`);
                } else {
                  navigate(`/market-preview?category=${encodeURIComponent(cat.name)}`);
                }
              }}
            >
              <img
                src={cat.img}
                alt={cat.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                justifyContent: 'flex-end', padding: '14px',
                background: 'linear-gradient(to top, rgba(24,32,24,0.85), transparent 75%)',
              }}>
                <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15, color: '#FFFFFF', margin: '0 0 2px' }}>
                  {cat.name}
                </h3>
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600, color: 'var(--sb-primary-soft, #DCE8D8)' }}>
                  {cat.count} nearby
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 6. "VOICE LISTING DEMONSTRATION" ("Don't type. Just speak.") ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '72px 24px', borderBottom: '1px solid var(--sb-border, #D8E0D5)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'center' }}>
          
          {/* Left Column */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--sb-primary-pale, #EAF1E7)', border: '1px solid var(--sb-primary-soft, #DCE8D8)',
              borderRadius: 4, padding: '4px 10px', marginBottom: 16,
            }}>
              <Sparkles size={13} color="var(--sb-primary, #6F8F69)" />
              <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600, color: 'var(--sb-primary, #6F8F69)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                AI Voice Pipeline
              </span>
            </div>

            <h2 style={{
              fontFamily: 'Sora, sans-serif', fontWeight: 700,
              fontSize: 'clamp(32px, 4vw, 44px)', lineHeight: 1.15,
              color: 'var(--sb-text-primary, #182018)', margin: '0 0 16px',
            }}>
              Don't type.<br />
              <span style={{ color: 'var(--sb-primary, #6F8F69)' }}>Just speak.</span>
            </h2>

            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 15, color: 'var(--sb-text-secondary, #4F5A51)', lineHeight: 1.6, margin: '0 0 24px' }}>
              Listing your extra stock is as simple as sending a voice note. Our multi-lingual AI model extracts pricing, quantity, category, and expiry in seconds.
            </p>

            {/* Interactive Audio Simulator Box */}
            <div style={{ background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 8, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'var(--sb-primary, #6F8F69)', color: '#FFFFFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} className="animate-pulse">
                  <Mic size={20} />
                </div>

                {/* Animated Waveform */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 28 }}>
                  {[12, 24, 16, 28, 20, 10, 24, 18, 26, 14, 22, 12, 20].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [h * 0.4, h, h * 0.4] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }}
                      style={{ width: 3, background: 'var(--sb-primary, #6F8F69)', borderRadius: 2 }}
                    />
                  ))}
                </div>
              </div>

              <p style={{
                fontFamily: 'Work Sans, sans-serif', fontSize: 14, fontStyle: 'italic',
                color: 'var(--sb-text-primary, #182018)', margin: '0 0 12px', background: 'var(--sb-surface-soft, #F2F6EF)',
                padding: '12px 14px', borderRadius: 4, border: '1px solid var(--sb-border, #D8E0D5)',
              }}>
                {voiceDemos[activeVoicePrompt].text}
              </p>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {voiceDemos.map((demo, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveVoicePrompt(idx)}
                    style={{
                      background: activeVoicePrompt === idx ? 'var(--sb-primary-pale, #EAF1E7)' : 'transparent',
                      border: `1px solid ${activeVoicePrompt === idx ? 'var(--sb-primary, #6F8F69)' : 'var(--sb-border, #D8E0D5)'}`,
                      color: activeVoicePrompt === idx ? 'var(--sb-primary, #6F8F69)' : 'var(--sb-text-muted, #7A847A)',
                      borderRadius: 4, padding: '4px 10px',
                      fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Sample {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AI Generated Mockup Card */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <motion.div
              key={activeVoicePrompt}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                width: '100%', maxWidth: 360, background: 'var(--sb-surface, #FFFFFF)',
                border: '1px solid var(--sb-primary, #6F8F69)', borderRadius: 8,
                overflow: 'hidden', position: 'relative',
                boxShadow: '0 16px 36px rgba(111,143,105,0.12)',
              }}
            >
              {/* Badge */}
              <div style={{
                position: 'absolute', top: 12, right: 12, zIndex: 10,
                background: 'var(--sb-primary, #6F8F69)', color: '#FFFFFF',
                fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                padding: '4px 10px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Sparkles size={12} /> AI Generated
              </div>

              {/* Photo */}
              <div style={{ height: 160, background: 'var(--sb-surface-soft, #F2F6EF)', position: 'relative' }}>
                <img
                  src={voiceDemos[activeVoicePrompt].img}
                  alt={voiceDemos[activeVoicePrompt].title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Body */}
              <div style={{ padding: 20 }}>
                <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--sb-text-primary, #182018)', margin: '0 0 2px' }}>
                  {voiceDemos[activeVoicePrompt].title}
                </h3>
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {voiceDemos[activeVoicePrompt].category}
                </span>

                {/* Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '16px 0' }}>
                  <div style={{ background: 'var(--sb-surface-soft, #F2F6EF)', padding: '10px 12px', borderRadius: 4, border: '1px solid var(--sb-border, #D8E0D5)' }}>
                    <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 9, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</span>
                    <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--sb-primary, #6F8F69)', margin: '2px 0 0' }}>
                      {voiceDemos[activeVoicePrompt].price}
                    </p>
                  </div>
                  <div style={{ background: 'var(--sb-surface-soft, #F2F6EF)', padding: '10px 12px', borderRadius: 4, border: '1px solid var(--sb-border, #D8E0D5)' }}>
                    <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 9, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quantity</span>
                    <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--sb-text-primary, #182018)', margin: '2px 0 0' }}>
                      {voiceDemos[activeVoicePrompt].qty}
                    </p>
                  </div>
                </div>

                {/* Expiry Pill */}
                <div style={{
                  background: 'rgba(184,138,69,0.1)', border: '1px solid rgba(184,138,69,0.25)',
                  borderRadius: 4, padding: '8px 12px', marginBottom: 16,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase' }}>Expiry</span>
                  <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--sb-warning, #B88A45)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {voiceDemos[activeVoicePrompt].expiry}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => requireAuth(
                    'AI Voice Listing',
                    () => navigate('/create-listing'),
                    'Voice-to-Listing Pipeline',
                    'Sign in or register your business to speak your inventory and let AI generate verified surplus listings.'
                  )}
                  className="stitch-btn-primary"
                  style={{
                    display: 'block', textAlign: 'center', width: '100%',
                    padding: '12px', borderRadius: 4,
                    fontSize: 12, letterSpacing: '0.06em', boxSizing: 'border-box',
                    cursor: 'pointer', border: 'none',
                  }}
                >
                  Try Voice Listing Now
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 7. "WHY STOCKBRIDGE?" ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px', borderBottom: '1px solid var(--sb-border, #D8E0D5)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 30, color: 'var(--sb-text-primary, #182018)', margin: '0 0 8px' }}>
            Why StockBridge?
          </h2>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 15, color: 'var(--sb-text-secondary, #4F5A51)', margin: 0 }}>
            Built specifically to eliminate surplus inventory losses across India.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {[
            {
              title: 'Reduce Wasted Stock',
              desc: 'Monetize surplus goods before they expire or depreciate in value.',
              tag: 'Liquidity',
            },
            {
              title: 'Buy at Better Prices',
              desc: 'Improve your business margins by sourcing surplus lots below wholesale cost.',
              tag: 'Margins',
            },
            {
              title: '10km Hyperlocal Radius',
              desc: 'Pick up or deliver same-day within your immediate business neighborhood.',
              tag: 'Proximity',
            },
            {
              title: 'Verified Counterparties',
              desc: 'Every trader undergoes merchant verification for trusted transactions.',
              tag: 'Security',
            },
          ].map((card, i) => (
            <div key={i} style={{ background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 8, padding: 24 }}>
              <span style={{
                fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--sb-primary, #6F8F69)',
                background: 'var(--sb-primary-pale, #EAF1E7)', border: '1px solid var(--sb-primary-soft, #DCE8D8)',
                borderRadius: 4, padding: '3px 8px', display: 'inline-block', marginBottom: 12,
              }}>
                {card.tag}
              </span>
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 17, color: 'var(--sb-text-primary, #182018)', margin: '0 0 8px' }}>
                {card.title}
              </h3>
              <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-muted, #7A847A)', lineHeight: 1.5, margin: 0 }}>
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 8. FINAL CALL TO ACTION ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px 100px', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            background: 'var(--sb-surface, #FFFFFF)',
            border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 12,
            padding: '56px 24px', maxWidth: 840, margin: '0 auto',
            boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
          }}
        >
          <h2 style={{
            fontFamily: 'Sora, sans-serif', fontWeight: 700,
            fontSize: 'clamp(28px, 4vw, 40px)', color: 'var(--sb-text-primary, #182018)', margin: '0 0 16px',
            letterSpacing: '-0.01em',
          }}>
            Ready to start trading surplus stock?
          </h2>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 16, color: 'var(--sb-text-secondary, #4F5A51)', maxWidth: 480, margin: '0 auto 32px' }}>
            Join thousands of local businesses freeing up cash flow and discovering inventory bargains today.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => navigate(user ? '/marketplace' : '/market-preview')}
              className="stitch-btn-primary"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 32px', fontSize: 14,
                borderRadius: 6, letterSpacing: '0.04em', cursor: 'pointer', border: 'none',
              }}
            >
              <ShoppingCart size={16} />
              <span>Browse Marketplace</span>
            </button>
            <button
              type="button"
              onClick={() => requireAuth(
                'List Your Surplus',
                () => navigate('/create-listing'),
                'Start Selling Surplus',
                'Sign in or register your business to list your surplus stock.'
              )}
              className="stitch-btn-ghost"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 32px', fontSize: 14,
                borderRadius: 6, letterSpacing: '0.04em', cursor: 'pointer',
              }}
            >
              <Store size={16} />
              <span>List Your Surplus</span>
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── Visual Authentication Gate Modal ── */}
      <AuthGateModal
        isOpen={authGate.isOpen}
        onClose={() => setAuthGate((prev) => ({ ...prev, isOpen: false }))}
        title={authGate.title}
        description={authGate.description}
        actionContext={authGate.actionContext}
      />
    </div>
  );
};
