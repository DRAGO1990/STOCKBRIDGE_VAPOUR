import React from 'react';
import { Compass, ShieldCheck, Zap, RefreshCw, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0A0715] border-t border-[#2B1F4D]/50 mt-auto text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Compass size={18} />
              </div>
              <span className="font-bold text-white text-base">Stock<span className="text-purple-400">Bridge</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              B2B dead stock & near-expiry inventory liquidation platform connecting local retailers, wholesalers, and food businesses.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Key Solutions</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5"><RefreshCw size={12} className="text-purple-400" /> Surplus Batch Liquidation</li>
              <li className="flex items-center gap-1.5"><Zap size={12} className="text-amber-400" /> Real-time Proximity Matching</li>
              <li className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-emerald-400" /> Escrow & Handover Verification</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Featured Clusters</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>Mumbai Central & Suburbs</li>
              <li>Delhi NCR & Old City Markets</li>
              <li>Bengaluru Tech Corridor & Markets</li>
              <li>Hyderabad Wholesale Zones</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Platform Guarantee</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verified business profiles, transparent rating benchmarks, and real-time counterparty communication.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-purple-300 bg-purple-950/60 border border-purple-800/60 px-2.5 py-1 rounded-lg">
              <ShieldCheck size={14} className="text-purple-400" /> 100% Verified Merchant Safe
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#2B1F4D]/40 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} StockBridge Platform. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Built for sustainable supply chain efficiency</span>
            <Heart size={12} className="text-rose-400 fill-rose-400 inline" />
          </div>
        </div>
      </div>
    </footer>
  );
};
