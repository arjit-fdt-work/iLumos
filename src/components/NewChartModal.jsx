import React, { useState } from 'react';
import { 
  Plus, 
  X, 
  Scale, 
  BookOpen, 
  Sparkles, 
  FileText, 
  Check, 
  ArrowRight,
  Cpu,
  UploadCloud,
  FileCode,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { PRESET_CASES, defaultSystemPrompt } from '../data/initialData';
import { SAMPLE_CLAIM_DOCUMENTS, parseClaimDocumentFile } from '../utils/claimDocumentParser';

export default function NewChartModal({
  isOpen,
  onClose,
  onCreateCase
}) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'manual' | 'preset'

  // Upload Tab States
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [accusedProductName, setAccusedProductName] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStep, setParsingStep] = useState(0);
  const [parsedCasePreview, setParsedCasePreview] = useState(null);

  // Manual form state
  const [patentNumber, setPatentNumber] = useState('');
  const [caseTitle, setCaseTitle] = useState('');
  const [accusedProduct, setAccusedProduct] = useState('');
  const [rawClaimsText, setRawClaimsText] = useState(
    "1. A wireless sensor node comprising: a low-power microcontroller configured to operate in active and sleep modes;\n2. an environmental sensor configured to periodically sample ambient barometric pressure;\n3. and a sub-GHz radio transceiver configured to transmit encrypted sensor packets to a gateway."
  );
  const [docNames, setDocNames] = useState("Accused_Product_Datasheet_v1.pdf\nhttps://accused-corp.com/specifications");
  const [strategyPrompt, setStrategyPrompt] = useState(defaultSystemPrompt);

  if (!isOpen) return null;

  // Handle actual file selection or drop
  const processUploadedFile = async (file) => {
    if (!file) return;
    setUploadedFile(file);
    setIsParsing(true);
    setParsingStep(1);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const textContent = e.target.result || "";
      
      setTimeout(() => {
        setParsingStep(2);
      }, 400);

      setTimeout(async () => {
        setParsingStep(3);
        const parsed = await parseClaimDocumentFile(file, textContent, accusedProductName);
        setParsedCasePreview(parsed);
        setIsParsing(false);
      }, 900);
    };

    reader.onerror = () => {
      alert("Failed to read file.");
      setIsParsing(false);
    };

    reader.readAsText(file);
  };

  // Handle Drag & Drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  // Load a built-in sample document for instant 1-click testing
  const handleLoadSampleDocument = (sample) => {
    const blob = new Blob([sample.content], { type: 'text/plain' });
    const file = new File([blob], sample.name, { type: 'text/plain' });
    processUploadedFile(file);
  };

  const handleConfirmUploadedCase = () => {
    if (parsedCasePreview) {
      onCreateCase(parsedCasePreview);
      onClose();
    }
  };

  // Manual Form Submit
  const handleCreateCustom = (e) => {
    e.preventDefault();
    if (!patentNumber.trim() || !accusedProduct.trim()) {
      alert("Please enter a Patent Number and Accused Product Name.");
      return;
    }

    const lines = rawClaimsText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const parsedElements = (lines.length > 0 ? lines : [rawClaimsText]).map((line, idx) => {
      const cleanText = line.replace(/^(\d+\.?|[a-z]\.?|\[.*?\])\s*/i, '');
      const elementNum = idx + 1;

      return {
        id: `el-${elementNum}`,
        elementNumber: `${elementNum}`,
        label: `Claim 1 [Limitation 1.${String.fromCharCode(96 + elementNum)}]`,
        claimElement: cleanText || line,
        accusedFeature: `Product documentation for ${accusedProduct}: Discloses feature addressing "${(cleanText || line).slice(0, 45)}...".`,
        aiReasoning: `Preliminary mapping: Accused device satisfies limitation ${elementNum} based on initial technical specifications review.`,
        status: idx === 1 ? "weak" : "confirmed",
        history: [],
        keywords: (cleanText || line).toLowerCase().split(/\s+/).filter(w => w.length > 3)
      };
    });

    const parsedDocs = docNames
      .split('\n')
      .map(d => d.trim())
      .filter(d => d.length > 0)
      .map((name, i) => ({
        id: `doc-c-${i + 1}`,
        name,
        type: name.startsWith('http') ? 'url' : 'pdf',
        size: name.startsWith('http') ? 'Web' : '2.2 MB',
        dateAdded: 'Today'
      }));

    const newCase = {
      id: `case-${Date.now()}`,
      title: caseTitle.trim() || `${accusedProduct} Infringement Analysis`,
      patentNumber: patentNumber.trim().toUpperCase(),
      accusedProduct: accusedProduct.trim(),
      lastModified: "Just now",
      systemPrompt: strategyPrompt,
      uploadedDocs: parsedDocs.length > 0 ? parsedDocs : [
        { id: "doc-1", name: `${accusedProduct.replace(/\s+/g, '_')}_Spec.pdf`, type: "pdf", size: "2.5 MB", dateAdded: "Today" }
      ],
      claimChart: parsedElements
    };

    onCreateCase(newCase);
    onClose();
  };

  const handleSelectPreset = (preset) => {
    const clonedCase = {
      ...preset,
      id: `case-${Date.now()}`,
      title: `${preset.title} (New Session)`,
      lastModified: "Just now"
    };
    onCreateCase(clonedCase);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Create New Patent Claim Chart</h2>
              <p className="text-xs text-slate-400">Upload claim document, enter manually, or pick a sample preset</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 font-semibold transition border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'upload'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
            <span>Upload Document (AI Parse)</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-3 font-semibold transition border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'manual'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Manual Form</span>
          </button>
          <button
            onClick={() => setActiveTab('preset')}
            className={`flex-1 py-3 font-semibold transition border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'preset'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Presets</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          
          {/* TAB 1: UPLOAD CLAIM DOCUMENT WITH AI PARSING */}
          {activeTab === 'upload' && (
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Accused Product Name (Optional / Auto-detected from file)
                </label>
                <input
                  type="text"
                  value={accusedProductName}
                  onChange={(e) => setAccusedProductName(e.target.value)}
                  placeholder="e.g. Ring Video Doorbell Pro 2, Skydio X2 Drone..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              {/* Drag & Drop File Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-950/30'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-950/50'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      Drag and drop your Patent Claim Chart document
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Supports <strong className="text-slate-300">.docx, .pdf, .txt, .json, .csv</strong>
                    </p>
                  </div>
                  <label className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium cursor-pointer transition shadow-md">
                    <span>Browse File from Computer</span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".txt,.json,.csv,.docx,.pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          processUploadedFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Instant 1-Click Sample Claim Documents for Testing */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Or Test with Sample Claim Files (1-Click Upload):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SAMPLE_CLAIM_DOCUMENTS.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => handleLoadSampleDocument(sample)}
                      className="p-2.5 rounded-lg bg-slate-950/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 text-left transition group"
                    >
                      <div className="flex items-center gap-2 text-indigo-400 group-hover:text-indigo-300 font-medium">
                        <FileCode className="w-4 h-4 shrink-0" />
                        <span className="truncate text-xs">{sample.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {sample.id === 'sample-voltdrive' && 'VoltDrive EV (US8945210)'}
                        {sample.id === 'sample-doorbell' && 'Doorbell Facial Recog'}
                        {sample.id === 'sample-drone' && 'Drone Autonomous Avoid'}
                        {sample.id === 'sample-ar' && 'AR Glasses Waveguide'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Parsing Animation Loader */}
              {isParsing && (
                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 space-y-3 animate-pulse">
                  <div className="flex items-center gap-2.5 text-indigo-300 font-semibold text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>AI Analyzing & Parsing Claim Document...</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] font-mono">
                    <div className={`flex items-center gap-2 ${parsingStep >= 1 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <Check className="w-3 h-3" />
                      <span>Step 1: Reading document layout and patent metadata</span>
                    </div>
                    <div className={`flex items-center gap-2 ${parsingStep >= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <Check className="w-3 h-3" />
                      <span>Step 2: Identifying independent/dependent claim limitation hierarchy</span>
                    </div>
                    <div className={`flex items-center gap-2 ${parsingStep >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <Check className="w-3 h-3" />
                      <span>Step 3: Synthesizing baseline accused product citations and reasoning</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Parsed Preview */}
              {parsedCasePreview && !isParsing && (
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                      <FileCheck2 className="w-4 h-4" />
                      <span>AI Extracted Claim Chart Ready ({parsedCasePreview.claimChart.length} Elements)</span>
                    </div>
                    <span className="font-mono text-xs text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                      {parsedCasePreview.patentNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold">Title:</span>
                      <p className="text-slate-200 font-medium truncate">{parsedCasePreview.title}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold">Accused Product:</span>
                      <p className="text-slate-200 font-medium truncate">{parsedCasePreview.accusedProduct}</p>
                    </div>
                  </div>

                  {/* Elements List Preview */}
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {parsedCasePreview.claimChart.map((el) => (
                      <div key={el.id} className="p-2 rounded bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                        <span className="font-mono text-indigo-400 mr-2 shrink-0">{el.label}</span>
                        <span className="text-slate-300 truncate flex-1 text-[11px]">{el.claimElement}</span>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded ml-2 shrink-0">
                          {el.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleConfirmUploadedCase}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Launch Workspace</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MANUAL FORM ENTRY */}
          {activeTab === 'manual' && (
            <form onSubmit={handleCreateCustom} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Patent Number *
                  </label>
                  <input
                    type="text"
                    value={patentNumber}
                    onChange={(e) => setPatentNumber(e.target.value)}
                    placeholder="e.g. US 10,888,999 B2"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Accused Product *
                  </label>
                  <input
                    type="text"
                    value={accusedProduct}
                    onChange={(e) => setAccusedProduct(e.target.value)}
                    placeholder="e.g. Ring Video Doorbell Pro 2"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Case / Invention Title
                </label>
                <input
                  type="text"
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  placeholder="e.g. Wireless Environmental Monitoring Network"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Patent Claim Elements (One per line)
                </label>
                <textarea
                  value={rawClaimsText}
                  onChange={(e) => setRawClaimsText(e.target.value)}
                  rows={4}
                  placeholder="Paste numbered claim limitations here..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed text-xs"
                />
                <p className="text-[10px] text-slate-500">
                  Each line will be automatically converted into an element row in the 3-column legal table.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Accused Evidence Documents or URLs (One per line)
                </label>
                <textarea
                  value={docNames}
                  onChange={(e) => setDocNames(e.target.value)}
                  rows={2}
                  placeholder="e.g. Product_Manual_Rev2.pdf or https://..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans text-xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Initialize & Open Claim Chart</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: PRESET SAMPLE CASES */}
          {activeTab === 'preset' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Choose a pre-configured litigation case to immediately start refining claims:
              </p>

              {PRESET_CASES.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className="p-3.5 rounded-xl bg-slate-950/60 hover:bg-indigo-950/30 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition group"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-800/40">
                          {preset.patentNumber}
                        </span>
                        <h4 className="font-semibold text-slate-100 text-xs sm:text-sm group-hover:text-indigo-300 transition">
                          {preset.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Accused: <strong className="text-slate-300">{preset.accusedProduct}</strong> • {preset.claimChart.length} Elements • {(preset.uploadedDocs || []).length} Docs
                      </p>
                    </div>

                    <button className="px-3 py-1.5 rounded-lg bg-slate-900 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white text-xs font-medium flex items-center gap-1 transition">
                      <span>Load</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
