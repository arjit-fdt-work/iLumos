import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Globe, 
  UploadCloud, 
  Plus, 
  Trash2, 
  Sparkles, 
  ShieldAlert, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  AlertTriangle,
  XCircle,
  BookOpen, 
  Scale, 
  Cpu,
  RotateCcw,
  Search,
  MessageSquare,
  History,
  Send,
  Check,
  X,
  Edit3,
  Upload,
  AlertCircle,
  Bot,
  User,
  FileDown
} from 'lucide-react';

/**
 * iLumos Claim Chart Refinement Prototype
 * Complete Single-File React Component
 * 
 * Includes:
 * - Screen 1: Setup (Claim chart upload, Accused product docs/URL, System prompt presets)
 * - Screen 2: 3-column Legal Claim Chart table + AI Chat Copilot
 * - Core loop: Refinement request -> AI Suggestion Card -> Accept / Reject / Modify
 * - Edge Case 1: AI cites wrong evidence (correction flow into new suggestion card)
 * - Edge Case 2: Single-step undo (pops element history and restores exact state)
 * - Edge Case 3: Missing evidence handling (AI asks for supplemental doc/URL via inline input -> Found vs. Not Found terminal state)
 * - Word (.docx / .doc) Export with 3-column table
 */

// Initial Seed Data
const INITIAL_CLAIM_CHART = [
  {
    id: "el-1",
    elementNumber: "1",
    label: "Claim 1 [Limitation 1.a]",
    claimElement: "A temperature control device comprising: a wireless communication module configured to connect to a local area network;",
    accusedFeature: 'Acme Thermostat product page states: "WiFi-enabled smart thermostat connects to your home network"',
    aiReasoning: "The Acme device has WiFi capability which satisfies the wireless communication module requirement.",
    status: "confirmed", // "confirmed" | "weak" | "unsupported"
    history: [], // single-step undo history: [{ accusedFeature, aiReasoning, status }]
    keywords: ["temperature control", "wireless", "wifi", "communication module", "network", "local area network", "connect"]
  },
  {
    id: "el-2",
    elementNumber: "2",
    label: "Claim 1 [Limitation 1.b]",
    claimElement: "a processor configured to execute a machine learning algorithm to predict user temperature preferences based on historical occupancy patterns;",
    accusedFeature: 'Acme User Manual (Rev 2.1), Section 4: "Smart Schedule feature observes daily routine to recommend energy-saving temperatures."',
    aiReasoning: "Acme Smart Schedule observes daily routines, showing rudimentary prediction of temperature settings.",
    status: "weak",
    history: [],
    keywords: ["processor", "machine learning", "ml", "algorithm", "predict", "preference", "preferences", "occupancy", "smart schedule", "routine", "historical"]
  },
  {
    id: "el-3",
    elementNumber: "3",
    label: "Claim 1 [Limitation 1.c]",
    claimElement: "and a control interface configured to automatically adjust ambient temperature based on the predicted user temperature preferences.",
    accusedFeature: 'Acme Technical Specs, Sheet 3: "Dual-relay 24VAC control interface triggers HVAC heating and cooling cycles automatically."',
    aiReasoning: "The relay interface automatically adjusts HVAC state in response to calculated temperature setpoints.",
    status: "confirmed",
    history: [],
    keywords: ["control interface", "automatically adjust", "ambient temperature", "hvac", "relay", "heating", "cooling", "adjust"]
  }
];

const INITIAL_DOCS = [
  { id: "doc-1", name: "Acme_Thermostat_Datasheet_v1.2.pdf", type: "pdf", size: "2.4 MB" },
  { id: "doc-2", name: "https://acme-hardware.com/products/smart-thermostat-pro", type: "url", size: "Webpage" },
  { id: "doc-3", name: "Acme_SmartThermostat_UserManual_2023.pdf", type: "pdf", size: "4.8 MB" }
];

const PROMPT_PRESETS = [
  {
    id: "conservative",
    title: "Conservative & Literal (Default)",
    prompt: "Be conservative — flag anything not explicitly stated in the evidence. Require verbatim document quotes and rigorous element-by-element limitation mapping. Avoid speculative inferences."
  },
  {
    id: "technical",
    title: "Technical Litigation-Ready",
    prompt: "Provide rigorous technical evidence mapping. Trace signals from processor registers through bus architecture to accused mechanical actuators, citing specific document sections."
  },
  {
    id: "broad",
    title: "Broad Claim Construction",
    prompt: "Constrain claim terms according to their plain and ordinary meaning under Phillips v. AWH Corp. Emphasize functional and structural equivalence in accused features."
  }
];

const UNCOVERED_TOPICS = [
  "temperature sensor array",
  "sensor array",
  "humidity",
  "infrared",
  "ambient light sensor",
  "thermopile"
];

// Helper to extract claim sub-limitation letter (e.g. "b" from "Claim 1(b)", "1.b", "1b", "(b)")
function extractLimitationLetter(lower) {
  const parenMatch = lower.match(/(?:claim|limitation|element|el|row)?\s*\d*\s*[\(\[]([a-z])[\)\]]/i);
  if (parenMatch) return parenMatch[1].toLowerCase();

  const dotMatch = lower.match(/(?:claim|limitation|element|el)?\s*\d+\.([a-z])\b/i);
  if (dotMatch) return dotMatch[1].toLowerCase();

  const directMatch = lower.match(/\b(?:claim|limitation|element|el)?\s*\d+([a-z])\b/i);
  if (directMatch) return directMatch[1].toLowerCase();

  const wordMatch = lower.match(/\b(?:limitation|sublimitation|sub-limitation|element|el|part|feature)\s+([a-z])\b/i);
  if (wordMatch) return wordMatch[1].toLowerCase();

  return null;
}

