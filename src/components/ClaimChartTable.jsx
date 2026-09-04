import React, { useState } from 'react';
import { 
  FileText, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  MessageSquare, 
  Search, 
  Sparkles,
  History,
  Scale
} from 'lucide-react';

export default function ClaimChartTable({
  claimChart,
  recentlyUpdatedId,
  onUndoLastChange,
  canUndo,
  onSelectElementForPrompt,
  activeCase,
  onApproveAndFinalize
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Status statistics
  const confirmedCount = claimChart.filter(el => el.status === 'confirmed').length;
  const weakCount = claimChart.filter(el => el.status === 'weak').length;
  const unsupportedCount = claimChart.filter(el => el.status === 'unsupported').length;

  const filteredChart = claimChart.filter(el => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      el.claimElement.toLowerCase().includes(term) ||
      el.accusedFeature.toLowerCase().includes(term) ||
      el.aiReasoning.toLowerCase().includes(term) ||
      (el.label && el.label.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-3.5 sm:p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-semibold text-white">Patent Claim Chart</h2>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                {activeCase?.patentNumber || "US 10,489,122 B2"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Accused: <strong className="text-slate-300">{activeCase?.accusedProduct || "Accused Product"}</strong> • 3-Column Legal Layout
            </p>
          </div>
        </div>

        {/* Status Pills & Undo Button */}
        <div className="flex items-center gap-2">
          {/* Status summary badges */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium mr-1">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" /> {confirmedCount} Confirmed
            </span>
            {weakCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-3 h-3" /> {weakCount} Weak
              </span>
            )}
            {unsupportedCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <XCircle className="w-3 h-3" /> {unsupportedCount} Unsupported
              </span>
            )}
          </div>

          {/* Undo Button (Edge Case 2) */}
          <button
            onClick={onUndoLastChange}
            disabled={!canUndo}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              canUndo
                ? 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-indigo-500/30 hover:border-indigo-500/60 shadow-sm cursor-pointer'
                : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
            }`}
            title={canUndo ? "Undo last accepted refinement" : "No previous versions to restore"}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${canUndo ? 'text-indigo-400' : 'text-slate-600'}`} />
            <span>Undo Last Change</span>
          </button>

          {/* Flowchart Step 4 Direct Approval: Looks Good / No Refinement Needed */}
          <button
            onClick={onApproveAndFinalize}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm border border-emerald-500/30 transition cursor-pointer"
            title="Flowchart Step 4: Looks Good / No Refinement Needed -> Export Final Legal Chart to PDF"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Looks Good / Export PDF</span>
            <span className="md:hidden">Export PDF</span>
          </button>
        </div>
      </div>

      {/* Filter / Search bar */}
      <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-xs">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter claim limitations or evidence..."
            className="w-full pl-8 pr-3 py-1 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <span className="text-[11px] text-slate-500">
          Showing {filteredChart.length} of {claimChart.length} elements
        </span>
      </div>

      {/* 3-Column Table Scroll Container */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-950 text-slate-300 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 w-[28%] border-r border-slate-800/80">
                1. Patent Claim Element
              </th>
              <th className="py-3 px-4 w-[36%] border-r border-slate-800/80">
                2. Accused Product Feature (Evidence)
              </th>
              <th className="py-3 px-4 w-[36%]">
                3. AI Legal Reasoning & Mapping
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-xs sm:text-sm">
            {filteredChart.map((el) => {
              const isHighlighted = recentlyUpdatedId === el.id;
              const hasHistory = el.history && el.history.length > 0;

              return (
                <tr
                  key={el.id}
                  className={`transition-colors duration-500 group ${
                    isHighlighted 
                      ? 'row-highlight-flash bg-indigo-950/30' 
                      : 'hover:bg-slate-800/40 bg-slate-900/20'
                  }`}
                >
                  {/* Column 1: Claim Element */}
                  <td className="py-4 px-4 align-top border-r border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-mono text-xs font-semibold text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40">
                        {el.label || `Element ${el.elementNumber}`}
                      </span>

                      {/* Status Badge */}
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                        el.status === 'confirmed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : el.status === 'weak'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {el.status === 'confirmed' && <CheckCircle2 className="w-2.5 h-2.5" />}
                        {el.status === 'weak' && <AlertTriangle className="w-2.5 h-2.5" />}
                        {el.status === 'unsupported' && <XCircle className="w-2.5 h-2.5" />}
                        {el.status}
                      </span>
                    </div>

                    <p className="text-slate-200 text-xs sm:text-[13px] leading-relaxed font-serif pt-1">
                      {el.claimElement}
                    </p>

                    {/* Quick refinement link & History chip */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px]">
                      <button
                        onClick={() => onSelectElementForPrompt(el)}
                        className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 opacity-80 group-hover:opacity-100 transition"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Refine in Chat</span>
                      </button>

                      {hasHistory && (
                        <span className="flex items-center gap-1 text-[10px] text-sky-400 bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-800/40" title="Previous version available for single-step undo">
                          <History className="w-2.5 h-2.5" />
                          <span>v{el.history.length + 1} (Refined)</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Column 2: Accused Product Feature (Evidence) */}
                  <td className="py-4 px-4 align-top border-r border-slate-800/80">
                    <div className="space-y-2">
                      <div className="text-xs sm:text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap font-sans bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                        {el.accusedFeature}
                      </div>
                    </div>
                  </td>

                  {/* Column 3: AI Legal Reasoning & Mapping */}
                  <td className="py-4 px-4 align-top">
                    <div className="space-y-2">
                      <div className="text-xs sm:text-[13px] text-slate-300 leading-relaxed whitespace-pre-wrap font-sans bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                        {el.aiReasoning}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredChart.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-slate-500 text-xs">
                  No claim elements match your filter term "{searchTerm}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
