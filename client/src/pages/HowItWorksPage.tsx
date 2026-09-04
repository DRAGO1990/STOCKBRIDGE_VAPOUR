import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Store,
  Mic,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  MessageSquare,
  FileImage,
  TrendingDown,
  Calculator,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Layers,
  Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const HowItWorksPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState<'buyer' | 'seller'>('buyer');
  const [calcQuantity, setCalcQuantity] = useState<number>(100);
  const [calcRetailPrice, setCalcRetailPrice] = useState<number>(150);
  const [calcDiscountPercent, setCalcDiscountPercent] = useState<number>(35);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Margin Calculator Formulas
  const totalRetailVal = calcQuantity * calcRetailPrice;
  const unitDiscountPrice = Math.round(calcRetailPrice * (1 - calcDiscountPercent / 100));
  const totalSurplusVal = calcQuantity * unitDiscountPrice;
  const buyerSavings = totalRetailVal - totalSurplusVal;

  const faqs = [
    {
      q: 'What is the holding reservation mechanism?',
      a: 'When a buyer clicks "Reserve This Lot", the specified quantity is locked for 24 hours. The seller cannot sell it to others during this window, and direct chat unlocks immediately. No advance payment is required online.',
    },
    {
      q: 'How does Voice Listing understand regional Indian languages?',
      a: 'StockBridge integrates real-time speech recognition tuned for Indian accents and regional languages (Hindi, Hinglish, Kannada, Punjabi, English). Our AI extracts product name, brand, quantity, price, and expiry dates automatically.',
    },
    {
      q: 'How are merchants verified on StockBridge?',
      a: 'Merchants register with their business name, physical store address, and GPS coordinates. The admin moderation desk reviews registrations, and verified transactions build a permanent public trust rating.',
    },
    {
      q: 'Is there any commission or upfront platform fee?',
      a: 'StockBridge operates with zero advance deposit fees. Buyers and sellers coordinate handover directly, keeping margins 100% within the local merchant community.',
    },
    {
      q: 'What happens if a reservation expires or is cancelled?',
      a: 'If a reservation is not confirmed or cancelled within the holding window, the reserved quantity is instantly returned to the active marketplace so other local buyers can discover it.',
    },
  ];

  return (
    <div style={{ background: 'var(--sb-background, #F7F7F2)', color: 'var(--sb-text-primary, #182018)', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* ── 1. HERO BANNER ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px 56px', borderBottom: '1px solid var(--sb-border, #D8E0D5)' }}>
        <div style={{ maxWidth: 840, margin: '0 auto', textAlign: 'center' }}>
          
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--sb-primary-pale, #EAF1E7)', border: '1px solid var(--sb-primary-soft, #DCE8D8)',
              borderRadius: 4, padding: '4px 12px', marginBottom: 16,
            }}>
              <Sparkles size={12} color="var(--sb-primary, #6F8F69)" />
              <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600, color: 'var(--sb-primary, #6F8F69)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                The StockBridge Protocol
              </span>
            </div>

            <h1 style={{
              fontFamily: 'Sora, sans-serif', fontWeight: 700,
              fontSize: 'clamp(32px, 5vw, 48px)', lineHeight: 1.15,
              color: 'var(--sb-text-primary, #182018)', margin: '0 0 16px', letterSpacing: '-0.02em',
            }}>
              How StockBridge Turns Surplus Into Capital
            </h1>

            <p style={{
              fontFamily: 'Work Sans, sans-serif', fontSize: 'clamp(15px, 2vw, 18px)',
              color: 'var(--sb-text-secondary, #4F5A51)', lineHeight: 1.6, margin: '0 0 32px',
            }}>
              A transparent, zero-advance marketplace built for Indian Kiranas, distributors, and wholesale merchants to liquidate surplus stock within 10km.
            </p>

            {/* Interactive Role Switcher */}
            <div style={{
              display: 'inline-flex', background: 'var(--sb-surface-soft, #F2F6EF)',
              border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 6, padding: 4, gap: 4,
            }}>
              <button
                type="button"
                onClick={() => setActiveRole('buyer')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 24px', borderRadius: 4,
                  fontFamily: 'Work Sans, sans-serif', fontSize: 13, fontWeight: 600,
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  ...(activeRole === 'buyer'
                    ? { background: 'var(--sb-primary, #6F8F69)', color: '#FFFFFF' }
                    : { background: 'transparent', color: 'var(--sb-text-secondary, #4F5A51)' }),
                }}
              >
                <ShoppingCart size={15} />
                <span>For Buyers (Retailers & Kiranas)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveRole('seller')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 24px', borderRadius: 4,
                  fontFamily: 'Work Sans, sans-serif', fontSize: 13, fontWeight: 600,
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  ...(activeRole === 'seller'
                    ? { background: 'var(--sb-primary, #6F8F69)', color: '#FFFFFF' }
                    : { background: 'transparent', color: 'var(--sb-text-secondary, #4F5A51)' }),
                }}
              >
                <Store size={15} />
                <span>For Sellers (Wholesalers & Brands)</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 2. STEP-BY-STEP WORKFLOW WALKTHROUGH ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px', borderBottom: '1px solid var(--sb-border, #D8E0D5)' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 28, color: 'var(--sb-text-primary, #182018)', margin: '0 0 8px' }}>
            {activeRole === 'buyer' ? 'The 4-Step Sourcing Workflow' : 'The 4-Step Liquidation Workflow'}
          </h2>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: 'var(--sb-text-secondary, #4F5A51)', margin: 0 }}>
            {activeRole === 'buyer'
              ? 'Find stock, reserve with zero risk, coordinate pickup, and expand your profit margins.'
              : 'Speak or type details, let AI generate the lot, match with local buyers, and collect cash.'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {(activeRole === 'buyer'
            ? [
                {
                  num: '01',
                  icon: <MapPin size={22} color="var(--sb-primary, #6F8F69)" />,
                  title: 'Discover Local Surplus',
                  desc: 'Filter inventory by category, keyword, and proximity radius (2km to 50km). Real-time distance and urgency badges highlight the best deals.',
                  tag: 'Hyperlocal',
                },
                {
                  num: '02',
                  icon: <Lock size={22} color="var(--sb-primary, #6F8F69)" />,
                  title: 'Lock 24h Reservation',
                  desc: 'Lock the desired batch volume with zero advance money. The inventory is held exclusively for you, preventing other buyers from poaching it.',
                  tag: 'Zero Advance',
                },
                {
                  num: '03',
                  icon: <MessageSquare size={22} color="var(--sb-primary, #6F8F69)" />,
                  title: 'Direct Negotiation Chat',
                  desc: 'Coordinate pickup timing, inspect batch expiry dates, verify logistics, or negotiate volume terms directly via real-time WebSocket chat.',
                  tag: 'Live Trade',
                },
                {
                  num: '04',
                  icon: <ShieldCheck size={22} color="var(--sb-primary, #6F8F69)" />,
                  title: 'Handover & Trust Review',
                  desc: 'Inspect goods physically on pickup, confirm completion with optional invoice/photo proof, and rate the counterparty to build trust score.',
                  tag: 'Verified',
                },
              ]
            : [
                {
                  num: '01',
                  icon: <Mic size={22} color="var(--sb-primary, #6F8F69)" />,
                  title: 'Speak in Native Language',
                  desc: 'Tap the mic and speak naturally in Hindi, Hinglish, Kannada, Punjabi, or English. Mention product, quantity, rate, and expiry.',
                  tag: 'AI Voice',
                },
                {
                  num: '02',
                  icon: <Sparkles size={22} color="var(--sb-primary, #6F8F69)" />,
                  title: 'Instant Structured Lot',
                  desc: 'Our AI model extracts lot title, category, unit price, and expiry urgency. Review the preview and publish with 1 click.',
                  tag: 'Auto-Format',
                },
                {
                  num: '03',
                  icon: <Zap size={22} color="var(--sb-primary, #6F8F69)" />,
                  title: 'Nearby Buyer Discovery',
                  desc: 'Your lot is broadcast to verified retailers and Kiranas within your 10km radius seeking wholesale discounts.',
                  tag: '10km Network',
                },
                {
                  num: '04',
                  icon: <CheckCircle2 size={22} color="var(--sb-primary, #6F8F69)" />,
                  title: 'Accept & Collect Cash',
                  desc: 'Review buyer reservations, chat to finalize pickup schedule, hand over surplus, and free up tied-up working capital.',
                  tag: 'Liquidity',
                },
              ]
          ).map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              style={{
                background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)',
                borderRadius: 8, padding: 24, position: 'relative',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{
                  fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 13,
                  color: 'var(--sb-primary, #6F8F69)', background: 'var(--sb-primary-pale, #EAF1E7)',
                  border: '1px solid var(--sb-primary-soft, #DCE8D8)', borderRadius: 4,
                  padding: '2px 8px',
                }}>
                  {step.num}
                </span>
                <span style={{
                  fontFamily: 'Work Sans, sans-serif', fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--sb-text-muted, #7A847A)',
                }}>
                  {step.tag}
                </span>
              </div>

              <div style={{
                width: 44, height: 44, borderRadius: 6,
                background: 'var(--sb-surface-soft, #F2F6EF)', border: '1px solid var(--sb-border, #D8E0D5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                {step.icon}
              </div>

              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 17, color: 'var(--sb-text-primary, #182018)', margin: '0 0 8px' }}>
                {step.title}
              </h3>

              <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-muted, #7A847A)', lineHeight: 1.55, margin: 0, flex: 1 }}>
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 3. INTERACTIVE SURPLUS SAVINGS & LIQUIDATION CALCULATOR ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px', borderBottom: '1px solid var(--sb-border, #D8E0D5)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(184,138,69,0.08)', border: '1px solid rgba(184,138,69,0.25)',
            borderRadius: 4, padding: '4px 10px', marginBottom: 12,
          }}>
            <Calculator size={13} color="var(--sb-warning, #B88A45)" />
            <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 600, color: 'var(--sb-warning, #B88A45)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Interactive Economics
            </span>
          </div>

          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 28, color: 'var(--sb-text-primary, #182018)', margin: '0 0 8px' }}>
            Surplus Liquidation & Margin Calculator
          </h2>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: 'var(--sb-text-secondary, #4F5A51)', margin: 0 }}>
            Simulate how much cash flow a seller recovers and how much profit margin a buyer unlocks.
          </p>
        </div>

        <div style={{
          background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 8,
          padding: '32px', maxWidth: 960, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 36,
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}>
          
          {/* Sliders Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--sb-text-secondary, #4F5A51)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Lot Quantity
                </span>
                <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--sb-primary, #6F8F69)' }}>
                  {calcQuantity} units
                </span>
              </div>
              <input
                type="range" min="10" max="1000" step="10"
                value={calcQuantity} onChange={e => setCalcQuantity(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--sb-primary, #6F8F69)', cursor: 'pointer' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--sb-text-secondary, #4F5A51)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Standard Retail / MRP (₹)
                </span>
                <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--sb-text-primary, #182018)' }}>
                  ₹{calcRetailPrice} / unit
                </span>
              </div>
              <input
                type="range" min="10" max="2000" step="10"
                value={calcRetailPrice} onChange={e => setCalcRetailPrice(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--sb-primary, #6F8F69)', cursor: 'pointer' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--sb-text-secondary, #4F5A51)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Liquidation Discount
                </span>
                <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--sb-warning, #B88A45)' }}>
                  {calcDiscountPercent}% off MRP
                </span>
              </div>
              <input
                type="range" min="10" max="75" step="5"
                value={calcDiscountPercent} onChange={e => setCalcDiscountPercent(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--sb-warning, #B88A45)', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Outcome Breakdown Card */}
          <div style={{ background: 'var(--sb-surface-soft, #F2F6EF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 6, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Seller Liquidated Cash Recovered
              </span>
              <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 28, color: 'var(--sb-primary, #6F8F69)', margin: '4px 0 0' }}>
                ₹{totalSurplusVal.toLocaleString('en-IN')}
              </p>
              <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-muted, #7A847A)' }}>
                Immediate working capital unlocked instead of inventory write-off.
              </span>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--sb-border, #D8E0D5)', margin: '4px 0' }} />

            <div>
              <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Buyer Extra Profit Margin
              </span>
              <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 24, color: 'var(--sb-text-primary, #182018)', margin: '4px 0 0' }}>
                +₹{buyerSavings.toLocaleString('en-IN')}
              </p>
              <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-muted, #7A847A)' }}>
                Effective purchase rate: <strong>₹{unitDiscountPrice}/unit</strong> vs ₹{calcRetailPrice} MRP.
              </span>
            </div>

            <Link
              to="/marketplace"
              className="stitch-btn-primary"
              style={{
                textAlign: 'center', padding: '12px', textDecoration: 'none',
                borderRadius: 4, marginTop: 'auto', fontSize: 12, letterSpacing: '0.05em',
              }}
            >
              Browse Surplus Deals Near You
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. FOUR TRUST PILLARS ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px', borderBottom: '1px solid var(--sb-border, #D8E0D5)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 28, color: 'var(--sb-text-primary, #182018)', margin: '0 0 8px' }}>
            Built on Trust & Zero-Risk Architecture
          </h2>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: 'var(--sb-text-secondary, #4F5A51)', margin: 0 }}>
            Every interaction is designed to safeguard both buyer and seller.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {[
            {
              icon: <ShieldCheck size={20} color="var(--sb-primary, #6F8F69)" />,
              title: 'Merchant Verification',
              desc: 'Every trader has a registered business identity and mapped store location to ensure authenticity.',
            },
            {
              icon: <Lock size={20} color="var(--sb-primary, #6F8F69)" />,
              title: 'Zero Advance Payment',
              desc: 'Never pay upfront online. Reserve the lot, inspect goods in person, and transact directly.',
            },
            {
              icon: <FileImage size={20} color="var(--sb-primary, #6F8F69)" />,
              title: 'Proof-Verified Handover',
              desc: 'Attach physical invoice, delivery challan, or lot photos when marking handover complete.',
            },
            {
              icon: <Star size={20} color="var(--sb-primary, #6F8F69)" />,
              title: 'Public Trust Rating',
              desc: 'Merchants earn transparent 1–5 star trust scores and reviews on completed orders.',
            },
          ].map((pillar, i) => (
            <div key={i} style={{ background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 6,
                background: 'var(--sb-primary-pale, #EAF1E7)', border: '1px solid var(--sb-primary-soft, #DCE8D8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                {pillar.icon}
              </div>
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--sb-text-primary, #182018)', margin: '0 0 8px' }}>
                {pillar.title}
              </h3>
              <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-muted, #7A847A)', lineHeight: 1.5, margin: 0 }}>
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. FREQUENTLY ASKED QUESTIONS ── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '64px 24px', borderBottom: '1px solid var(--sb-border, #D8E0D5)' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 28, color: 'var(--sb-text-primary, #182018)', margin: '0 0 8px' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: 'var(--sb-text-secondary, #4F5A51)', margin: 0 }}>
            Everything you need to know about trading surplus inventory on StockBridge.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {faqs.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div
                key={idx}
                style={{
                  background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)',
                  borderRadius: 6, overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                  style={{
                    width: '100%', padding: '16px 20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'transparent', border: 'none',
                    textAlign: 'left', cursor: 'pointer',
                  }}
                >
                  <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--sb-text-primary, #182018)' }}>
                    {faq.q}
                  </span>
                  {isExpanded ? <ChevronUp size={16} color="var(--sb-primary, #6F8F69)" /> : <ChevronDown size={16} color="var(--sb-text-muted, #7A847A)" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        padding: '0 20px 16px',
                        fontFamily: 'Work Sans, sans-serif', fontSize: 13,
                        color: 'var(--sb-text-secondary, #4F5A51)', lineHeight: 1.6, borderTop: '1px solid var(--sb-surface-soft, #F2F6EF)',
                        paddingTop: 12,
                      }}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 6. FINAL CTA ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '72px 24px 96px', textAlign: 'center' }}>
        <div style={{
          background: 'var(--sb-surface, #FFFFFF)',
          border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 8,
          padding: '48px 24px', maxWidth: 760, margin: '0 auto',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
        }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 32, color: 'var(--sb-text-primary, #182018)', margin: '0 0 12px' }}>
            Ready to experience StockBridge?
          </h2>
          <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 15, color: 'var(--sb-text-secondary, #4F5A51)', maxWidth: 440, margin: '0 auto 28px' }}>
            Connect with verified local businesses, liquidate stock, and protect your margins.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/marketplace" className="stitch-btn-primary" style={{ padding: '12px 28px', fontSize: 13, textDecoration: 'none', borderRadius: 4 }}>
              Browse Marketplace
            </Link>
            <Link to="/create-listing" className="stitch-btn-ghost" style={{ padding: '12px 28px', fontSize: 13, textDecoration: 'none', borderRadius: 4 }}>
              List Your Stock
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
