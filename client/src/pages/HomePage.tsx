import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Layers,
  Sparkles,
  MapPin,
  TrendingDown,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import api from '../lib/api';
import type { Listing } from '../types';
import { ListingCard } from '../components/ListingCard';

const CITIES = [
  { name: 'All Locations', lat: null, lng: null },
  { name: 'Mumbai (MH)', lat: 19.076, lng: 72.877 },
  { name: 'Delhi NCR', lat: 28.613, lng: 77.209 },
  { name: 'Bangalore (KA)', lat: 12.971, lng: 77.594 },
  { name: 'Hyderabad (TG)', lat: 17.385, lng: 78.486 },
];

export const HomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const selectedCategory = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('q') || '';
  const selectedUrgency = searchParams.get('urgency') || 'all';
  const selectedCityName = searchParams.get('city') || 'All Locations';

  useEffect(() => {
    // Fetch distinct categories
    api
      .get('/listings/meta/categories')
      .then((res) => setCategories(res.data))
      .catch((err) => console.error('Failed to load categories', err));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: any = { limit: 50 };
    if (selectedCategory !== 'all') params.category = selectedCategory;
    if (searchQuery) params.search = searchQuery;

    api
      .get('/listings', { params })
      .then((res) => {
        let results: Listing[] = res.data.listings || [];

        // Apply urgency filter locally if specified
        if (selectedUrgency !== 'all') {
          results = results.filter((l) => l.urgency === selectedUrgency);
        }

        // Apply city proximity distance calculation if a city is chosen
        const activeCity = CITIES.find((c) => c.name === selectedCityName);
        if (activeCity && activeCity.lat && activeCity.lng) {
          results = results.map((l) => {
            if (l.seller && l.seller.lat && l.seller.lng) {
              const d = getDistanceFromLatLonInKm(
                activeCity.lat!,
                activeCity.lng!,
                l.seller.lat,
                l.seller.lng
              );
              return { ...l, distanceKm: d };
            }
            return l;
          });
          // Sort closest first
          results.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
        }

        setListings(results);
        setTotalCount(results.length);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch listings', err);
        setLoading(false);
      });
  }, [selectedCategory, searchQuery, selectedUrgency, selectedCityName]);

  const updateParam = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value && value !== 'all' && value !== 'All Locations') {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    setSearchParams(nextParams);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1b2151] via-[#151a41] to-[#0f1329] border border-[#3f4b81] p-8 md:p-12 shadow-2xl">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
            <Sparkles size={14} className="text-teal-400" />
            Empowering Zero Waste & High Velocity B2B Commerce
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Turn Excess Inventory Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-amber-300">Revenue Before It Becomes Dead Stock</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            StockBridge connects businesses with excess inventory to nearby businesses facing stockouts—enabling fast, trusted B2B inventory exchange at competitive prices.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/create-listing"
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-navy-950 font-bold rounded-xl shadow-lg shadow-teal-500/25 transition-all transform hover:-translate-y-0.5"
            >
              Post Surplus Inventory
            </Link>
            <Link
              to="/match"
              className="px-6 py-3 bg-[#293264]/80 hover:bg-[#313b6e] text-white border border-[#3f4b81] font-semibold rounded-xl transition-all flex items-center gap-2"
            >
              <Sparkles size={16} className="text-teal-400" />
              Smart Match Finder
            </Link>
          </div>
        </div>

        {/* Quick Platform Metrics Banner */}
        <div className="mt-8 pt-6 border-t border-[#3f4b81]/50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-[#0f1329]/40 rounded-xl border border-[#3f4b81]/30">
            <p className="text-xl md:text-2xl font-extrabold text-teal-400">20+ Lots</p>
            <span className="text-[11px] text-slate-400">Active Surplus Batches</span>
          </div>
          <div className="p-3 bg-[#0f1329]/40 rounded-xl border border-[#3f4b81]/30">
            <p className="text-xl md:text-2xl font-extrabold text-cyan-400">4 Cities</p>
            <span className="text-[11px] text-slate-400">Geographic Clusters</span>
          </div>
          <div className="p-3 bg-[#0f1329]/40 rounded-xl border border-[#3f4b81]/30">
            <p className="text-xl md:text-2xl font-extrabold text-amber-400">30-70%</p>
            <span className="text-[11px] text-slate-400">Average Markdown Savings</span>
          </div>
          <div className="p-3 bg-[#0f1329]/40 rounded-xl border border-[#3f4b81]/30">
            <p className="text-xl md:text-2xl font-extrabold text-emerald-400">100%</p>
            <span className="text-[11px] text-slate-400">Verified Trade Counterparties</span>
          </div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="bg-[#1b2151] border border-[#3f4b81] p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1 w-full">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              defaultValue={searchQuery}
              onChange={(e) => updateParam('q', e.target.value)}
              placeholder="Search surplus products, brands, materials, or units..."
              className="w-full bg-[#0f1329] border border-[#3f4b81] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
            />
          </div>

          {/* Location Cluster Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-52">
              <MapPin
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400"
              />
              <select
                value={selectedCityName}
                onChange={(e) => updateParam('city', e.target.value)}
                className="w-full bg-[#0f1329] border border-[#3f4b81] rounded-xl pl-9 pr-8 py-2.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-teal-400 appearance-none cursor-pointer"
              >
                {CITIES.map((c) => (
                  <option key={c.name} value={c.name} className="bg-[#1b2151]">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Urgency Filter */}
            <div className="relative flex-1 md:w-44">
              <Clock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400"
              />
              <select
                value={selectedUrgency}
                onChange={(e) => updateParam('urgency', e.target.value)}
                className="w-full bg-[#0f1329] border border-[#3f4b81] rounded-xl pl-9 pr-8 py-2.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-teal-400 appearance-none cursor-pointer"
              >
                <option value="all" className="bg-[#1b2151]">All Urgencies</option>
                <option value="high" className="bg-[#1b2151]">🔥 High Urgency</option>
                <option value="medium" className="bg-[#1b2151]">⚡ Medium Urgency</option>
                <option value="low" className="bg-[#1b2151]">Standard Lot</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => updateParam('category', 'all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-teal-500 text-navy-950 shadow-md shadow-teal-500/20'
                : 'bg-[#0f1329] text-slate-300 hover:text-white border border-[#3f4b81]'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => updateParam('category', cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-teal-500 text-navy-950 shadow-md shadow-teal-500/20'
                    : 'bg-[#0f1329] text-slate-300 hover:text-white border border-[#3f4b81]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* Listings Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="text-teal-400" size={20} />
            Available Surplus Inventory
            <span className="text-xs font-semibold px-2 py-0.5 bg-[#293264] text-teal-300 rounded-full border border-[#3f4b81]">
              {totalCount} lots
            </span>
          </h2>

          {selectedCityName !== 'All Locations' && (
            <span className="text-xs text-cyan-300 font-medium flex items-center gap-1">
              <MapPin size={12} /> Sorted by proximity to {selectedCityName}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#1b2151] border border-[#3f4b81] rounded-2xl p-6 h-64 animate-pulse"
              />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-[#1b2151] border border-[#3f4b81] rounded-2xl p-12 text-center max-w-lg mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Search size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">No listings match criteria</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Try adjusting your category, location cluster, or search keywords to find other surplus items.
            </p>
            <button
              onClick={() => setSearchParams({})}
              className="px-4 py-2 bg-teal-500 text-navy-950 font-semibold text-xs rounded-xl shadow-md cursor-pointer hover:bg-teal-400"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

// Haversine formula for distance in km
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}
