import React, { useState } from 'react';
import { 
  Scale, 
  X, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  ExternalLink, 
  Copy, 
  Trash2, 
  Plus,
  BookOpen,
  ArrowRight
} from 'lucide-react';

export default function PastChartsModal({
  isOpen,
  onClose,
  savedCases,
  currentCaseId,
  onSelectCase,
  onDuplicateCase,
  onDeleteCase,
  onOpenNewChartModal
}) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredCases = savedCases.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.title.toLowerCase().includes(term) ||
      c.patentNumber.toLowerCase().includes(term) ||
      c.accusedProduct.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full flex flex-col max-h-[85vh] shadow-2xl overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Past Patent Claim Charts
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {savedCases.length} Saved Cases
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Browse, reopen, or branch your patent infringement claim charts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenNewChartModal();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Chart</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-2 text-xs">
          <Search className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patent number (e.g. US 10,489,122), case title, or accused product..."
            className="w-full bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none text-xs"
            autoFocus
          />
        </div>

        {/* Case List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredCases.map((c) => {
            const isCurrent = c.id === currentCaseId;
            const confirmedCount = c.claimChart.filter(el => el.status === 'confirmed').length;
            const weakCount = c.claimChart.filter(el => el.status === 'weak').length;
            const unsupportedCount = c.claimChart.filter(el => el.status === 'unsupported').length;

            return (
              <div
                key={c.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-indigo-950/25 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
                    : 'bg-slate-950/60 hover:bg-slate-950/90 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Case Info */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800/50">
                        {c.patentNumber}
                      </span>
                      <h3 className="font-semibold text-slate-100 text-sm truncate">
                        {c.title}
                      </h3>
                      {isCurrent && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Active in Workspace
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <span>Accused:</span>
                      <strong className="text-slate-300 font-medium">{c.accusedProduct}</strong>
                      <span className="text-slate-600">•</span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="w-3 h-3" /> {c.lastModified || 'Recent'}
                      </span>
                    </p>

                    {/* Metrics / Status Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-medium">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        {c.claimChart.length} Elements
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-sky-400 border border-slate-800 flex items-center gap-1">
                        <BookOpen className="w-2.5 h-2.5" /> {(c.uploadedDocs || []).length} Sources
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> {confirmedCount} Confirmed
                      </span>
                      {weakCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> {weakCount} Weak
                        </span>
                      )}
                      {unsupportedCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                          <XCircle className="w-2.5 h-2.5" /> {unsupportedCount} Unsupported
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
                    <button
                      onClick={() => onDuplicateCase(c.id)}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 border border-slate-800 transition"
                      title="Clone / Duplicate this chart"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {savedCases.length > 1 && (
                      <button
                        onClick={() => onDeleteCase(c.id)}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition"
                        title="Delete chart"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => onSelectCase(c.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                        isCurrent
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-default'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                      }`}
                    >
                      <span>{isCurrent ? 'Current' : 'Open'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredCases.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <p>No past patent claim charts match "{searchTerm}".</p>
              <button
                onClick={() => setSearchTerm('')}
                className="text-indigo-400 hover:underline"
              >
                Clear search query
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>All charts are automatically saved in local storage.</span>
          <button
            onClick={onClose}
            className="text-xs text-slate-300 hover:text-white underline"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
