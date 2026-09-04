import React, { useState } from 'react';
import { 
  FileText, 
  Globe, 
  UploadCloud, 
  Plus, 
  Trash2, 
  Sparkles, 
  ShieldAlert, 
  ArrowRight, 
  CheckCircle2, 
  BookOpen, 
  Scale, 
  Cpu,
  History,
  FolderOpen
} from 'lucide-react';
import { promptPresets } from '../data/initialData';

export default function ScreenSetup({
  claimChart,
  uploadedDocs,
  setUploadedDocs,
  systemPrompt,
  setSystemPrompt,
  onStartSession,
  activeCase,
  onOpenPastChartsModal,
  onOpenNewChartModal,
  savedCasesCount
}) {
  const [chartFileName, setChartFileName] = useState("US_10489122_Claim1_Thermostat.json");
  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState("pdf");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddDoc = (e) => {
    e.preventDefault();
    if (!newDocName.trim()) return;
    const isUrl = newDocName.startsWith("http://") || newDocName.startsWith("https://");
    const newDoc = {
      id: `doc-${Date.now()}`,
      name: newDocName.trim(),
      type: isUrl ? "url" : newDocType,
      size: isUrl ? "Web URL" : "1.8 MB",
      dateAdded: "Just now"
    };
    setUploadedDocs([...uploadedDocs, newDoc]);
    setNewDocName("");
    setShowAddForm(false);
  };

  const handleRemoveDoc = (id) => {
    setUploadedDocs(uploadedDocs.filter(d => d.id !== id));
  };

  const handleApplyPreset = (presetPrompt) => {
    setSystemPrompt(presetPrompt);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-5xl mx-auto w-full space-y-6 sm:space-y-8 my-auto">
        
        {/* Top Case Switcher Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Current Case:</span>
            <span className="font-mono font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800/50">
              {activeCase?.patentNumber || "US 10,489,122 B2"}
            </span>
            <span className="font-semibold text-white truncate max-w-xs sm:max-w-md">
              {activeCase?.title || "Smart Thermostat HVAC Control"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenPastChartsModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 hover:border-indigo-500/40 transition"
              title="View all past saved patent charts"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>Past Charts ({savedCasesCount})</span>
            </button>

            <button
              onClick={onOpenNewChartModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition"
              title="Create a new patent claim chart"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Patent Chart</span>
            </button>
          </div>
        </div>

        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-medium tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            iLumos Legal AI Platform • Prototype
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Claim Chart <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200">Refinement Copilot</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Interactive, document-grounded AI copilot for patent attorneys and analysts to refine claim-to-evidence mappings with strict human-in-the-loop validation.
          </p>
        </div>

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Claim Chart Ingestion */}
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm sm:text-base">1. Patent Claim Chart</h3>
                  <p className="text-xs text-slate-400">Patent elements currently loaded</p>
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Ready ({claimChart.length} Elements)
              </span>
            </div>

            {/* Active chart file card */}
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-200">{activeCase?.patentNumber || "US 10,489,122 B2"}</p>
                  <p className="text-xs text-slate-400">{activeCase?.title || "Smart Thermostat"}</p>
                </div>
              </div>
              <button 
                onClick={onOpenPastChartsModal}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 underline shrink-0"
              >
                Switch Case
              </button>
            </div>

            {/* Claim elements preview */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Initial Elements Loaded</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {claimChart.map((el) => (
                  <div key={el.id} className="text-xs p-2 rounded bg-slate-950/40 border border-slate-800/80 flex items-center justify-between">
                    <span className="font-mono text-indigo-300 mr-2">[{el.elementNumber}]</span>
                    <span className="text-slate-300 truncate flex-1">{el.claimElement}</span>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ml-2 shrink-0 ${
                      el.status === 'confirmed' ? 'bg-emerald-500/15 text-emerald-300' : el.status === 'weak' ? 'bg-amber-500/15 text-amber-300' : 'bg-rose-500/15 text-rose-300'
                    }`}>
                      {el.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Accused Product Docs & URLs */}
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm sm:text-base">2. Accused Product Evidence</h3>
                  <p className="text-xs text-slate-400">Technical specs, datasheets, and URLs</p>
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {uploadedDocs.length} Sources
              </span>
            </div>

            {/* List of docs */}
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {uploadedDocs.map((doc) => (
                <div key={doc.id} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {doc.type === 'url' ? (
                      <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    <span className="text-xs font-medium text-slate-200 truncate">{doc.name}</span>
                  </div>
                  <button 
                    onClick={() => handleRemoveDoc(doc.id)}
                    className="opacity-40 group-hover:opacity-100 hover:text-rose-400 text-slate-400 p-1 rounded transition"
                    title="Remove source"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add doc / URL input */}
            {showAddForm ? (
              <form onSubmit={handleAddDoc} className="space-y-2 pt-1 border-t border-slate-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    placeholder="e.g. Acme_Specs_Rev4.pdf or https://..."
                    className="flex-1 text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="text-xs px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-xs px-2 py-2 text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full py-2 border border-dashed border-slate-700 hover:border-slate-600 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Supplemental Doc or URL
              </button>
            )}

            <div className="flex items-start gap-2 p-2 rounded bg-indigo-950/30 border border-indigo-900/50 text-[11px] text-indigo-300">
              <ShieldAlert className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
              <span>
                <strong>Test Design Note:</strong> For the thermostat case, docs omit sensor array specs to demonstrate Edge Case 3 missing-evidence handling.
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: System Prompt / Case Strategy */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm sm:text-base">3. AI Analysis Instructions & Legal Strategy</h3>
                <p className="text-xs text-slate-400">Controls AI reasoning depth, conservatism, and citation style</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-slate-400 self-center mr-1">Presets:</span>
              {promptPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset.prompt)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition ${
                    systemPrompt === preset.prompt
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 font-medium'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                  title={preset.description}
                >
                  {preset.title}
                </button>
              ))}
            </div>

            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={3}
              className="w-full text-xs sm:text-sm bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
              placeholder="Enter custom legal reasoning instructions..."
            />
          </div>
        </div>

        {/* Action Button: Start Session */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Target: {activeCase?.accusedProduct || "Acme Smart Thermostat Pro"}</span>
          </div>

          <button
            onClick={onStartSession}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5"
          >
            <span>Start Refinement Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
