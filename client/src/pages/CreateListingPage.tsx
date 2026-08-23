import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Package,
  Calendar,
  AlertCircle,
  Sparkles,
  Info,
  DollarSign,
  ArrowRight,
  Mic,
  Pencil,
} from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { VoiceListingPanel } from '../components/VoiceListingPanel';
import type { ExtractedFields } from '../components/VoiceListingPanel';

const CATEGORIES = [
  'Groceries',
  'Stationery',
  'Electronics',
  'Packaging',
  'Textiles',
  'Hardware',
  'Dairy & Beverages',
  'Prepared Food & Bakery',
];

const UNITS = ['kg', 'pieces', 'packets', 'bags', 'cans', 'litres', 'boxes', 'reams', 'cartons'];

type ListingMode = 'manual' | 'voice';

export const CreateListingPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [mode, setMode] = useState<ListingMode>('manual');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [quantity, setQuantity] = useState<number>(0);
  const [unit, setUnit] = useState('packets');
  const [pricePerUnit, setPricePerUnit] = useState<number>(0);
  const [expiryDate, setExpiryDate] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('low');

  // Expiry date boundaries
  const minExpiryDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const maxHighUrgencyDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const handleUrgencyChange = (newUrgency: 'low' | 'medium' | 'high') => {
    setUrgency(newUrgency);
    if (newUrgency === 'high' && expiryDate) {
      const exp = new Date(expiryDate);
      const minDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const maxDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
      minDate.setHours(0, 0, 0, 0);
      maxDate.setHours(23, 59, 59, 999);
      if (exp.getTime() < minDate.getTime() || exp.getTime() > maxDate.getTime()) {
        setExpiryDate(new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      }
    }
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [voiceAutoFilled, setVoiceAutoFilled] = useState(false);

  // Handle voice extraction → auto-fill form fields → switch to manual mode for review
  const handleVoiceFieldsExtracted = (fields: ExtractedFields) => {
    setTitle(fields.title || '');
    if (CATEGORIES.includes(fields.category)) {
      setCategory(fields.category);
    }
    setQuantity(fields.quantity || 0);
    if (UNITS.includes(fields.unit)) {
      setUnit(fields.unit);
    }
    setPricePerUnit(fields.pricePerUnit || 0);
    if (fields.urgency === 'high') {
      if (fields.expiryDate) {
        const exp = new Date(fields.expiryDate);
        const minD = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
        const maxD = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
        minD.setHours(0, 0, 0, 0);
        maxD.setHours(23, 59, 59, 999);
        if (exp.getTime() < minD.getTime() || exp.getTime() > maxD.getTime()) {
          setExpiryDate(new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        } else {
          setExpiryDate(fields.expiryDate);
        }
      } else {
        setExpiryDate(new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      }
    } else if (fields.expiryDate) {
      setExpiryDate(fields.expiryDate);
    }
    setUrgency(fields.urgency || 'low');
    setVoiceAutoFilled(true);
    setMode('manual'); // Switch to manual for review & edit
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!title.trim() || quantity <= 0 || pricePerUnit <= 0 || !expiryDate) {
      setError('Please fill in all required fields including a valid expiry date, quantity, and price.');
      return;
    }

    const selectedExpiry = new Date(expiryDate);
    const minRequiredTime = new Date();
    minRequiredTime.setDate(minRequiredTime.getDate() + 10);
    minRequiredTime.setHours(0, 0, 0, 0);

    if (urgency === 'high') {
      const maxRequiredTime = new Date();
      maxRequiredTime.setDate(maxRequiredTime.getDate() + 15);
      maxRequiredTime.setHours(23, 59, 59, 999);

      if (selectedExpiry.getTime() < minRequiredTime.getTime() || selectedExpiry.getTime() > maxRequiredTime.getTime()) {
        setError('High urgency listings must have an expiry date between 10 to 15 days from today.');
        return;
      }
    } else {
      if (selectedExpiry.getTime() < minRequiredTime.getTime()) {
        setError('Expiry date must be at least 10 days from today to ensure an adequate liquidation window.');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/listings', {
        title: title.trim(),
        category,
        quantity: Number(quantity),
        unit,
        pricePerUnit: Number(pricePerUnit),
        expiryDate: new Date(expiryDate).toISOString(),
        urgency,
      });

      navigate(`/listings/${res.data.id}`);
    } catch (err: any) {
      console.error('Create listing error', err);
      setError(err.response?.data?.error || 'Failed to publish listing.');
      setLoading(false);
    }
  };

  const totalLotValue = (quantity || 0) * (pricePerUnit || 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-2">
          <Sparkles size={14} className="text-purple-400" />
          B2B Dead Stock & Surplus Liquidation
        </div>
        <h1 className="text-3xl font-extrabold text-white">List Surplus Inventory Batch</h1>
        <p className="text-sm text-slate-400 mt-1">
          List your excess inventory and find verified buyers ready to purchase.
        </p>
      </div>

      {/* ─── Mode Toggle Tabs ─────────────────────────────────────────────── */}
      <div className="flex bg-[#1A1330] rounded-2xl p-1 border border-[#2B1F4D]/60">
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            mode === 'manual'
              ? 'bg-purple-500/25 text-purple-300 border border-purple-500/50 shadow-lg shadow-purple-500/10'
              : 'text-slate-400 hover:text-white hover:bg-[#2B1F4D]'
          }`}
        >
          <Pencil size={16} />
          Manual Entry
        </button>
        <button
          type="button"
          onClick={() => setMode('voice')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            mode === 'voice'
              ? 'bg-violet-500/25 text-violet-300 border border-violet-500/50 shadow-lg shadow-violet-500/10'
              : 'text-slate-400 hover:text-white hover:bg-[#2B1F4D]'
          }`}
        >
          <Mic size={16} />
          Voice Listing
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/30 text-violet-300 border border-violet-500/40 font-bold">
            AI
          </span>
        </button>
      </div>

      {/* Voice auto-filled notification */}
      {voiceAutoFilled && mode === 'manual' && (
        <div className="text-xs text-emerald-400 bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/60 flex items-center gap-2 animate-fade-in">
          <Sparkles size={14} className="text-emerald-400 flex-shrink-0" />
          <span>
            <strong>AI auto-filled your listing!</strong> Review and edit the fields below, then publish when ready.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form / Voice Column */}
        <div className="lg:col-span-2">
          {mode === 'voice' ? (
            /* ─── Voice Listing Panel ──────────────────────────────────── */
            <div className="bg-[#1A1330] border border-[#2B1F4D] rounded-3xl p-6 sm:p-8 shadow-2xl">
              <VoiceListingPanel onFieldsExtracted={handleVoiceFieldsExtracted} />
            </div>
          ) : (
            /* ─── Manual Form ──────────────────────────────────────────── */
            <form
              onSubmit={handleSubmit}
              className="bg-[#1A1330] border border-[#2B1F4D] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
            >
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Surplus Batch Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Basmati Rice Premium 25kg bags, USB-C Cables 1m lot..."
                  required
                  className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#1A1330]">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Available Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    required
                    className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Unit of Measure *
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u} className="bg-[#1A1330]">
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price per Unit */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Liquidation Price Per Unit (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={pricePerUnit}
                    onChange={(e) => setPricePerUnit(Number(e.target.value))}
                    required
                    className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl pl-8 pr-4 py-2.5 text-sm text-emerald-400 font-extrabold focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Discounted price to attract fast liquidations.
                </span>
              </div>

              {/* Expiry Date & Urgency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                    <span>Expiry Date *</span>
                    <span className="text-[10px] text-purple-400 font-normal">
                      {urgency === 'high' ? '10 to 15 days (High Urgency)' : 'At least 10 days'}
                    </span>
                  </label>
                  <input
                    type="date"
                    min={minExpiryDate}
                    max={urgency === 'high' ? maxHighUrgencyDate : undefined}
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                    className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {urgency === 'high'
                      ? 'High urgency listings must have an expiry date between 10 to 15 days from today.'
                      : 'Must be at least 10 days from today to ensure an adequate liquidation window.'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Urgency Level *
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => handleUrgencyChange(e.target.value as any)}
                    className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors"
                  >
                    <option value="low" className="bg-[#1A1330]">Low — Standard Pace</option>
                    <option value="medium" className="bg-[#1A1330]">Medium — Within 1-2 Weeks</option>
                    <option value="high" className="bg-[#1A1330]">High 🔥 — Immediate Clearance (10–15 Days Expiry)</option>
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-xs text-rose-400 bg-rose-950/40 p-3 rounded-xl border border-rose-800/60 flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 disabled:opacity-50 text-navy-950 font-bold text-sm rounded-xl shadow-lg shadow-purple-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
              >
                <PlusCircle size={18} />
                {loading ? 'Publishing Lot...' : 'Publish Surplus Lot'}
              </button>
            </form>
          )}
        </div>

        {/* Live Preview Card */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Info size={14} className="text-purple-400" />
            Live Preview Card
          </h3>

          <div className="bg-[#1A1330] border border-[#2B1F4D] rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                {category}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  urgency === 'high'
                    ? 'bg-rose-500/20 text-rose-300'
                    : urgency === 'medium'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-purple-500/20 text-purple-300'
                }`}
              >
                {urgency.toUpperCase()} Urgency
              </span>
            </div>

            <h4 className="font-bold text-white text-base line-clamp-2">
              {title || 'Your Surplus Batch Title Here'}
            </h4>

            <div className="grid grid-cols-2 gap-2 bg-[#0F0B1A]/60 p-3 rounded-xl border border-[#2B1F4D]/40 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Quantity</span>
                <span className="font-bold text-white">{quantity} {unit}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Unit Price</span>
                <span className="font-bold text-emerald-400">₹{pricePerUnit}/{unit}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#2B1F4D]/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">Total Lot Valuation:</span>
              <span className="text-sm font-extrabold text-pink-300">
                ₹{totalLotValue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
