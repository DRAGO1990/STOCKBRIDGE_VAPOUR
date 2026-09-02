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
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import type { Listing } from '../types';
import { ListingCard } from '../components/ListingCard';

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
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVoicePrompt, setActiveVoicePrompt] = useState(0);

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
        setFeaturedListings(res.data.slice(0, 3));
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
    <div style={{ background: '#131313', color: '#e5e2e1', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* ── 1. HERO SECTION ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px 80px', borderBottom: '1px solid #3d4947' }}>
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
              background: 'rgba(107,216,203,0.08)', border: '1px solid rgba(107,216,203,0.25)',
              borderRadius: 4, padding: '4px 12px', width: 'fit-content',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6bd8cb' }} className="animate-pulse" />
              <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6bd8cb' }}>
                Verified B2B Surplus Exchange
              </span>
            </div>

            <h1 style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(32px, 5vw, 52px)',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: '#e5e2e1',
              margin: 0,
            }}>
              Buy and sell extra stock from businesses near you.
            </h1>

            <p style={{
              fontFamily: 'Work Sans, sans-serif',
              fontSize: 'clamp(15px, 2vw, 18px)',
              lineHeight: 1.6,
              color: '#bcc9c6',
              margin: 0,
              maxWidth: 540,
            }}>
              Find deeply discounted surplus inventory nearby or turn excess stock into working capital before it loses value.
            </p>

            {/* CTA Group */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, paddingTop: 8 }}>
              <Link
                to="/marketplace"
                className="stitch-btn-primary"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '14px 28px', fontSize: 14, textDecoration: 'none',
                  borderRadius: 6, letterSpacing: '0.04em',
                }}
              >
                <ShoppingCart size={16} />
                <span>Find Stock</span>
              </Link>
              <Link
                to="/create-listing"
                className="stitch-btn-ghost"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '14px 28px', fontSize: 14, textDecoration: 'none',
                  borderRadius: 6, letterSpacing: '0.04em',
                }}
              >
                <Store size={16} />
                <span>Sell Extra Stock</span>
              </Link>
            </div>

            {/* Key trust badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, paddingTop: 16, borderTop: '1px solid #201f1f', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={16} color="#6bd8cb" />
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#879391' }}>100% Verified Merchants</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={16} color="#6bd8cb" />
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#879391' }}>10km Proximity Engine</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={16} color="#6bd8cb" />
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: '#879391' }}>Zero Advance Risk</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Interactive 3D Stack Mockup */}
          <div style={{ position: 'relative', height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(circle at 60% 40%, rgba(107,216,203,0.06), transparent 70%)',
              border: '1px solid #3d4947', borderRadius: 8,
            }} />

            {/* Card 1: Top Tilted Card */}
            <motion.div
              initial={{ opacity: 0, x: -20, rotate: -4 }}
              animate={{ opacity: 1, x: 0, rotate: -3 }}
              whileHover={{ rotate: 0, scale: 1.02, zIndex: 30 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute', top: 32, left: 16, width: 280,
                background: '#1c1b1b', border: '1px solid #3d4947',
                borderRadius: 8, padding: 14,
                boxShadow: '0 16px 32px rgba(0,0,0,0.6)',
                cursor: 'pointer', zIndex: 10,
              }}
              onClick={() => navigate('/marketplace')}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <img
                  src="https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=160&auto=format&fit=crop&q=60"
                  alt="Cooking Oil"
                  style={{ width: 64, height: 64, borderRadius: 4, objectFit: 'cover', background: '#2a2a2a' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 700, color: '#e5e2e1', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Premium Cooking Oil
                  </h4>
                  <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: '#879391', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Store size={11} color="#879391" /> Kumar Groceries
                  </p>
                  <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600, color: '#6bd8cb', margin: '2px 0 0' }}>
                    ★ 4.8 · Verified
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12, paddingTop: 8, borderTop: '1px solid #3d4947' }}>
                <div>
                  <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 9, color: '#879391', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</span>
                  <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700, color: '#6bd8cb', margin: 0 }}>
                    ₹1,800 <span style={{ fontSize: 11, fontWeight: 400, color: '#879391' }}>/can</span>
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: '#bcc9c6' }}>
                  <MapPin size={11} color="#6bd8cb" /> 1.2 km away
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
                background: '#1c1b1b', border: '1px solid #3d4947',
                borderRadius: 8, padding: 14,
                boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
                cursor: 'pointer', zIndex: 20,
              }}
              onClick={() => navigate('/marketplace')}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <img
                  src="https://images.unsplash.com/photo-1586201375761-83865001e31c?w=160&auto=format&fit=crop&q=60"
                  alt="Basmati Rice"
                  style={{ width: 64, height: 64, borderRadius: 4, objectFit: 'cover', background: '#2a2a2a' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 700, color: '#e5e2e1', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Basmati Rice (25kg)
                  </h4>
                  <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: '#879391', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Store size={11} color="#879391" /> Singh Traders
                  </p>
                  <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600, color: '#6bd8cb', margin: '2px 0 0' }}>
                    ★ 4.5 · Verified
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12, paddingTop: 8, borderTop: '1px solid #3d4947' }}>
                <div>
                  <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 9, color: '#879391', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</span>
                  <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700, color: '#6bd8cb', margin: 0 }}>
                    ₹1,200 <span style={{ fontSize: 11, fontWeight: 400, color: '#879391' }}>/bag</span>
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: '#bcc9c6' }}>
                  <MapPin size={11} color="#6bd8cb" /> 3.5 km away
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. "WHAT CAN I DO WITH STOCKBRIDGE?" ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px', borderBottom: '1px solid #3d4947' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 30, color: '#e5e2e1', margin: '0 0 8px' }}>
            What can I do with StockBridge?
          </h2>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 15, color: '#bcc9c6', margin: 0 }}>
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
              icon: <Search size={22} color="#6bd8cb" />,
              title: 'Buy Stock',
              desc: 'Find useful surplus inventory nearby at attractive business liquidation prices.',
              link: '/marketplace',
            },
            {
              icon: <Store size={22} color="#6bd8cb" />,
              title: 'Sell Extra Stock',
              desc: 'Turn unused or slow-moving stock into immediate liquid working capital.',
              link: '/create-listing',
            },
            {
              icon: <Mic size={22} color="#6bd8cb" />,
              title: 'Sell with your Voice',
              desc: 'Speak naturally in Hindi, English, Kannada or Punjabi instead of filling forms.',
              link: '/create-listing',
            },
            {
              icon: <Radar size={22} color="#6bd8cb" />,
              title: 'Smart Matching',
              desc: 'Tell us your stock needs and get instant AI-matched lots within 10km.',
              link: '/marketplace',
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -3, borderColor: '#6bd8cb' }}
              style={{
                background: '#1c1b1b', border: '1px solid #3d4947',
                borderRadius: 8, padding: '24px 20px',
                cursor: 'pointer', transition: 'border-color 0.2s',
                display: 'flex', flexDirection: 'column',
              }}
              onClick={() => navigate(item.link)}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 6,
                background: 'rgba(107,216,203,0.1)', border: '1px solid rgba(107,216,203,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                {item.icon}
              </div>
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 18, color: '#e5e2e1', margin: '0 0 8px' }}>
                {item.title}
              </h3>
              <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#879391', lineHeight: 1.5, margin: 0, flex: 1 }}>
                {item.desc}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 16, fontFamily: 'Work Sans, sans-serif', fontSize: 12, fontWeight: 600, color: '#6bd8cb' }}>
                Explore <ChevronRight size={13} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── 3. "HOW STOCKBRIDGE WORKS" (Side-by-Side Dual Flow) ── */}
      <section id="how-it-works" style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px', borderBottom: '1px solid #3d4947' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 30, color: '#e5e2e1', margin: '0 0 8px' }}>
            How StockBridge Works
          </h2>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 15, color: '#bcc9c6', margin: 0 }}>
            A streamlined 4-step process designed for zero friction.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          
          {/* Buying Process */}
          <div style={{ background: '#1c1b1b', border: '1px solid #3d4947', borderRadius: 8, padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, color: '#6bd8cb' }}>
              <ShoppingCart size={20} />
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 20, color: '#e5e2e1', margin: 0 }}>
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
                    background: '#29a195', color: '#003732',
                    fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 2,
                  }}>
                    {s.step}
                  </div>
                  <div>
                    <h4 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 15, color: '#e5e2e1', margin: '0 0 4px' }}>
                      {s.title}
                    </h4>
                    <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#879391', margin: 0, lineHeight: 1.4 }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selling Process */}
          <div style={{ background: '#1c1b1b', border: '1px solid #3d4947', borderRadius: 8, padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, color: '#ddb7ff' }}>
              <Store size={20} />
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 20, color: '#e5e2e1', margin: 0 }}>
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
                    background: '#6f00be', color: '#f0dbff',
                    fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 2,
                  }}>
                    {s.step}
                  </div>
                  <div>
                    <h4 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 15, color: '#e5e2e1', margin: '0 0 4px' }}>
                      {s.title}
                    </h4>
                    <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#879391', margin: 0, lineHeight: 1.4 }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. "STOCK NEAR YOU" (Featured Live Listings) ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px', borderBottom: '1px solid #3d4947' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 30, color: '#e5e2e1', margin: '0 0 6px' }}>
              Stock Near You
            </h2>
            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: '#bcc9c6', margin: 0 }}>
              Fresh surplus listings from verified local businesses.
            </p>
          </div>
          <Link
            to="/marketplace"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: 'Work Sans, sans-serif', fontSize: 13, fontWeight: 600,
              color: '#6bd8cb', textDecoration: 'none',
            }}
          >
            View All Marketplace Lots <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <div style={{ width: 32, height: 32, border: '2px solid #3d4947', borderTopColor: '#6bd8cb', borderRadius: '50%' }} className="animate-stitch-spin" />
          </div>
        ) : featuredListings.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {featuredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div style={{ background: '#1c1b1b', border: '1px solid #3d4947', borderRadius: 8, padding: '32px 24px', textAlign: 'center' }}>
            <Package size={32} color="#879391" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 15, color: '#e5e2e1', margin: '0 0 6px' }}>Explore Available Lots</p>
            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#879391', margin: '0 0 16px' }}>Discover surplus inventory across your local area.</p>
            <Link to="/marketplace" className="stitch-btn-primary" style={{ padding: '8px 20px', fontSize: 12, textDecoration: 'none', borderRadius: 4 }}>
              Browse Marketplace
            </Link>
          </div>
        )}
      </section>

      {/* ── 5. "EXPLORE BY CATEGORY" ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px', borderBottom: '1px solid #3d4947' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 28, color: '#e5e2e1', margin: '0 0 8px' }}>
            Explore by Category
          </h2>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: '#bcc9c6', margin: 0 }}>
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
                overflow: 'hidden', border: '1px solid #3d4947',
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/marketplace?category=${encodeURIComponent(cat.name)}`)}
            >
              <img
                src={cat.img}
                alt={cat.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.35)' }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                justifyContent: 'flex-end', padding: '14px',
                background: 'linear-gradient(to top, rgba(19,19,19,0.9), transparent 80%)',
              }}>
                <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15, color: '#e5e2e1', margin: '0 0 2px' }}>
                  {cat.name}
                </h3>
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: '#6bd8cb' }}>
                  {cat.count} nearby
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 6. "VOICE LISTING DEMONSTRATION" ("Don't type. Just speak.") ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '72px 24px', borderBottom: '1px solid #3d4947' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'center' }}>
          
          {/* Left Column */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(221,183,255,0.1)', border: '1px solid rgba(221,183,255,0.25)',
              borderRadius: 4, padding: '4px 10px', marginBottom: 16,
            }}>
              <Sparkles size={13} color="#ddb7ff" />
              <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600, color: '#ddb7ff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                AI Voice Pipeline
              </span>
            </div>

            <h2 style={{
              fontFamily: 'Sora, sans-serif', fontWeight: 700,
              fontSize: 'clamp(32px, 4vw, 44px)', lineHeight: 1.15,
              color: '#e5e2e1', margin: '0 0 16px',
            }}>
              Don't type.<br />
              <span style={{ color: '#6bd8cb' }}>Just speak.</span>
            </h2>

            <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 15, color: '#bcc9c6', lineHeight: 1.6, margin: '0 0 24px' }}>
              Listing your extra stock is as simple as sending a voice note. Our multi-lingual AI model extracts pricing, quantity, category, and expiry in seconds.
            </p>

            {/* Interactive Audio Simulator Box */}
            <div style={{ background: '#1c1b1b', border: '1px solid #3d4947', borderRadius: 8, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: '#29a195', color: '#003732',
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
                      style={{ width: 3, background: '#6bd8cb', borderRadius: 2 }}
                    />
                  ))}
                </div>
              </div>

              <p style={{
                fontFamily: 'Work Sans, sans-serif', fontSize: 14, fontStyle: 'italic',
                color: '#e5e2e1', margin: '0 0 12px', background: '#131313',
                padding: '12px 14px', borderRadius: 4, border: '1px solid #3d4947',
              }}>
                {voiceDemos[activeVoicePrompt].text}
              </p>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {voiceDemos.map((demo, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveVoicePrompt(idx)}
                    style={{
                      background: activeVoicePrompt === idx ? 'rgba(107,216,203,0.15)' : 'transparent',
                      border: `1px solid ${activeVoicePrompt === idx ? '#6bd8cb' : '#3d4947'}`,
                      color: activeVoicePrompt === idx ? '#6bd8cb' : '#879391',
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
                width: '100%', maxWidth: 360, background: '#1c1b1b',
                border: '1px solid #6bd8cb', borderRadius: 8,
                overflow: 'hidden', position: 'relative',
                boxShadow: '0 16px 36px rgba(107,216,203,0.08)',
              }}
            >
              {/* Badge */}
              <div style={{
                position: 'absolute', top: 12, right: 12, zIndex: 10,
                background: '#6bd8cb', color: '#003732',
                fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                padding: '4px 10px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Sparkles size={12} /> AI Generated
              </div>

              {/* Photo */}
              <div style={{ height: 160, background: '#2a2a2a', position: 'relative' }}>
                <img
                  src={voiceDemos[activeVoicePrompt].img}
                  alt={voiceDemos[activeVoicePrompt].title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Body */}
              <div style={{ padding: 20 }}>
                <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, color: '#e5e2e1', margin: '0 0 2px' }}>
                  {voiceDemos[activeVoicePrompt].title}
                </h3>
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: '#879391', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {voiceDemos[activeVoicePrompt].category}
                </span>

                {/* Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '16px 0' }}>
                  <div style={{ background: '#2a2a2a', padding: '10px 12px', borderRadius: 4 }}>
                    <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 9, color: '#879391', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</span>
                    <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 700, color: '#6bd8cb', margin: '2px 0 0' }}>
                      {voiceDemos[activeVoicePrompt].price}
                    </p>
                  </div>
                  <div style={{ background: '#2a2a2a', padding: '10px 12px', borderRadius: 4 }}>
                    <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 9, color: '#879391', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quantity</span>
                    <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 700, color: '#e5e2e1', margin: '2px 0 0' }}>
                      {voiceDemos[activeVoicePrompt].qty}
                    </p>
                  </div>
                </div>

                {/* Expiry Pill */}
                <div style={{
                  background: 'rgba(246,179,81,0.1)', border: '1px solid rgba(246,179,81,0.25)',
                  borderRadius: 4, padding: '8px 12px', marginBottom: 16,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: '#879391', textTransform: 'uppercase' }}>Expiry</span>
                  <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, fontWeight: 600, color: '#f6b351', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {voiceDemos[activeVoicePrompt].expiry}
                  </span>
                </div>

                <Link
                  to="/create-listing"
                  className="stitch-btn-primary"
                  style={{
                    display: 'block', textAlign: 'center', width: '100%',
                    padding: '12px', textDecoration: 'none', borderRadius: 4,
                    fontSize: 12, letterSpacing: '0.06em', boxSizing: 'border-box',
                  }}
                >
                  Try Voice Listing Now
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 7. "WHY STOCKBRIDGE?" ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px', borderBottom: '1px solid #3d4947' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 30, color: '#e5e2e1', margin: '0 0 8px' }}>
            Why StockBridge?
          </h2>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 15, color: '#bcc9c6', margin: 0 }}>
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
            <div key={i} style={{ background: '#1c1b1b', border: '1px solid #3d4947', borderRadius: 8, padding: 24 }}>
              <span style={{
                fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6bd8cb',
                background: 'rgba(107,216,203,0.1)', border: '1px solid rgba(107,216,203,0.2)',
                borderRadius: 4, padding: '3px 8px', display: 'inline-block', marginBottom: 12,
              }}>
                {card.tag}
              </span>
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 17, color: '#e5e2e1', margin: '0 0 8px' }}>
                {card.title}
              </h3>
              <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: '#879391', lineHeight: 1.5, margin: 0 }}>
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
            background: 'linear-gradient(180deg, #1c1b1b 0%, #131313 100%)',
            border: '1px solid #3d4947', borderRadius: 12,
            padding: '56px 24px', maxWidth: 840, margin: '0 auto',
          }}
        >
          <h2 style={{
            fontFamily: 'Sora, sans-serif', fontWeight: 700,
            fontSize: 'clamp(28px, 4vw, 40px)', color: '#e5e2e1', margin: '0 0 16px',
            letterSpacing: '-0.01em',
          }}>
            Ready to start trading surplus stock?
          </h2>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 16, color: '#bcc9c6', maxWidth: 480, margin: '0 auto 32px' }}>
            Join thousands of local businesses freeing up cash flow and discovering inventory bargains today.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Link
              to="/marketplace"
              className="stitch-btn-primary"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 32px', fontSize: 14, textDecoration: 'none',
                borderRadius: 6, letterSpacing: '0.04em',
              }}
            >
              <ShoppingCart size={16} />
              <span>Browse Marketplace</span>
            </Link>
            <Link
              to="/create-listing"
              className="stitch-btn-ghost"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 32px', fontSize: 14, textDecoration: 'none',
                borderRadius: 6, letterSpacing: '0.04em',
              }}
            >
              <Store size={16} />
              <span>List Your Surplus</span>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
