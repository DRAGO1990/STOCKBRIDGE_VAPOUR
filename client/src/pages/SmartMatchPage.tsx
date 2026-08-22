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

export const SmartMatchPage: React.FC = () => {
  const [category, setCategory] = useState('All Categories');
  const [search, setSearch] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>(3000);
  const [minQuantity, setMinQuantity] = useState<number>(1);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(100);
  const [selectedCity, setSelectedCity] = useState(CITIES[1]);

  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleRunMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setHasSearched(true);

    try {
      const payload: any = {
        lat: selectedCity.lat,
        lng: selectedCity.lng,
        maxDistanceKm: Number(maxDistanceKm),
        minQuantity: Number(minQuantity),
        maxPricePerUnit: Number(maxPrice),
      };
      if (category !== 'All Categories') payload.category = category;
      if (search.trim()) payload.search = search.trim();

      const res = await api.post('/listings/match', payload);
      setMatches(res.data);
    } catch (err) {
      console.error('Match failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1b2151] via-[#1a204d] to-[#0f1329] p-8 rounded-3xl border border-[#3f4b81] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
            <Sparkles size={14} className="text-teal-400" />
            AI & Proximity Matching Engine
          </div>
          <h1 className="text-3xl font-extrabold text-white">Smart Inventory Match Finder</h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Enter your sourcing criteria. Our multi-token algorithm evaluates keywords, synonyms, geographic distance, budget targets, urgency, and merchant reliability to find the best surplus liquidation lots.
          </p>
        </div>
      </div>

      {/* Query Form Card */}
      <form
        onSubmit={handleRunMatch}
        className="bg-[#1b2151] border border-[#3f4b81] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6"
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. Basmati Rice, USB Cables, Oil 5L, Paper..."
                className="w-full bg-[#0f1329] border border-[#3f4b81] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
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
              className="w-full bg-[#0f1329] border border-[#3f4b81] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400 transition-colors"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-[#1b2151]">
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
              className="w-full bg-[#0f1329] border border-[#3f4b81] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400 transition-colors"
            >
              {CITIES.map((c) => (
                <option key={c.name} value={c.name} className="bg-[#1b2151]">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sliders / Numeric Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 border-t border-[#3f4b81]/50">
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
              <span>Max Price Per Unit (₹)</span>
              <span className="text-emerald-400 font-bold">₹{maxPrice}</span>
            </div>
            <input
              type="range"
              min="50"
              max="5000"
              step="50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-teal-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
              <span>Min Batch Lot Quantity</span>
              <span className="text-teal-400 font-bold">{minQuantity} units</span>
            </div>
            <input
              type="range"
              min="1"
              max="500"
              step="1"
              value={minQuantity}
              onChange={(e) => setMinQuantity(Number(e.target.value))}
              className="w-full accent-teal-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
              <span>Max Proximity Radius</span>
              <span className="text-cyan-400 font-bold">{maxDistanceKm} km</span>
            </div>
            <input
              type="range"
              min="5"
              max="500"
              step="5"
              value={maxDistanceKm}
              onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-50 text-navy-950 font-bold text-sm rounded-xl shadow-lg shadow-teal-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
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
              <Percent className="text-teal-400" size={20} />
              Algorithm Match Results
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#293264] text-teal-300 border border-[#3f4b81]">
                {matches.length} matching lots
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-400"></div>
            </div>
          ) : matches.length === 0 ? (
            <div className="bg-[#1b2151] border border-[#3f4b81] rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
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
                  <div className="absolute -top-3 right-4 z-20 bg-gradient-to-r from-teal-500 to-emerald-400 text-navy-950 text-[11px] font-extrabold px-3 py-0.5 rounded-full shadow-lg flex items-center gap-1">
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
                          className="text-[10px] bg-[#161a3f] text-teal-300 border border-[#3f4b81]/60 px-2 py-0.5 rounded-md font-medium"
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
