import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Search,
  MapPin,
  DollarSign,
  Layers,
  ArrowRight,
  TrendingDown,
  Percent,
} from 'lucide-react';
import api from '../lib/api';
import type { Listing } from '../types';
import { ListingCard } from '../components/ListingCard';

const CATEGORIES = [
  'All Categories',
  'Groceries',
  'Stationery',
  'Electronics',
  'Packaging',
  'Cleaning',
  'Textiles',
  'Food & Beverages',
  'Dairy & Beverages',
  'Prepared Food & Bakery',
  'Hardware',
];

const CITIES = [
  { name: 'Custom / GPS', lat: 19.076, lng: 72.877 },
  { name: 'Mumbai (MH)', lat: 19.076, lng: 72.877 },
  { name: 'Delhi NCR', lat: 28.613, lng: 77.209 },
  { name: 'Bangalore (KA)', lat: 12.971, lng: 77.594 },
  { name: 'Hyderabad (TG)', lat: 17.385, lng: 78.486 },
];

const EXAMPLE_PRESETS = [
  {
    label: '🌾 Basmati Rice (Mumbai)',
    search: 'Basmati Rice',
    category: 'Groceries',
    cityName: 'Mumbai (MH)',
    maxPrice: 1500,
    minQuantity: 20,
    distanceKm: 30,
  },
  {
    label: '🛢️ Cooking Oil (Mumbai)',
    search: 'Sunflower Oil',
    category: 'Groceries',
    cityName: 'Mumbai (MH)',
    maxPrice: 750,
    minQuantity: 25,
    distanceKm: 25,
  },
  {
    label: '🔌 USB Cables (Mumbai)',
    search: 'USB-C Cables',
    category: 'Electronics',
    cityName: 'Mumbai (MH)',
    maxPrice: 200,
    minQuantity: 50,
    distanceKm: 25,
  },
  {
    label: '📄 A4 Paper (Delhi)',
    search: 'A4 Copy Paper',
    category: 'Stationery',
    cityName: 'Delhi NCR',
    maxPrice: 250,
    minQuantity: 100,
    distanceKm: 20,
  },
  {
    label: '🥣 Toor Dal (Delhi)',
    search: 'Toor Dal',
    category: 'Groceries',
    cityName: 'Delhi NCR',
    maxPrice: 200,
    minQuantity: 50,
    distanceKm: 20,
  },
  {
    label: '🥥 Coconut Oil (Bangalore)',
    search: 'Coconut Oil',
    category: 'Groceries',
    cityName: 'Bangalore (KA)',
    maxPrice: 300,
    minQuantity: 25,
    distanceKm: 20,
  },
];

