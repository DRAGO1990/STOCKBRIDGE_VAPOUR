import React from 'react';
import { AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';

export const UrgencyBadge: React.FC<{ urgency: 'low' | 'medium' | 'high' }> = ({ urgency }) => {
  if (urgency === 'high') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
        <AlertCircle size={12} className="text-rose-400" />
        High Urgency
      </span>
    );
  }
  if (urgency === 'medium') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40">
        <Clock size={12} className="text-amber-400" />
        Med Urgency
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-500/20 text-teal-300 border border-teal-500/40">
      Normal
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status.toLowerCase()) {
    case 'active':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          Active
        </span>
      );
    case 'reserved':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-500/20 text-sky-300 border border-sky-500/40">
          <Clock size={12} className="text-sky-400" />
          Reserved
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40">
          <Clock size={12} className="text-amber-400" />
          Pending Approval
        </span>
      );
    case 'confirmed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
          <CheckCircle size={12} className="text-indigo-400" />
          Confirmed
        </span>
      );
    case 'completed':
    case 'sold':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/40">
          <CheckCircle size={12} className="text-teal-400" />
          {status === 'sold' ? 'Sold' : 'Completed'}
        </span>
      );
    case 'cancelled':
    case 'expired':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-400 border border-slate-600">
          <XCircle size={12} />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">
          {status}
        </span>
      );
  }
};
