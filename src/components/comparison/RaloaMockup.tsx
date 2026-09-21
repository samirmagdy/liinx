import React from 'react';
import { Play, Folder, Calendar, ExternalLink } from 'lucide-react';

export const RaloaMockup: React.FC = () => (
  <div aria-hidden="true" className="rounded-2xl border border-neutral-800 bg-[#17181A] text-white p-5 space-y-3 mb-6 max-w-sm mx-auto shadow-inner">
    {/* Header */}
    <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-neutral-700 overflow-hidden ring-1 ring-indigo-400/40">
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" 
            alt="Elena"
            width={200}
            height={200}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <p className="text-xs font-bold leading-none">Elena Rostova</p>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">links.elena.design</p>
        </div>
      </div>
      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
        DNS Verified
      </span>
    </div>

    {/* Playable Audio Card */}
    <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate">Architecture & Space Vol. 2</p>
        <p className="text-xs text-neutral-400">Playable directly in page</p>
      </div>
    </div>

    {/* Accordion Folder */}
    <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Folder className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-xs font-bold">2025 Architectural Portfolio</span>
      </div>
      <span className="text-[11px] font-mono text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
        4 links
      </span>
    </div>

    {/* Booking Card */}
    <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Calendar className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-xs font-bold">Book Studio Consultation</span>
      </div>
      <ExternalLink className="w-3 h-3 text-neutral-400" />
    </div>
  </div>
);