export const SmartMatchPage: React.FC = () => {
  const [category, setCategory] = useState('All Categories');
  const [search, setSearch] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>(3000);
  const [minQuantity, setMinQuantity] = useState<number>(1);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(30);
  const [selectedCity, setSelectedCity] = useState(CITIES[1]);

  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const executeMatch = async (params: {
    city: typeof CITIES[0];
    cat: string;
    term: string;
    dist: number;
    qty: number;
    price: number;
  }) => {
    setLoading(true);
    setHasSearched(true);

    try {
      const payload: any = {
        lat: params.city.lat,
        lng: params.city.lng,
        maxDistanceKm: Math.min(50, Math.max(1, Number(params.dist) || 30)),
        minQuantity: Number(params.qty) || 1,
        maxPricePerUnit: Number(params.price) || 3000,
      };
      if (params.cat !== 'All Categories') payload.category = params.cat;
      if (params.term.trim()) payload.search = params.term.trim();

      const res = await api.post('/listings/match', payload);
      setMatches(res.data);
    } catch (err) {
      console.error('Match failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    await executeMatch({
      city: selectedCity,
      cat: category,
      term: search,
      dist: maxDistanceKm,
      qty: minQuantity,
      price: maxPrice,
    });
  };

  const applyPreset = (preset: typeof EXAMPLE_PRESETS[0]) => {
    const city = CITIES.find((c) => c.name === preset.cityName) || CITIES[1];
    setSelectedCity(city);
    setSearch(preset.search);
    setCategory(preset.category);
    setMaxPrice(preset.maxPrice);
    setMinQuantity(preset.minQuantity);
    setMaxDistanceKm(preset.distanceKm);

    executeMatch({
      city,
      cat: preset.category,
      term: preset.search,
      dist: preset.distanceKm,
      qty: preset.minQuantity,
      price: preset.maxPrice,
    });
  };

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1A1330] via-[#1A1330] to-[#0F0B1A] p-8 rounded-3xl border border-[#2B1F4D] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
            <Sparkles size={14} className="text-purple-400" />
            AI & Proximity Matching Engine
          </div>
          <h1 className="text-3xl font-extrabold text-white">Smart Inventory Match Finder</h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Enter your sourcing criteria. Our multi-token algorithm evaluates keywords, synonyms, geographic distance, budget targets, urgency, and merchant reliability to find the best surplus liquidation lots.
          </p>
        </div>
      </div>

      {/* Quick Example Presets */}
      <div className="bg-[#1A1330]/80 border border-[#2B1F4D] rounded-2xl p-4 sm:p-5 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-purple-400" />
            Quick Try Proximity Examples (Within 50 km)
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Click any preset to test AI & Proximity Matching
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(preset)}
              className="text-xs px-3.5 py-1.5 rounded-xl bg-[#0F0B1A] hover:bg-purple-500/20 text-slate-200 hover:text-white border border-[#2B1F4D] hover:border-purple-500/50 font-medium transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-sm"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Query Form Card */}
      <form
        onSubmit={handleRunMatch}
        className="bg-[#1A1330] border border-[#2B1F4D] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Keyword Query */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Product Search Keyword
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. Basmati Rice, USB Cables, Oil 5L, Paper..."
                className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-[#1A1330]">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Your City / Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Your Location Base
            </label>
            <select
              value={selectedCity.name}
              onChange={(e) => {
                const found = CITIES.find((c) => c.name === e.target.value);
                if (found) setSelectedCity(found);
              }}
              className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors"
            >
              {CITIES.map((c) => (
                <option key={c.name} value={c.name} className="bg-[#1A1330]">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Numeric Inputs for Price & Quantity + Slider for Distance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 border-t border-[#2B1F4D]/50">
          {/* Max Price Per Unit Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Max Price Per Unit (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                placeholder="e.g. 3000"
                className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl pl-8 pr-4 py-2.5 text-sm text-emerald-400 font-bold focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Budget ceiling per unit
            </span>
          </div>

          {/* Min Batch Lot Quantity Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Min Batch Lot Quantity (Units)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={minQuantity}
              onChange={(e) => setMinQuantity(Number(e.target.value))}
              placeholder="e.g. 50"
              className="w-full bg-[#0F0B1A] border border-[#2B1F4D] rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-purple-400 transition-colors"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Minimum inventory required
            </span>
          </div>

          {/* Max Proximity Distance Slider (Up to 50 km) */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
              <span>Max Proximity Radius</span>
              <span className="text-pink-400 font-bold">{maxDistanceKm} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={maxDistanceKm}
              onChange={(e) => setMaxDistanceKm(Math.min(50, Math.max(1, Number(e.target.value))))}
              className="w-full accent-purple-400 cursor-pointer"
            />
            <span className="text-[11px] text-slate-400 mt-1 flex justify-between">
              <span>1 km</span>
              <span>Radius limit (max 50 km)</span>
              <span>50 km</span>
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !search.trim()}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 disabled:opacity-50 text-navy-950 font-bold text-sm rounded-xl shadow-lg shadow-purple-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles size={18} />
          {loading ? 'Running Matching Algorithm...' : 'Calculate Optimal Liquidation Matches'}
        </button>
      </form>

      {/* Results Section */}
      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Percent className="text-purple-400" size={20} />
              Algorithm Match Results
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#2B1F4D] text-purple-300 border border-[#2B1F4D]">
                {matches.length} matching lots
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-400"></div>
            </div>
          ) : matches.length === 0 ? (
            <div className="bg-[#1A1330] border border-[#2B1F4D] rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
              <Search size={36} className="text-slate-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">No relevant matches found</h3>
              <p className="text-xs text-slate-400">
                Try searching with broader keywords, changing the category, or expanding your radius.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((item) => (
                <div key={item.id} className="relative group space-y-2">
                  {/* Match Score Badge */}
                  <div className="absolute -top-3 right-4 z-20 bg-gradient-to-r from-purple-500 to-emerald-400 text-navy-950 text-[11px] font-extrabold px-3 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                    <Sparkles size={12} />
                    {item.matchScore ? `${Math.round(item.matchScore)}% Match` : 'Top Match'}
                  </div>
                  <ListingCard listing={item} distanceKm={item.distanceKm} />

                  {/* Match Reason Badges */}
                  {item.reasons && item.reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1 px-1">
                      {item.reasons.slice(0, 3).map((r: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-[#1A1330] text-purple-300 border border-[#2B1F4D]/60 px-2 py-0.5 rounded-md font-medium"
                        >
                          ✓ {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
