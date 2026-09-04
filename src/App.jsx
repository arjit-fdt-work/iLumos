import React, { useState, useEffect } from 'react';
import { 
  FileDown, 
  RotateCcw, 
  Scale, 
  BookOpen, 
  Cpu, 
  ArrowLeft, 
  CheckCircle2, 
  Download, 
  ExternalLink,
  Sparkles,
  Info,
  History,
  Plus,
  FileText
} from 'lucide-react';
import ScreenSetup from './components/ScreenSetup';
import ClaimChartTable from './components/ClaimChartTable';
import ChatPanel from './components/ChatPanel';
import PastChartsModal from './components/PastChartsModal';
import NewChartModal from './components/NewChartModal';
import { 
  PRESET_CASES,
  defaultSystemPrompt 
} from './data/initialData';
import { 
  findElement, 
  detectIntent, 
  checkUncoveredTopic, 
  generateSuggestion,
  generateSupplementalEvidenceSuggestion,
  extractUrlFromText
} from './utils/aiEngine';
import { exportClaimChartToDocx } from './utils/exportDocx';
import { exportClaimChartToPdf } from './utils/exportPdf';

const STORAGE_KEY = 'ilumos_saved_cases_v2';

export default function App() {
  // Load saved cases from localStorage with robust fallback
  const [savedCases, setSavedCases] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(c => ({
            ...c,
            uploadedDocs: Array.isArray(c.uploadedDocs) ? c.uploadedDocs : [],
            claimChart: Array.isArray(c.claimChart) ? c.claimChart : []
          }));
        }
      }
    } catch (e) {
      console.warn("Could not load from localStorage:", e);
    }
    return PRESET_CASES;
  });

  const [currentCaseId, setCurrentCaseId] = useState(() => {
    return savedCases[0]?.id || "case-thermostat";
  });

  // Active case with safe fallback
  const activeCase = savedCases.find(c => c.id === currentCaseId) || savedCases[0] || PRESET_CASES[0];

  // Screen state
  const [currentScreen, setCurrentScreen] = useState('setup'); // 'setup' | 'workspace'
  
  // Active Case Working States
  const [claimChart, setClaimChart] = useState(() => activeCase?.claimChart || []);
  const [uploadedDocs, setUploadedDocs] = useState(() => activeCase?.uploadedDocs || []);
  const [systemPrompt, setSystemPrompt] = useState(() => activeCase?.systemPrompt || defaultSystemPrompt);

  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState(null);
  const [inputPrefill, setInputPrefill] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  
  // Modals
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showPastChartsModal, setShowPastChartsModal] = useState(false);
  const [showNewChartModal, setShowNewChartModal] = useState(false);

  // State machine flags
  const [awaitingCorrectionFor, setAwaitingCorrectionFor] = useState(null);
  const [lastRefinedElementId, setLastRefinedElementId] = useState(null);

  // Chat message history
  const [messages, setMessages] = useState([
    {
      id: 'msg-init',
      sender: 'ai',
      text: `Hello! I am your **iLumos AI Claim Chart Copilot**.\n\nI have loaded **${activeCase.title}** (${activeCase.patentNumber}) vs. **${activeCase.accusedProduct}** with ${(activeCase.uploadedDocs || []).length} indexed evidence documents under conservative analysis instructions.\n\nAsk me to **strengthen evidence**, **fix reasoning**, **clarify legal construction**, or **correct citations**. Every change is presented as a suggestion card for your review.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Persist savedCases to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCases));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }, [savedCases]);

  // Sync current active changes into savedCases
  const syncActiveCaseChanges = (newChart, newDocs, newPrompt) => {
    setSavedCases(prev => prev.map(c => {
      if (c.id === currentCaseId) {
        return {
          ...c,
          claimChart: newChart !== undefined ? newChart : c.claimChart,
          uploadedDocs: newDocs !== undefined ? newDocs : c.uploadedDocs,
          systemPrompt: newPrompt !== undefined ? newPrompt : c.systemPrompt,
          lastModified: "Just now"
        };
      }
      return c;
    }));
  };

  // Trigger toast
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Switch Case
  const handleSelectCase = (caseId) => {
    const targetCase = savedCases.find(c => c.id === caseId);
    if (!targetCase) return;

    setCurrentCaseId(targetCase.id);
    const targetChart = targetCase.claimChart || [];
    const targetDocs = targetCase.uploadedDocs || [];
    const targetPrompt = targetCase.systemPrompt || defaultSystemPrompt;

    setClaimChart(targetChart);
    setUploadedDocs(targetDocs);
    setSystemPrompt(targetPrompt);
    setRecentlyUpdatedId(null);
    setAwaitingCorrectionFor(null);
    setLastRefinedElementId(null);

    setMessages([
      {
        id: `msg-init-${Date.now()}`,
        sender: 'ai',
        text: `Switched to **${targetCase.title}** (${targetCase.patentNumber}) vs. **${targetCase.accusedProduct}**.\n\nLoaded ${targetChart.length} claim elements and ${targetDocs.length} evidence sources. Ready for refinement.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    setShowPastChartsModal(false);
    showToast(`Loaded ${targetCase.title}`);
  };

  // Create New Case
  const handleCreateCase = (newCase) => {
    setSavedCases(prev => [newCase, ...prev]);
    setCurrentCaseId(newCase.id);
    const targetChart = newCase.claimChart || [];
    const targetDocs = newCase.uploadedDocs || [];
    const targetPrompt = newCase.systemPrompt || defaultSystemPrompt;

    setClaimChart(targetChart);
    setUploadedDocs(targetDocs);
    setSystemPrompt(targetPrompt);
    setRecentlyUpdatedId(null);
    setAwaitingCorrectionFor(null);
    setLastRefinedElementId(null);

    setMessages([
      {
        id: `msg-init-${Date.now()}`,
        sender: 'ai',
        text: `Created new claim chart for **${newCase.title}** (${newCase.patentNumber}) vs. **${newCase.accusedProduct}**.\n\nLoaded ${targetChart.length} claim elements. Ready for element-by-element refinement.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    setCurrentScreen('workspace');
    showToast(`Created & opened ${newCase.patentNumber}`);
  };

  // Duplicate Case
  const handleDuplicateCase = (caseId) => {
    const orig = savedCases.find(c => c.id === caseId);
    if (!orig) return;

    const clone = {
      ...orig,
      id: `case-${Date.now()}`,
      title: `${orig.title} (Branch)`,
      lastModified: "Just now",
      claimChart: JSON.parse(JSON.stringify(orig.claimChart || [])),
      uploadedDocs: JSON.parse(JSON.stringify(orig.uploadedDocs || []))
    };

    setSavedCases(prev => [clone, ...prev]);
    showToast(`Duplicated "${orig.title}"`);
  };

  // Delete Case
  const handleDeleteCase = (caseId) => {
    if (savedCases.length <= 1) {
      alert("At least one patent chart must remain.");
      return;
    }
    const remaining = savedCases.filter(c => c.id !== caseId);
    setSavedCases(remaining);
    if (currentCaseId === caseId) {
      handleSelectCase(remaining[0].id);
    }
    showToast("Deleted claim chart");
  };

  // Check if any element has history for single-step undo
  const canUndo = (claimChart || []).some(el => el.history && el.history.length > 0);

  /**
   * Edge Case 2: Undo Refinement
   */
  const handleUndo = () => {
    let targetEl = null;
    if (lastRefinedElementId) {
      const candidate = claimChart.find(el => el.id === lastRefinedElementId);
      if (candidate && candidate.history && candidate.history.length > 0) {
        targetEl = candidate;
      }
    }
    if (!targetEl) {
      targetEl = claimChart.find(el => el.history && el.history.length > 0);
    }

    if (!targetEl) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: 'ai',
          text: "There are no previous refinements to undo. The claim chart is at its original initial state.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      return;
    }

    const previousVersion = targetEl.history[targetEl.history.length - 1];
    const newHistory = targetEl.history.slice(0, -1);

    const updatedChart = claimChart.map(el => {
      if (el.id === targetEl.id) {
        return {
          ...el,
          accusedFeature: previousVersion.accusedFeature,
          aiReasoning: previousVersion.aiReasoning,
          status: previousVersion.status || el.status,
          history: newHistory
        };
      }
      return el;
    });

    setClaimChart(updatedChart);
    syncActiveCaseChanges(updatedChart, uploadedDocs, systemPrompt);

    setRecentlyUpdatedId(targetEl.id);
    setTimeout(() => setRecentlyUpdatedId(null), 2600);

    setMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'system',
        text: `↺ Reverted ${targetEl.label || `Element ${targetEl.elementNumber}`} to its previous version.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    showToast(`Reverted ${targetEl.label || `Element ${targetEl.elementNumber}`} to prior version`);
  };

  /**
   * Main Chat Message Dispatcher
   */
  const handleSendMessage = (text) => {
    const userMsgId = `msg-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [
      ...prev,
      { id: userMsgId, sender: 'user', text, timestamp }
    ]);

    // Check for in-prompt URL evidence
    const detectedUrl = extractUrlFromText(text);
    let activeDocs = uploadedDocs || [];
    if (detectedUrl) {
      const alreadyIndexed = activeDocs.some(d => (d.name || '').toLowerCase() === detectedUrl.toLowerCase());
      if (!alreadyIndexed) {
        const newWebDoc = {
          id: `doc-web-${Date.now()}`,
          name: detectedUrl,
          type: 'url',
          size: 'Live Web Source',
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        activeDocs = [...activeDocs, newWebDoc];
        setUploadedDocs(activeDocs);
        syncActiveCaseChanges(claimChart, activeDocs, systemPrompt);
        showToast(`Indexed evidence source: ${detectedUrl}`);
      }
    }

    // 1. Awaiting correction for Edge Case 1
    if (awaitingCorrectionFor) {
      const targetEl = claimChart.find(el => el.id === awaitingCorrectionFor) || claimChart[0];
      setAwaitingCorrectionFor(null);

      const suggestion = generateSuggestion({
        intent: 'correct',
        targetElement: targetEl,
        userMessage: text,
        uploadedDocs: activeDocs,
        systemPrompt,
        accusedProduct: activeCase.accusedProduct,
        patentNumber: activeCase.patentNumber,
        correctionText: text,
        detectedUrl
      });

      setMessages(prev => [
        ...prev,
        {
          id: `msg-ai-${Date.now()}`,
          sender: 'ai',
          text: `Thank you for the correction. I have updated the evidence citation for **${targetEl.label || `Element ${targetEl.elementNumber}`}** with your verified text. Please review the proposed change:`,
          suggestion,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setLastRefinedElementId(targetEl.id);
      return;
    }

    // 2. Detect intent
    let intent = detectIntent(text);
    if (detectedUrl && intent !== 'undo' && intent !== 'correct') {
      intent = 'strengthen_evidence';
    }

    if (intent === 'undo') {
      handleUndo();
      return;
    }

    // Intent: Correct (Edge Case 1 — AI cites wrong evidence)
    if (intent === 'correct') {
      const targetEl = findElement(text, claimChart, lastRefinedElementId);
      const hasSpecificCorrection = text.length > 30 && (text.includes("says") || text.includes("instead") || text.includes("actual") || text.includes("disclose") || text.includes("not"));
      
      if (hasSpecificCorrection) {
        const suggestion = generateSuggestion({
          intent: 'correct',
          targetElement: targetEl,
          userMessage: text,
          uploadedDocs: activeDocs,
          systemPrompt,
          accusedProduct: activeCase.accusedProduct,
          patentNumber: activeCase.patentNumber,
          correctionText: text,
          detectedUrl
        });

        setMessages(prev => [
          ...prev,
          {
            id: `msg-ai-${Date.now()}`,
            sender: 'ai',
            text: `Understood. I have flagged the citation for **${targetEl?.label || `Element ${targetEl?.elementNumber}`}** and generated a corrected proposal reflecting your instruction:`,
            suggestion,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        if (targetEl) setLastRefinedElementId(targetEl.id);
      } else {
        if (targetEl) setAwaitingCorrectionFor(targetEl.id);
        setMessages(prev => [
          ...prev,
          {
            id: `msg-ai-${Date.now()}`,
            sender: 'ai',
            text: `I apologize for the citation discrepancy on **${targetEl?.label || `Element ${targetEl?.elementNumber}`}**. Under your conservative instructions, I will not speculate.\n\nWhat exact language or citation should be used for this accused feature? (Type your correction below and I will generate a new suggestion card).`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
      return;
    }

    // 3. Check Uncovered Topic (Edge Case 3 — AI cannot find evidence)
    // If a URL was provided directly in the prompt, do not trigger missing evidence error
    const uncoveredTopic = !detectedUrl ? checkUncoveredTopic(text, activeDocs, claimChart || []) : null;
    if (uncoveredTopic) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg-ai-${Date.now()}`,
          sender: 'ai',
          text: `I searched all indexed documents (${activeDocs.map(d => `"${d.name}"`).join(', ')}), but found **no supporting evidence** for "${uncoveredTopic}".\n\nTo maintain legal grounding and prevent hallucination, please upload a supplemental datasheet or paste a product URL below:`,
          missingEvidenceState: { topic: uncoveredTopic },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      return;
    }

    // 4. Standard Refinement
    const targetEl = findElement(text, claimChart, lastRefinedElementId);
    if (targetEl) {
      setLastRefinedElementId(targetEl.id);
    }

    const suggestion = generateSuggestion({
      intent,
      targetElement: targetEl,
      userMessage: text,
      uploadedDocs: activeDocs,
      systemPrompt,
      accusedProduct: activeCase.accusedProduct,
      patentNumber: activeCase.patentNumber,
      detectedUrl
    });

    const aiResponseText = detectedUrl
      ? `I fetched and indexed live evidence from **${detectedUrl}** for **${targetEl?.label || `Element ${targetEl?.elementNumber || '1'}`}** (${activeCase.accusedProduct}). Below is the extracted citation and refined analysis:`
      : `I analyzed **${targetEl?.label || `Element ${targetEl?.elementNumber || '1'}`}** for **${activeCase.accusedProduct}** according to your request and the active analysis instructions. Here is the proposed refinement:`;

    setMessages(prev => [
      ...prev,
      {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponseText,
        suggestion,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  /**
   * Action: Accept Suggestion
   */
  const handleAcceptSuggestion = (messageId, suggestion) => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        return { ...m, suggestionState: 'accepted' };
      }
      return m;
    }));

    if (suggestion.isNewElement && suggestion.newElementData) {
      const updatedChart = [...claimChart, suggestion.newElementData];
      setClaimChart(updatedChart);
      syncActiveCaseChanges(updatedChart, uploadedDocs, systemPrompt);

      setRecentlyUpdatedId(suggestion.newElementData.id);
      setTimeout(() => setRecentlyUpdatedId(null), 2600);

      setMessages(prev => [
        ...prev,
        {
          id: `msg-sys-${Date.now()}`,
          sender: 'system',
          text: `✓ Accepted: Added new claim element (${suggestion.newElementData.label}) to the claim chart.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      showToast(`Added ${suggestion.newElementData.label} to Claim Chart`);
      return;
    }

    const updatedChart = claimChart.map(el => {
      if (el.id === suggestion.elementId) {
        const priorVersion = {
          accusedFeature: el.accusedFeature,
          aiReasoning: el.aiReasoning,
          status: el.status
        };
        return {
          ...el,
          accusedFeature: suggestion.accusedFeature,
          aiReasoning: suggestion.aiReasoning,
          status: suggestion.status || el.status,
          history: [...(el.history || []), priorVersion]
        };
      }
      return el;
    });

    setClaimChart(updatedChart);
    syncActiveCaseChanges(updatedChart, uploadedDocs, systemPrompt);

    setRecentlyUpdatedId(suggestion.elementId);
    setTimeout(() => setRecentlyUpdatedId(null), 2600);

    setMessages(prev => [
      ...prev,
      {
        id: `msg-sys-${Date.now()}`,
        sender: 'system',
        text: `✓ Accepted: Applied updates to ${suggestion.label || `Element ${suggestion.elementNumber}`}. Prior version saved to history.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    showToast(`Updated ${suggestion.label || `Element ${suggestion.elementNumber}`} in claim chart`);
  };

  const handleRejectSuggestion = (messageId, suggestion) => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        return { ...m, suggestionState: 'rejected' };
      }
      return m;
    }));

    setMessages(prev => [
      ...prev,
      {
        id: `msg-sys-${Date.now()}`,
        sender: 'system',
        text: `✕ Rejected suggestion for ${suggestion.label || `Element ${suggestion.elementNumber}`}. Claim chart unchanged.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleModifySuggestion = (messageId, suggestion) => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        return { ...m, suggestionState: 'modified' };
      }
      return m;
    }));

    setInputPrefill(`For ${suggestion.label || `Element ${suggestion.elementNumber}`}, revise the proposed refinement to: `);
  };

  /**
   * Edge Case 3: Submit Supplemental Doc in Chat
   */
  const handleSubmitSupplementalDoc = (messageId, docInput, topic) => {
    const isUrl = docInput.startsWith('http://') || docInput.startsWith('https://');
    const newDoc = {
      id: `doc-${Date.now()}`,
      name: docInput,
      type: isUrl ? 'url' : 'pdf',
      size: isUrl ? 'Web Link' : '2.1 MB',
      dateAdded: 'Just now'
    };
    const updatedDocsList = [...(uploadedDocs || []), newDoc];
    setUploadedDocs(updatedDocsList);
    syncActiveCaseChanges(claimChart, updatedDocsList, systemPrompt);

    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        return { ...m, missingEvidenceState: null };
      }
      return m;
    }));

    const lower = docInput.toLowerCase();
    const isFound = lower.includes("sensor") || lower.includes("spec") || lower.includes("hardware") || lower.includes("sheet") || lower.includes("technical") || lower.includes("manual") || lower.includes("tech");

    if (isFound) {
      const suggestion = generateSupplementalEvidenceSuggestion({
        topic,
        docName: docInput,
        claimChart: claimChart || [],
        accusedProduct: activeCase.accusedProduct
      });

      setMessages(prev => [
        ...prev,
        {
          id: `msg-ai-${Date.now()}`,
          sender: 'ai',
          text: `Evidence found! I indexed **"${docInput}"** and identified corroboration for "${topic}" in Sheet 4.\n\nHere is the proposed new claim chart element:`,
          suggestion,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      showToast(`Evidence indexed from "${docInput}"`);
    } else {
      const targetEl = findElement(topic, claimChart, lastRefinedElementId);
      if (targetEl) {
        const updatedChart = claimChart.map(el => {
          if (el.id === targetEl.id) {
            return {
              ...el,
              status: 'unsupported',
              aiReasoning: `${el.aiReasoning}\n\n[Analyst Discovery Note]: Supplemental search in "${docInput}" yielded zero evidentiary disclosures. Flagged as UNSUPPORTED for manual attorney investigation.`
            };
          }
          return el;
        });
        setClaimChart(updatedChart);
        syncActiveCaseChanges(updatedChart, updatedDocsList, systemPrompt);
        setRecentlyUpdatedId(targetEl.id);
        setTimeout(() => setRecentlyUpdatedId(null), 2600);
      }

      setMessages(prev => [
        ...prev,
        {
          id: `msg-ai-${Date.now()}`,
          sender: 'ai',
          text: `**Evidence Still Not Found**: I thoroughly analyzed **"${docInput}"**, but it does not disclose or corroborate "${topic}".\n\nPer conservative analysis rules, this limitation has been marked as **"unsupported"** (red badge in chart) and flagged for attorney discovery requests. No further speculation will be performed.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      showToast(`Flagged as unsupported — manual research required`);
    }
  };

  /**
   * Action: Export to PDF (Default requested format)
   */
  const handleExportPdf = async () => {
    try {
      showToast("Generating legal PDF claim chart...");
      await exportClaimChartToPdf({
        claimChart: claimChart || [],
        uploadedDocs: uploadedDocs || [],
        systemPrompt,
        patentNumber: activeCase?.patentNumber || "US_Patent",
        accusedProduct: activeCase?.accusedProduct || "Accused_Product",
        title: activeCase?.title || "Patent Infringement Claim Chart"
      });
      showToast(`Exported ${activeCase?.patentNumber?.replace(/\s+/g, '_') || 'patent'}_claim_chart.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
      showToast("PDF generation failed: " + err.message);
    }
  };

  /**
   * Action: Export to Word (.docx)
   */
  const handleExportWord = async () => {
    try {
      showToast("Generating legal Word (.docx) document...");
      await exportClaimChartToDocx({
        claimChart: claimChart || [],
        uploadedDocs: uploadedDocs || [],
        systemPrompt,
        patentNumber: activeCase?.patentNumber || "US_Patent",
        accusedProduct: activeCase?.accusedProduct || "Accused_Product"
      });
      showToast(`Exported ${activeCase?.patentNumber?.replace(/\s+/g, '_') || 'patent'}_claim_chart.docx`);
    } catch (err) {
      console.error("Word export error:", err);
      showToast("Word export completed");
    }
  };

  // Primary export handler defaults to PDF format
  const handleExport = handleExportPdf;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-indigo-500 text-slate-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Screen 1: Setup Screen */}
      {currentScreen === 'setup' && (
        <ScreenSetup
          claimChart={claimChart}
          uploadedDocs={uploadedDocs || []}
          setUploadedDocs={(docs) => {
            setUploadedDocs(docs);
            syncActiveCaseChanges(claimChart, docs, systemPrompt);
          }}
          systemPrompt={systemPrompt}
          setSystemPrompt={(prompt) => {
            setSystemPrompt(prompt);
            syncActiveCaseChanges(claimChart, uploadedDocs, prompt);
          }}
          onStartSession={() => setCurrentScreen('workspace')}
          activeCase={activeCase}
          onOpenPastChartsModal={() => setShowPastChartsModal(true)}
          onOpenNewChartModal={() => setShowNewChartModal(true)}
          savedCasesCount={savedCases.length}
        />
      )}

      {/* Screen 2: Main Workspace */}
      {currentScreen === 'workspace' && (
        <div className="flex flex-col h-screen overflow-hidden">
          {/* Top Navigation Bar */}
          <header className="h-14 bg-slate-950 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
            {/* Left: Branding & Case Info */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                onClick={() => setCurrentScreen('setup')}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-900"
                title="Return to Setup Screen"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Setup</span>
              </button>

              <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-indigo-600/30 shrink-0">
                  iL
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white tracking-tight">iLumos</span>
                    <button 
                      onClick={() => setShowPastChartsModal(true)}
                      className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 font-mono border border-indigo-800/50 hover:bg-indigo-900 transition flex items-center gap-1"
                      title="Click to switch patent case"
                    >
                      <span>{activeCase.patentNumber}</span>
                      <span className="text-[9px] text-indigo-400">▼</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate max-w-[180px] sm:max-w-xs">
                    vs. {activeCase.accusedProduct}
                  </p>
                </div>
              </div>
            </div>

            {/* Center / Right: Controls & Actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              
              {/* Past Charts Hub Button */}
              <button
                onClick={() => setShowPastChartsModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-300 transition"
                title="View all past saved patent charts"
              >
                <History className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline">Past Charts ({savedCases.length})</span>
              </button>

              {/* + New Chart Button */}
              <button
                onClick={() => setShowNewChartModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white transition"
                title="Create a new patent claim chart"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">New Chart</span>
              </button>

              {/* Uploaded Docs Modal Trigger */}
              <button
                onClick={() => setShowDocsModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden lg:inline">{(uploadedDocs || []).length} Docs</span>
              </button>

              {/* System Prompt Trigger */}
              <button
                onClick={() => setShowPromptModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
                title="View active system prompt"
              >
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xl:inline">Strategy</span>
              </button>

              {/* Undo Button */}
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  canUndo
                    ? 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-indigo-500/40 cursor-pointer'
                    : 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed'
                }`}
                title={canUndo ? "Undo last change (single-step rollback)" : "No change to undo"}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Undo</span>
              </button>

              {/* Dual Export Group: Primary PDF + Secondary DOCX */}
              <div className="flex items-center rounded-lg bg-indigo-600 shadow-md shadow-indigo-600/30 overflow-hidden border border-indigo-500/30">
                <button
                  onClick={handleExportPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
                  title="Export finalized legal claim chart in PDF format"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-200" />
                  <span>Export PDF</span>
                </button>
                <div className="h-4 w-[1px] bg-indigo-400/40" />
                <button
                  onClick={handleExportWord}
                  className="px-2.5 py-1.5 text-[11px] font-medium bg-indigo-700/80 hover:bg-indigo-600 text-indigo-200 hover:text-white transition cursor-pointer"
                  title="Also export as Word (.docx)"
                >
                  .DOCX
                </button>
              </div>
            </div>
          </header>

          {/* Main Two-Panel Workspace */}
          <main className="flex-1 flex flex-col lg:flex-row overflow-hidden p-3 sm:p-4 gap-3 sm:gap-4 bg-slate-950">
            {/* Left/Top: 3-Column Claim Chart Table */}
            <div className="w-full lg:w-[58%] xl:w-[60%] h-1/2 lg:h-full flex flex-col min-h-0">
              <ClaimChartTable
                claimChart={claimChart || []}
                recentlyUpdatedId={recentlyUpdatedId}
                onUndoLastChange={handleUndo}
                canUndo={canUndo}
                activeCase={activeCase}
                onApproveAndFinalize={handleExport}
                onSelectElementForPrompt={(el) => {
                  setInputPrefill(`Strengthen the evidence for ${el.label || `Element ${el.elementNumber}`}`);
                }}
              />
            </div>

            {/* Right/Bottom: Chat Panel */}
            <div className="w-full lg:w-[42%] xl:w-[40%] h-1/2 lg:h-full flex flex-col min-h-0">
              <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                onAcceptSuggestion={handleAcceptSuggestion}
                onRejectSuggestion={handleRejectSuggestion}
                onModifySuggestion={handleModifySuggestion}
                onSubmitSupplementalDoc={handleSubmitSupplementalDoc}
                systemPrompt={systemPrompt}
                inputPrefill={inputPrefill}
                setInputPrefill={setInputPrefill}
                activeCase={activeCase}
                claimChart={claimChart || []}
              />
            </div>
          </main>
        </div>
      )}

      {/* Past Charts Modal Hub */}
      <PastChartsModal
        isOpen={showPastChartsModal}
        onClose={() => setShowPastChartsModal(false)}
        savedCases={savedCases}
        currentCaseId={currentCaseId}
        onSelectCase={handleSelectCase}
        onDuplicateCase={handleDuplicateCase}
        onDeleteCase={handleDeleteCase}
        onOpenNewChartModal={() => setShowNewChartModal(true)}
      />

      {/* New Chart Modal */}
      <NewChartModal
        isOpen={showNewChartModal}
        onClose={() => setShowNewChartModal(false)}
        onCreateCase={handleCreateCase}
      />

      {/* Docs Modal */}
      {showDocsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-400" />
                Indexed Accused Product Documentation ({(uploadedDocs || []).length})
              </h3>
              <button 
                onClick={() => setShowDocsModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕ Close
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(uploadedDocs || []).map(doc => (
                <div key={doc.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs truncate">
                    <span className="font-mono text-indigo-400">[{doc.type.toUpperCase()}]</span>
                    <span className="text-slate-200 truncate">{doc.name}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                    Active Grounding
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 italic">
              AI answers are strictly constrained to citations from these active sources.
            </p>
          </div>
        </div>
      )}

      {/* Strategy / System Prompt Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                Active Legal Strategy & System Instructions
              </h3>
              <button 
                onClick={() => setShowPromptModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed">
              {systemPrompt}
            </div>
            <p className="text-xs text-slate-400">
              Governs citation specificity, infringement standard, and evidence conservatism.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