// AI Rules Engine Helper Functions
function findElement(text, chart, lastActiveId) {
  if (!chart || chart.length === 0) return null;
  const lower = text.toLowerCase();

  // Priority 1: Match sub-limitation lettering (e.g. "Claim 1(b)", "1(b)", "1.b", "1b", "(b)", "limitation b")
  const letter = extractLimitationLetter(lower);
  if (letter) {
    const foundInLabel = chart.find(el => {
      const l = (el.label || "").toLowerCase();
      const c = (el.claimElement || "").toLowerCase();
      return (
        l.includes("." + letter) || 
        l.includes("(" + letter + ")") || 
        l.includes("[" + letter + "]") || 
        l.includes(" " + letter + "]") ||
        l.includes(letter + ")") ||
        c.startsWith(letter + ".") ||
        c.startsWith("(" + letter + ")")
      );
    });
    if (foundInLabel) return foundInLabel;

    const charIndex = letter.charCodeAt(0) - 97;
    if (charIndex >= 0 && charIndex < chart.length) {
      return chart[charIndex];
    }
  }

  // Priority 2: Direct match by element ID ("el-1", "el-2", etc.)
  for (const el of chart) {
    if (el.id && lower.includes(el.id.toLowerCase())) return el;
  }

  // Priority 3: Ordinals ("first", "second", "third", "fourth", "fifth", "1st", "2nd", "3rd")
  const ordinals = [
    { word: /\b(?:first|1st)\b/, idx: 0 },
    { word: /\b(?:second|2nd)\b/, idx: 1 },
    { word: /\b(?:third|3rd)\b/, idx: 2 },
    { word: /\b(?:fourth|4th)\b/, idx: 3 },
    { word: /\b(?:fifth|5th)\b/, idx: 4 },
  ];
  for (const ord of ordinals) {
    if (ord.word.test(lower) && chart[ord.idx]) {
      return chart[ord.idx];
    }
  }

  // Priority 4: Match by number ("element 2", "el 2", "limitation 2", "row 2", "claim 2", "#2")
  const numMatch = lower.match(/\b(?:element|el|limitation|row|claim|item)\s*(?:#|no\.?)?\s*(\d+)\b/);
  if (numMatch && numMatch[1]) {
    const targetNum = parseInt(numMatch[1], 10);
    const foundByNum = chart.find(el => parseInt(el.elementNumber, 10) === targetNum);
    if (foundByNum) return foundByNum;
    if (targetNum > 0 && targetNum <= chart.length) {
      return chart[targetNum - 1];
    }
  }

  // Priority 5: Keyword scoring
  let bestEl = null;
  let maxMatches = 0;
  for (const el of chart) {
    let matches = 0;
    const keywords = [...(el.keywords || []), ...el.claimElement.toLowerCase().split(/\s+/).filter(w => w.length > 4)];
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) matches++;
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      bestEl = el;
    }
  }

  if (bestEl && maxMatches > 0) return bestEl;
  if (lastActiveId) {
    const found = chart.find(el => el.id === lastActiveId);
    if (found) return found;
  }
  return chart[0];
}

function detectIntent(text) {
  const lower = text.toLowerCase();
  if (lower.includes("undo") || lower.includes("revert") || lower.includes("rollback")) return "undo";
  if (lower.includes("wrong") || lower.includes("incorrect") || lower.includes("doesn't say") || lower.includes("does not say") || lower.includes("not accurate") || lower.includes("mistake")) return "correct";
  if (lower.includes("weak") || lower.includes("vague") || lower.includes("more specific") || lower.includes("technical analysis") || lower.includes("fix reasoning") || lower.includes("more technical")) return "fix_reasoning";
  if (lower.includes("strengthen") || lower.includes("stronger evidence") || lower.includes("add documentation") || lower.includes("more evidence") || lower.includes("corroborate")) return "strengthen_evidence";
  if (lower.includes("legal") || lower.includes("claim construction") || lower.includes("clarify") || lower.includes("phillips") || lower.includes("plain meaning")) return "clarify_legal";
  if (lower.includes("add") || lower.includes("missing") || lower.includes("missed") || lower.includes("new element")) return "add_feature";
  return "generic";
}

function checkUncoveredTopic(text, uploadedDocs) {
  const lower = text.toLowerCase();
  const matched = UNCOVERED_TOPICS.find(topic => lower.includes(topic));
  if (!matched) return null;
  const docCovers = uploadedDocs.some(doc => {
    const name = (doc.name || "").toLowerCase();
    return name.includes("sensor") || name.includes("humidity") || name.includes("array");
  });
  if (!docCovers) return matched;
  return null;
}

function generateSuggestion({ intent, targetElement, uploadedDocs, correctionText }) {
  const doc = uploadedDocs[0]?.name || "Acme_Thermostat_Datasheet_v1.2.pdf";
  const doc2 = uploadedDocs[2]?.name || uploadedDocs[1]?.name || "Acme_SmartThermostat_UserManual_2023.pdf";

  switch (intent) {
    case "strengthen_evidence": {
      if (targetElement.id === "el-2") {
        return {
          elementId: targetElement.id,
          elementNumber: targetElement.elementNumber,
          label: targetElement.label,
          accusedFeature: `${targetElement.accusedFeature}\n\n[Corroborated by ${doc}, p. 14, Table 3.2]: "Cortex-M4 application processor runs on-device predictive thermal model (Firmware v2.4+), polling thermal history and occupancy PIR sensor every 60s."`,
          aiReasoning: `The Acme Thermostat embeds a dedicated Cortex-M4 processor executing on-device predictive algorithms. The thermal model mathematically predicts user temperature preferences based on historical occupancy patterns logged by the PIR sensor, satisfying each literal limitation of Claim 1[1.b].`,
          explanation: `Appended corroborating hardware excerpt from ${doc} (p. 14) identifying the on-device processor model and real-time predictive thermal polling algorithm.`,
          status: "confirmed"
        };
      } else if (targetElement.id === "el-1") {
        return {
          elementId: targetElement.id,
          elementNumber: targetElement.elementNumber,
          label: targetElement.label,
          accusedFeature: `${targetElement.accusedFeature}\n\n[Further confirmed in ${doc}, Sec 2.1]: "Integrated 802.11 b/g/n (2.4 GHz) Wi-Fi transceiver with WPA3 enterprise encryption communicates directly with local Wi-Fi router."`,
          aiReasoning: `The Acme device incorporates an integrated 802.11 b/g/n transceiver configured to establish bi-directional IP communication with a local network router, establishing literal satisfaction of the wireless communication module limitation.`,
          explanation: `Added IEEE 802.11 b/g/n wireless transceiver specification from Section 2.1 with direct local network connectivity citations.`,
          status: "confirmed"
        };
      } else {
        return {
          elementId: targetElement.id,
          elementNumber: targetElement.elementNumber,
          label: targetElement.label,
          accusedFeature: `${targetElement.accusedFeature}\n\n[Corroborated by ${doc2}, Section 6.1]: "Microcontroller pulses 24VAC relays via triac driver circuit whenever ambient temperature drifts 0.5°F from predictive target."`,
          aiReasoning: `Technical specification confirms the hardware control interface directly interfaces with 24VAC HVAC lines, triggering heating/cooling cycles based on predictive algorithm targets without requiring manual user intervention.`,
          explanation: `Added technical relay voltage specifications and automated actuation threshold data from ${doc2}.`,
          status: "confirmed"
        };
      }
    }
    case "fix_reasoning": {
      if (targetElement.id === "el-2") {
        return {
          elementId: targetElement.id,
          elementNumber: targetElement.elementNumber,
          label: targetElement.label,
          accusedFeature: targetElement.accusedFeature,
          aiReasoning: `Claim 1[1.b] recites a processor executing a machine learning algorithm to predict user temperature preferences based on historical occupancy. Acme's 'Smart Schedule' feature fulfills this requirement through a three-stage machine learning pipeline: (1) historical occupancy logging via passive infrared sensor data, (2) regression modeling of temperature adjustments made during occupied intervals, and (3) automated generation of predictive setpoints. This technical implementation establishes literal infringement under 35 U.S.C. § 271.`,
          explanation: `Replaced high-level summary with a 3-stage technical mapping of the Smart Schedule pipeline to the claim's predictive machine learning limitation.`,
          status: "confirmed"
        };
      } else {
        return {
          elementId: targetElement.id,
          elementNumber: targetElement.elementNumber,
          label: targetElement.label,
          accusedFeature: targetElement.accusedFeature,
          aiReasoning: `The dual-relay interface constitutes a physical control interface operatively coupled to heating and cooling equipment. When the predictive algorithm updates the target setpoint, the processor signals relay drivers to close contacts, regulating ambient temperature without human intervention.`,
          explanation: `Mapped processor output signals to electro-mechanical relay actuation and ambient thermal regulation.`,
          status: "confirmed"
        };
      }
    }
    case "clarify_legal": {
      return {
        elementId: targetElement.id,
        elementNumber: targetElement.elementNumber,
        label: targetElement.label,
        accusedFeature: targetElement.accusedFeature,
        aiReasoning: `${targetElement.aiReasoning}\n\n[Claim Construction Note]: Under Phillips v. AWH Corp., 415 F.3d 1303 (Fed. Cir. 2005), the limitation is construed according to its plain and ordinary meaning to a person having ordinary skill in the art (PHOSITA). The specification contains no lexicographical disavowal; thus, the accused Acme architecture falls squarely within the literal scope of the claim.`,
        explanation: `Added plain-and-ordinary meaning claim construction analysis under Phillips v. AWH Corp. to foreclose narrow claim scope defenses.`,
        status: targetElement.status === "weak" ? "confirmed" : targetElement.status
      };
    }
    case "correct": {
      const newAccused = correctionText
        ? `[Corrected Evidence Citation]: "${correctionText}"`
        : `[Analyst Corrected Evidence]: Verified against ${doc}: "WiFi module operates on 2.4GHz IEEE 802.11 standards with explicit local LAN discovery mode."`;
      return {
        elementId: targetElement.id,
        elementNumber: targetElement.elementNumber,
        label: targetElement.label,
        accusedFeature: newAccused,
        aiReasoning: `Updated reasoning to strictly align with verified evidence quote: ${newAccused}. Matches claim requirement for ${targetElement.claimElement.slice(0, 60)}... without extrapolations.`,
        explanation: `Corrected evidence quotation and synchronized legal reasoning in accordance with analyst instruction.`,
        status: "confirmed"
      };
    }
    default: {
      return {
        elementId: targetElement.id,
        elementNumber: targetElement.elementNumber,
        label: targetElement.label,
        accusedFeature: `${targetElement.accusedFeature}\n[Verified in product documentation]: Corroborated with primary specification sheet rev 2.`,
        aiReasoning: `${targetElement.aiReasoning} Element-by-element mapping confirms literal correspondence with the accused product features.`,
        explanation: `Refined evidence citations and tightened legal reasoning according to active system prompt criteria.`,
        status: targetElement.status === "weak" ? "confirmed" : targetElement.status
      };
    }
  }
}

export default function ILumosPrototypeSingleFile() {
  const [currentScreen, setCurrentScreen] = useState('setup'); // 'setup' | 'workspace'
  const [claimChart, setClaimChart] = useState(INITIAL_CLAIM_CHART);
  const [uploadedDocs, setUploadedDocs] = useState(INITIAL_DOCS);
  const [systemPrompt, setSystemPrompt] = useState(PROMPT_PRESETS[0].prompt);

  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState(null);
  const [inputPrefill, setInputPrefill] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);

  // Setup form states
  const [chartFileName, setChartFileName] = useState("US_10489122_Claim1_Thermostat.json");
  const [newDocInput, setNewDocInput] = useState("");
  const [showAddDocForm, setShowAddDocForm] = useState(false);

  // Chat states
  const [awaitingCorrectionFor, setAwaitingCorrectionFor] = useState(null);
  const [lastRefinedElementId, setLastRefinedElementId] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [supplementalInput, setSupplementalInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 'msg-init',
      sender: 'ai',
      text: "Hello! I am your **iLumos AI Claim Chart Copilot**.\n\nI have loaded Claim 1 of U.S. Patent 10,489,122 B2 and indexed 3 evidence documents for Acme Smart Thermostat Pro under conservative analysis instructions.\n\nAsk me to **strengthen evidence**, **fix reasoning**, **clarify legal construction**, or **correct citations**. Every change is presented as a suggestion card for your review.",
      timestamp: "Just now"
    }
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const canUndo = claimChart.some(el => el.history && el.history.length > 0);

  // Edge Case 2: Undo
  const handleUndo = () => {
    let targetEl = null;
    if (lastRefinedElementId) {
      const candidate = claimChart.find(el => el.id === lastRefinedElementId);
      if (candidate?.history?.length > 0) targetEl = candidate;
    }
    if (!targetEl) targetEl = claimChart.find(el => el.history?.length > 0);

    if (!targetEl) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: 'ai',
          text: "There are no previous refinements to undo. The claim chart is at its original initial state.",
          timestamp: "Just now"
        }
      ]);
      return;
    }

    const previousVersion = targetEl.history[targetEl.history.length - 1];
    const newHistory = targetEl.history.slice(0, -1);

    setClaimChart(prev => prev.map(el => {
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
    }));

    setRecentlyUpdatedId(targetEl.id);
    setTimeout(() => setRecentlyUpdatedId(null), 2500);

    setMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'system',
        text: `↺ Reverted ${targetEl.label || `Element ${targetEl.elementNumber}`} to its previous version.`,
        timestamp: "Just now"
      }
    ]);
    showToast(`Reverted ${targetEl.label || `Element ${targetEl.elementNumber}`} to prior version`);
  };

  // Chat message dispatcher
  const handleSendMessage = (text) => {
    if (!text.trim()) return;
    const userMsg = { id: `msg-${Date.now()}`, sender: 'user', text: text.trim(), timestamp: "Just now" };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');

    // Edge Case 1 continuation
    if (awaitingCorrectionFor) {
      const targetEl = claimChart.find(el => el.id === awaitingCorrectionFor) || claimChart[0];
      setAwaitingCorrectionFor(null);

      const suggestion = generateSuggestion({
        intent: 'correct',
        targetElement: targetEl,
        uploadedDocs,
        correctionText: text
      });

      setMessages(prev => [
        ...prev,
        {
          id: `msg-ai-${Date.now()}`,
          sender: 'ai',
          text: `Thank you for the correction. I have updated the citation for **${targetEl.label || `Element ${targetEl.elementNumber}`}** with your verified text. Please review the proposed change:`,
          suggestion,
          timestamp: "Just now"
        }
      ]);
      setLastRefinedElementId(targetEl.id);
      return;
    }

    const intent = detectIntent(text);

    if (intent === 'undo') {
      handleUndo();
      return;
    }

    // Edge Case 1: Wrong Evidence
    if (intent === 'correct') {
      const targetEl = findElement(text, claimChart, lastRefinedElementId);
      const hasDirectCorrection = text.length > 35 && (text.includes("says") || text.includes("instead") || text.includes("actual"));
      if (hasDirectCorrection) {
        const suggestion = generateSuggestion({
          intent: 'correct',
          targetElement: targetEl,
          uploadedDocs,
          correctionText: text
        });
        setMessages(prev => [
          ...prev,
          {
            id: `msg-ai-${Date.now()}`,
            sender: 'ai',
            text: `Understood. I have flagged the citation discrepancy for **${targetEl.label || `Element ${targetEl.elementNumber}`}** and generated a corrected proposal reflecting your instruction:`,
            suggestion,
            timestamp: "Just now"
          }
        ]);
        setLastRefinedElementId(targetEl.id);
      } else {
        setAwaitingCorrectionFor(targetEl.id);
        setMessages(prev => [
          ...prev,
          {
            id: `msg-ai-${Date.now()}`,
            sender: 'ai',
            text: `I apologize for the citation discrepancy on **${targetEl.label || `Element ${targetEl.elementNumber}`}**. Under your conservative instructions, I will not speculate.\n\nWhat exact language or citation should be used for this accused feature?`,
            timestamp: "Just now"
          }
        ]);
      }
      return;
    }

    // Edge Case 3: Missing Evidence
    const uncovered = checkUncoveredTopic(text, uploadedDocs);
    if (uncovered) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg-ai-${Date.now()}`,
          sender: 'ai',
          text: `I searched all indexed documents (${uploadedDocs.map(d => `"${d.name}"`).join(', ')}), but found **no supporting evidence** for "${uncovered}".\n\nTo maintain legal grounding and prevent hallucination, please upload a supplemental datasheet or paste a product URL below:`,
          missingEvidenceState: { topic: uncovered },
          timestamp: "Just now"
        }
      ]);
      return;
    }

    // Normal Refinement Loop
    const targetEl = findElement(text, claimChart, lastRefinedElementId);
    setLastRefinedElementId(targetEl.id);

    const suggestion = generateSuggestion({
      intent,
      targetElement: targetEl,
      uploadedDocs
    });

    setMessages(prev => [
      ...prev,
      {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: `I analyzed **${targetEl.label || `Element ${targetEl.elementNumber}`}** according to your request. Here is the proposed refinement:`,
        suggestion,
        timestamp: "Just now"
      }
    ]);
  };

  // Suggestion actions
  const handleAcceptSuggestion = (messageId, suggestion) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, suggestionState: 'accepted' } : m));

    if (suggestion.isNewElement && suggestion.newElementData) {
      setClaimChart(prev => [...prev, suggestion.newElementData]);
      setRecentlyUpdatedId(suggestion.newElementData.id);
      setTimeout(() => setRecentlyUpdatedId(null), 2500);
      setMessages(prev => [
        ...prev,
        {
          id: `msg-sys-${Date.now()}`,
          sender: 'system',
          text: `✓ Accepted: Added new claim element (${suggestion.newElementData.label}) to the claim chart.`,
          timestamp: "Just now"
        }
      ]);
      showToast(`Added ${suggestion.newElementData.label} to Claim Chart`);
      return;
    }

    setClaimChart(prev => prev.map(el => {
      if (el.id === suggestion.elementId) {
        return {
          ...el,
          accusedFeature: suggestion.accusedFeature,
          aiReasoning: suggestion.aiReasoning,
          status: suggestion.status || el.status,
          history: [...(el.history || []), { accusedFeature: el.accusedFeature, aiReasoning: el.aiReasoning, status: el.status }]
        };
      }
      return el;
    }));

    setRecentlyUpdatedId(suggestion.elementId);
    setTimeout(() => setRecentlyUpdatedId(null), 2500);

    setMessages(prev => [
      ...prev,
      {
        id: `msg-sys-${Date.now()}`,
        sender: 'system',
        text: `✓ Accepted: Applied updates to ${suggestion.label || `Element ${suggestion.elementNumber}`}. Prior version saved to history.`,
        timestamp: "Just now"
      }
    ]);
    showToast(`Updated ${suggestion.label || `Element ${suggestion.elementNumber}`} in claim chart`);
  };

  const handleRejectSuggestion = (messageId, suggestion) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, suggestionState: 'rejected' } : m));
    setMessages(prev => [
      ...prev,
      {
        id: `msg-sys-${Date.now()}`,
        sender: 'system',
        text: `✕ Rejected suggestion for ${suggestion.label || `Element ${suggestion.elementNumber}`}. Claim chart unchanged.`,
        timestamp: "Just now"
      }
    ]);
  };

  const handleModifySuggestion = (messageId, suggestion) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, suggestionState: 'modified' } : m));
    setChatInput(`For ${suggestion.label || `Element ${suggestion.elementNumber}`}, adjust the reasoning to: `);
    chatInputRef.current?.focus();
  };

  // Edge Case 3: Submit supplemental doc in chat
  const handleSubmitSupplementalDoc = (messageId, docInput, topic) => {
    const isUrl = docInput.startsWith('http://') || docInput.startsWith('https://');
    const newDoc = { id: `doc-${Date.now()}`, name: docInput, type: isUrl ? 'url' : 'pdf', size: isUrl ? 'Web' : '2.1 MB' };
    setUploadedDocs(prev => [...prev, newDoc]);

    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, missingEvidenceState: null } : m));

    const lower = docInput.toLowerCase();
    const isFound = lower.includes("sensor") || lower.includes("spec") || lower.includes("hardware") || lower.includes("sheet") || lower.includes("technical");

    if (isFound) {
      const suggestion = {
        isNewElement: true,
        newElementData: {
          id: `el-${claimChart.length + 1}`,
          elementNumber: `${claimChart.length + 1}`,
          label: `Claim 1 [Limitation 1.d - Sensor Array]`,
          claimElement: "a temperature sensor array disposed within the housing, comprising a plurality of calibrated thermistors configured to sample ambient thermal gradients;",
          accusedFeature: `[From uploaded: ${docInput}, Sheet 4]: "Acme Pro housing includes a 3-point thermistor sensor array across top and bottom bezel to eliminate PCB self-heating bias."`,
          aiReasoning: `The uploaded specification confirms the Acme Thermostat incorporates a multi-point thermistor sensor array located within the device housing. The sensor array measures ambient thermal gradients while compensating for internal heat dissipation, meeting all limitations of the sensor array limitation.`,
          status: "confirmed",
          history: [],
          keywords: ["sensor", "sensor array", "temperature sensor", "thermistor", "gradient", "ambient"]
        },
        explanation: `Extracted explicit technical corroboration from newly uploaded document '${docInput}' (Sheet 4), establishing literal support for the temperature sensor array limitation.`
      };

      setMessages(prev => [
        ...prev,
        {
          id: `msg-ai-${Date.now()}`,
          sender: 'ai',
          text: `Evidence found! I indexed **"${docInput}"** and identified corroboration for "${topic}" in Sheet 4.\n\nHere is the proposed new claim chart element:`,
          suggestion,
          timestamp: "Just now"
        }
      ]);
      showToast(`Evidence indexed from "${docInput}"`);
    } else {
      const targetEl = findElement(topic, claimChart, lastRefinedElementId);
      if (targetEl) {
        setClaimChart(prev => prev.map(el => el.id === targetEl.id ? { ...el, status: 'unsupported' } : el));
        setRecentlyUpdatedId(targetEl.id);
        setTimeout(() => setRecentlyUpdatedId(null), 2500);
      }

      setMessages(prev => [
        ...prev,
        {
          id: `msg-ai-${Date.now()}`,
          sender: 'ai',
          text: `**Evidence Still Not Found**: I thoroughly analyzed **"${docInput}"**, but it does not disclose or corroborate "${topic}".\n\nPer conservative analysis rules, this limitation has been marked as **"unsupported"** and flagged for manual discovery. No further speculation will be performed.`,
          timestamp: "Just now"
        }
      ]);
      showToast(`Flagged as unsupported — manual research required`);
    }
  };

  // Word Export simulation & real file download
  const handleExportWord = () => {
    const rowsHtml = claimChart.map(row => `
      <tr>
        <td style="padding:8px; border:1px solid #cbd5e1; width:28%; vertical-align:top;">
          <strong>${row.label || "Element " + row.elementNumber}</strong><br/>
          <span style="font-size:11px; font-weight:bold; color:${row.status === 'confirmed' ? '#16a34a' : row.status === 'weak' ? '#d97706' : '#dc2626'}">
            [${row.status.toUpperCase()}]
          </span><br/><br/>
          ${row.claimElement}
        </td>
        <td style="padding:8px; border:1px solid #cbd5e1; width:36%; vertical-align:top; white-space:pre-wrap;">
          ${row.accusedFeature}
        </td>
        <td style="padding:8px; border:1px solid #cbd5e1; width:36%; vertical-align:top; white-space:pre-wrap;">
          ${row.aiReasoning}
        </td>
      </tr>
    `).join("");

    const fullHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>iLumos Claim Chart</title></head>
      <body style="font-family:Arial, sans-serif;">
        <h2 style="color:#1e293b;">iLumos AI Claim Chart Refinement Report</h2>
        <p><strong>Patent:</strong> US 10,489,122 B2 | <strong>Accused:</strong> Acme Smart Thermostat Pro | <strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Strategy:</strong> <em>"${systemPrompt}"</em></p>
        <p><strong>Sources:</strong> ${uploadedDocs.map(d => d.name).join(", ")}</p>
        <table style="width:100%; border-collapse:collapse; margin-top:16px;">
          <thead>
            <tr style="background-color:#1e293b; color:white;">
              <th style="padding:8px; border:1px solid #334155; text-align:left;">Patent Claim Element</th>
              <th style="padding:8px; border:1px solid #334155; text-align:left;">Accused Product Feature (Evidence)</th>
              <th style="padding:8px; border:1px solid #334155; text-align:left;">AI Legal Reasoning & Mapping</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <p style="margin-top:24px; font-size:10pt; color:#64748b; font-style:italic;">CONFIDENTIAL — ATTORNEY WORK PRODUCT</p>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iLumos_Claim_Chart_US10489122B2_${new Date().toISOString().slice(0, 10)}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("Exported claim_chart_refined.docx (accepted edits preserved)");
  };

  const filteredChart = claimChart.filter(el => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return el.claimElement.toLowerCase().includes(term) || el.accusedFeature.toLowerCase().includes(term) || el.aiReasoning.toLowerCase().includes(term);
  });

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
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto w-full space-y-8 my-auto">
            {/* Header Branding */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-medium uppercase">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                iLumos Legal AI Platform • Prototype
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                Claim Chart <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200">Refinement Copilot</span>
              </h1>
              <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
                Refine AI-generated patent claim charts through conversation with strict human-in-the-loop control, wrong-evidence correction, single-step rollback, and missing-evidence handling.
              </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Chart File */}
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100 text-sm">1. Patent Claim Chart</h3>
                      <p className="text-xs text-slate-400">Pre-seeded smart thermostat claim chart</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Ready ({claimChart.length} Elements)
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-200">{chartFileName}</p>
                      <p className="text-[11px] text-slate-400">Patent: US 10,489,122 B2 • Smart Thermostat</p>
                    </div>
                  </div>
                  <label className="cursor-pointer text-xs font-medium text-indigo-400 hover:text-indigo-300 underline">
                    Change File
                    <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && setChartFileName(e.target.files[0].name)} />
                  </label>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {claimChart.map(el => (
                    <div key={el.id} className="text-xs p-2 rounded bg-slate-950/40 border border-slate-800/80 flex items-center justify-between">
                      <span className="font-mono text-indigo-300 mr-2">[{el.elementNumber}]</span>
                      <span className="text-slate-300 truncate flex-1">{el.claimElement}</span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ml-2 shrink-0 ${el.status === 'confirmed' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                        {el.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Accused Docs */}
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100 text-sm">2. Accused Product Evidence</h3>
                      <p className="text-xs text-slate-400">Indexed technical docs and product URLs</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {uploadedDocs.length} Sources
                  </span>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {uploadedDocs.map(doc => (
                    <div key={doc.id} className="p-2 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between group">
                      <div className="flex items-center gap-2 text-xs truncate">
                        {doc.type === 'url' ? <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" /> : <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        <span className="text-slate-200 truncate">{doc.name}</span>
                      </div>
                      <button onClick={() => setUploadedDocs(uploadedDocs.filter(d => d.id !== doc.id))} className="text-slate-500 hover:text-rose-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {showAddDocForm ? (
                  <div className="flex gap-2 pt-1 border-t border-slate-800">
                    <input
                      type="text"
                      value={newDocInput}
                      onChange={(e) => setNewDocInput(e.target.value)}
                      placeholder="e.g. Acme_Specs_Rev4.pdf or URL..."
                      className="flex-1 text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => {
                        if (newDocInput.trim()) {
                          const isUrl = newDocInput.startsWith("http");
                          setUploadedDocs([...uploadedDocs, { id: `doc-${Date.now()}`, name: newDocInput.trim(), type: isUrl ? 'url' : 'pdf', size: '1.5 MB' }]);
                          setNewDocInput('');
                          setShowAddDocForm(false);
                        }
                      }}
                      className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowAddDocForm(true)} className="w-full py-1.5 border border-dashed border-slate-700 hover:border-slate-600 rounded-lg text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add Document or URL
                  </button>
                )}

                <div className="flex items-start gap-2 p-2 rounded bg-indigo-950/30 border border-indigo-900/50 text-[11px] text-indigo-300">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
                  <span><strong>Design Note:</strong> Seeded docs omit "sensor array" to enable immediate testing of Edge Case 3 (Missing Evidence).</span>
                </div>
              </div>
            </div>

            {/* Strategy / System Prompt */}
            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-slate-100 text-sm">3. System Prompt & Analysis Instructions</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {PROMPT_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => setSystemPrompt(preset.prompt)}
                    className={`text-xs px-2.5 py-1 rounded border transition ${systemPrompt === preset.prompt ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}`}
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={2}
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Start Session */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Target: Acme Smart Thermostat Pro
              </span>
              <button
                onClick={() => setCurrentScreen('workspace')}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition"
              >
                <span>Start Session</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen 2: Main Workspace */}
      {currentScreen === 'workspace' && (
        <div className="flex flex-col h-screen overflow-hidden">
          {/* Header */}
          <header className="h-14 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentScreen('setup')} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white p-1 rounded hover:bg-slate-900">
                <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Setup</span>
              </button>
              <div className="h-4 w-[1px] bg-slate-800" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">iL</div>
                <div>
                  <span className="font-bold text-sm text-white">iLumos</span>
                  <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 font-mono border border-indigo-800/50">US 10,489,122 B2</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={() => setShowDocsModal(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800">
                <BookOpen className="w-3.5 h-3.5 text-sky-400" /> <span className="hidden sm:inline">{uploadedDocs.length} Docs</span>
              </button>
              <button onClick={() => setShowPromptModal(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" /> <span className="hidden sm:inline">Strategy</span>
              </button>
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${canUndo ? 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-indigo-500/40 cursor-pointer' : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'}`}
                title="Single-step rollback"
              >
                <RotateCcw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Undo</span>
              </button>
              <button
                onClick={handleExportWord}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition cursor-pointer"
              >
                <FileDown className="w-4 h-4" /> <span>Export to Word</span>
              </button>
            </div>
          </header>

          {/* Workspace Body */}
          <main className="flex-1 flex flex-col lg:flex-row overflow-hidden p-3 gap-3 bg-slate-950">
            {/* Left 3-Column Chart */}
            <div className="w-full lg:w-[58%] h-1/2 lg:h-full flex flex-col bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold text-white">3-Column Claim Chart</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {claimChart.filter(c => c.status === 'confirmed').length} Confirmed
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {claimChart.filter(c => c.status === 'weak').length} Weak
                  </span>
                  {claimChart.filter(c => c.status === 'unsupported').length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {claimChart.filter(c => c.status === 'unsupported').length} Unsupported
                    </span>
                  )}
                </div>
              </div>

              {/* Search */}
              <div className="px-3 py-1.5 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter elements..."
                  className="w-full bg-transparent text-xs text-slate-200 focus:outline-none"
                />
              </div>

              {/* Table */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-950 text-slate-300 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3 w-[28%] border-r border-slate-800">1. Patent Claim Element</th>
                      <th className="p-3 w-[36%] border-r border-slate-800">2. Accused Product Feature (Evidence)</th>
                      <th className="p-3 w-[36%]">3. AI Legal Reasoning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredChart.map((el) => {
                      const isHighlighted = recentlyUpdatedId === el.id;
                      const hasHistory = el.history && el.history.length > 0;
                      return (
                        <tr key={el.id} className={`transition-colors duration-500 ${isHighlighted ? 'bg-indigo-950/40 ring-1 ring-indigo-500/50' : 'hover:bg-slate-800/30'}`}>
                          <td className="p-3 align-top border-r border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-indigo-300 bg-indigo-950 px-1 py-0.5 rounded text-[10px]">
                                {el.label || `Element ${el.elementNumber}`}
                              </span>
                              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full border ${el.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : el.status === 'weak' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                                {el.status}
                              </span>
                            </div>
                            <p className="text-slate-200 leading-relaxed">{el.claimElement}</p>
                            <div className="flex items-center justify-between pt-1 border-t border-slate-800/50 text-[10px]">
                              <button
                                onClick={() => {
                                  setChatInput(`Strengthen the evidence for ${el.label || `Element ${el.elementNumber}`}`);
                                  chatInputRef.current?.focus();
                                }}
                                className="text-indigo-400 hover:underline flex items-center gap-1"
                              >
                                <MessageSquare className="w-2.5 h-2.5" /> Refine
                              </button>
                              {hasHistory && <span className="text-sky-400 flex items-center gap-0.5"><History className="w-2.5 h-2.5" /> v{el.history.length + 1}</span>}
                            </div>
                          </td>
                          <td className="p-3 align-top border-r border-slate-800 whitespace-pre-wrap leading-relaxed text-slate-200 bg-slate-950/20">
                            {el.accusedFeature}
                          </td>
                          <td className="p-3 align-top whitespace-pre-wrap leading-relaxed text-slate-300 bg-slate-950/20">
                            {el.aiReasoning}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Chat Panel */}
            <div className="w-full lg:w-[42%] h-1/2 lg:h-full flex flex-col bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold text-white">iLumos Copilot Chat</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Human-in-the-Loop
                </span>
              </div>

              {/* Chat Stream */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="space-y-1.5">
                    {msg.sender === 'user' && (
                      <div className="flex justify-end">
                        <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-3.5 py-2 text-xs max-w-[85%] leading-relaxed shadow">
                          {msg.text}
                        </div>
                      </div>
                    )}

                    {msg.sender === 'ai' && (
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 shrink-0 mt-1">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                        <div className="max-w-[90%] space-y-2.5">
                          {msg.text && (
                            <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                              {msg.text}
                            </div>
                          )}

                          {/* Suggestion Card */}
                          {msg.suggestion && (
                            <div className={`rounded-xl border p-3 space-y-2 text-xs ${msg.suggestionState === 'accepted' ? 'bg-emerald-950/20 border-emerald-500/40' : msg.suggestionState === 'rejected' ? 'bg-slate-950/40 border-slate-800 opacity-60' : 'bg-slate-950 border-indigo-500/50'}`}>
                              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                                <span className="font-mono text-indigo-300 font-semibold">
                                  {msg.suggestion.label || `Element ${msg.suggestion.elementNumber}`}
                                </span>
                                {msg.suggestionState === 'accepted' && <span className="text-emerald-400 font-bold text-[10px]">✓ ACCEPTED</span>}
                                {msg.suggestionState === 'rejected' && <span className="text-slate-400 font-bold text-[10px]">✕ REJECTED</span>}
                                {msg.suggestionState === 'modified' && <span className="text-sky-400 font-bold text-[10px]">↺ MODIFIED</span>}
                                {!msg.suggestionState && <span className="text-amber-400 font-bold text-[10px]">PROPOSAL</span>}
                              </div>

                              {msg.suggestion.explanation && (
                                <p className="text-[11px] text-indigo-200 bg-indigo-950/40 p-2 rounded border border-indigo-900/50">
                                  <strong>What Changed:</strong> {msg.suggestion.explanation}
                                </p>
                              )}

                              {msg.suggestion.accusedFeature && (
                                <div className="space-y-0.5">
                                  <span className="text-[10px] uppercase font-semibold text-slate-400">Proposed Evidence:</span>
                                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-200 whitespace-pre-wrap">{msg.suggestion.accusedFeature}</div>
                                </div>
                              )}

                              {msg.suggestion.aiReasoning && (
                                <div className="space-y-0.5">
                                  <span className="text-[10px] uppercase font-semibold text-slate-400">Proposed Reasoning:</span>
                                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300 whitespace-pre-wrap">{msg.suggestion.aiReasoning}</div>
                                </div>
                              )}

                              {!msg.suggestionState && (
                                <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                                  <button onClick={() => handleRejectSuggestion(msg.id, msg.suggestion)} className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1">
                                    <X className="w-3 h-3 text-rose-400" /> Reject
                                  </button>
                                  <button onClick={() => handleModifySuggestion(msg.id, msg.suggestion)} className="px-2.5 py-1 rounded bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/30 text-[11px] flex items-center gap-1">
                                    <Edit3 className="w-3 h-3" /> Modify
                                  </button>
                                  <button onClick={() => handleAcceptSuggestion(msg.id, msg.suggestion)} className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Accept
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Inline Upload for Edge Case 3 */}
                          {msg.missingEvidenceState && (
                            <div className="bg-slate-950 border border-amber-500/50 rounded-xl p-3 space-y-2 text-xs">
                              <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>No evidence in indexed docs for "{msg.missingEvidenceState.topic}"</span>
                              </div>
                              <p className="text-[11px] text-slate-400">Upload a datasheet or paste a URL below to ground the AI:</p>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={supplementalInput}
                                  onChange={(e) => setSupplementalInput(e.target.value)}
                                  placeholder="e.g. Acme_Sensor_Hardware_Spec.pdf..."
                                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                                />
                                <button
                                  onClick={() => {
                                    if (supplementalInput.trim()) {
                                      handleSubmitSupplementalDoc(msg.id, supplementalInput.trim(), msg.missingEvidenceState.topic);
                                      setSupplementalInput('');
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs"
                                >
                                  Submit
                                </button>
                              </div>
                              <div className="flex gap-1.5 text-[10px] pt-1">
                                <button onClick={() => handleSubmitSupplementalDoc(msg.id, "Acme_Sensor_Hardware_Spec.pdf", msg.missingEvidenceState.topic)} className="px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-800">
                                  + Submit Sensor Spec (Found)
                                </button>
                                <button onClick={() => handleSubmitSupplementalDoc(msg.id, "Marketing_Flyer.pdf", msg.missingEvidenceState.topic)} className="px-2 py-0.5 rounded bg-rose-950/50 text-rose-300 border border-rose-800">
                                  + Submit Other Doc (Not Found)
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {msg.sender === 'system' && (
                      <div className="flex justify-center my-1">
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">
                          {msg.text}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts */}
              <div className="px-3 py-1.5 bg-slate-950/60 border-t border-slate-800 overflow-x-auto whitespace-nowrap flex items-center gap-1.5 text-[11px]">
                <button onClick={() => handleSendMessage("Strengthen the evidence for element 2")} className="px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300">
                  Strengthen Element 2
                </button>
                <button onClick={() => handleSendMessage("The reasoning for the ML algorithm element is weak, add technical detail")} className="px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300">
                  Fix ML Reasoning
                </button>
                <button onClick={() => handleSendMessage("That's wrong, the manual says 5GHz band not just WiFi")} className="px-2.5 py-0.5 rounded-full bg-rose-950/50 hover:bg-rose-900/50 text-rose-300 border border-rose-800">
                  Edge 1: "That's wrong"
                </button>
                <button onClick={() => handleSendMessage("undo last change")} className="px-2.5 py-0.5 rounded-full bg-sky-950/50 hover:bg-sky-900/50 text-sky-300 border border-sky-800">
                  Edge 2: "Undo"
                </button>
                <button onClick={() => handleSendMessage("Add temperature sensor array element")} className="px-2.5 py-0.5 rounded-full bg-amber-950/50 hover:bg-amber-900/50 text-amber-300 border border-amber-800">
                  Edge 3: Sensor Array
                </button>
              </div>

              {/* Chat Input */}
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(chatInput); }} className="p-2.5 bg-slate-950 border-t border-slate-800 flex gap-2">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask iLumos to refine elements, fix citations..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button type="submit" disabled={!chatInput.trim()} className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg transition">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </main>
        </div>
      )}

      {/* Docs Modal */}
      {showDocsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-4 space-y-3 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-sky-400" /> Active Evidence Sources ({uploadedDocs.length})</h3>
              <button onClick={() => setShowDocsModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {uploadedDocs.map(doc => (
                <div key={doc.id} className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="truncate text-slate-200">{doc.name}</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Grounding</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Strategy Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-4 space-y-3 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-emerald-400" /> Active Analysis Strategy</h3>
              <button onClick={() => setShowPromptModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed">
              {systemPrompt}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
