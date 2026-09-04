import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Check, 
  X, 
  RotateCcw, 
  Edit3, 
  Upload, 
  AlertCircle, 
  FileText, 
  ArrowRight, 
  Bot, 
  User, 
  Clock, 
  CheckCircle2, 
  ShieldAlert,
  Search
} from 'lucide-react';

export default function ChatPanel({
  messages,
  onSendMessage,
  onAcceptSuggestion,
  onRejectSuggestion,
  onModifySuggestion,
  onSubmitSupplementalDoc,
  systemPrompt,
  inputPrefill,
  setInputPrefill,
  activeCase,
  claimChart = []
}) {
  const [inputText, setInputText] = useState('');
  const [supplementalInput, setSupplementalInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sync prefill from props (e.g. from table's "Refine in Chat" or Suggestion "Modify")
  useEffect(() => {
    if (inputPrefill) {
      setInputText(inputPrefill);
      inputRef.current?.focus();
      setInputPrefill('');
    }
  }, [inputPrefill, setInputPrefill]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleQuickPrompt = (promptText) => {
    onSendMessage(promptText);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Chat Panel Header */}
      <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">iLumos Patent Copilot</h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[280px]">
              Human-in-the-Loop Refinement Session
            </p>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 hidden sm:block bg-slate-950 px-2 py-1 rounded border border-slate-800">
          Strategy: <span className="text-indigo-300 font-mono">Conservative</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-2">
            {/* User message */}
            {msg.sender === 'user' && (
              <div className="flex items-start justify-end gap-2.5">
                <div className="max-w-[85%] bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs sm:text-sm shadow-md">
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  <div className="text-[10px] text-indigo-200 mt-1 text-right">
                    {msg.timestamp || "Just now"}
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-indigo-700 border border-indigo-500 flex items-center justify-center text-white shrink-0 text-xs font-semibold">
                  <User className="w-3.5 h-3.5" />
                </div>
              </div>
            )}

            {/* AI message */}
            {msg.sender === 'ai' && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 shrink-0 text-xs shadow-sm">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="max-w-[90%] sm:max-w-[88%] space-y-3">
                  {/* AI text bubble */}
                  {msg.text && (
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 text-xs sm:text-sm text-slate-200 shadow-sm leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </div>
                  )}

                  {/* Suggestion Card */}
                  {msg.suggestion && (
                    <div className={`rounded-xl border transition-all duration-300 overflow-hidden shadow-lg ${
                      msg.suggestionState === 'accepted'
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : msg.suggestionState === 'rejected'
                        ? 'bg-slate-950/40 border-slate-800 opacity-60'
                        : msg.suggestionState === 'modified'
                        ? 'bg-indigo-950/20 border-indigo-500/40'
                        : 'bg-slate-950 border-indigo-500/40 ring-1 ring-indigo-500/20'
                    }`}>
                      {/* Suggestion Card Header */}
                      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                            {msg.suggestion.label || `Element ${msg.suggestion.elementNumber}`}
                          </span>
                          <span className="text-xs font-semibold text-slate-200">
                            Proposed Claim Chart Refinement
                          </span>
                        </div>

                        {/* Stamped badge when action taken */}
                        {msg.suggestionState === 'accepted' && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> Accepted & Applied
                          </span>
                        )}
                        {msg.suggestionState === 'rejected' && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <X className="w-3 h-3" /> Discarded
                          </span>
                        )}
                        {msg.suggestionState === 'modified' && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Edit3 className="w-3 h-3" /> Reopened to Modify
                          </span>
                        )}
                        {!msg.suggestionState && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            Pending Review
                          </span>
                        )}
                      </div>

                      {/* Suggestion Card Content */}
                      <div className="p-3.5 space-y-3 text-xs">
                        {/* What Changed & Why Explanation */}
                        {msg.suggestion.explanation && (
                          <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-lg p-2.5 text-indigo-200 leading-relaxed text-[11px]">
                            <strong className="text-indigo-300">Rationale & Explanation: </strong>
                            {msg.suggestion.explanation}
                          </div>
                        )}

                        {/* Proposed Accused Feature */}
                        {msg.suggestion.accusedFeature && (
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                              Proposed Accused Feature (Evidence):
                            </span>
                            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 whitespace-pre-wrap leading-relaxed">
                              {msg.suggestion.accusedFeature}
                            </div>
                          </div>
                        )}

                        {/* Proposed AI Reasoning */}
                        {msg.suggestion.aiReasoning && (
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                              Proposed AI Legal Reasoning:
                            </span>
                            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 whitespace-pre-wrap leading-relaxed">
                              {msg.suggestion.aiReasoning}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Suggestion Card Actions (Accept / Reject / Modify) */}
                      {!msg.suggestionState && (
                        <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-end gap-2">
                          <button
                            onClick={() => onRejectSuggestion(msg.id, msg.suggestion)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5 text-rose-400" />
                            <span>Reject</span>
                          </button>

                          <button
                            onClick={() => onModifySuggestion(msg.id, msg.suggestion)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Modify</span>
                          </button>

                          <button
                            onClick={() => onAcceptSuggestion(msg.id, msg.suggestion)}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Inline Upload / URL Input (Edge Case 3: Missing Evidence) */}
                  {msg.missingEvidenceState && (
                    <div className="bg-slate-950 border border-amber-500/40 rounded-xl p-3.5 space-y-3 shadow-lg">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Supplemental Evidence Required for "{msg.missingEvidenceState.topic}"</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        The current accused product documentation contains zero disclosure of this limitation. Please upload a supplemental engineering datasheet or paste a technical URL to ground the AI:
                      </p>

                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={supplementalInput}
                            onChange={(e) => setSupplementalInput(e.target.value)}
                            placeholder="e.g. Acme_Sensor_Hardware_Spec.pdf or URL..."
                            className="flex-1 text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            onClick={() => {
                              if (supplementalInput.trim()) {
                                onSubmitSupplementalDoc(msg.id, supplementalInput.trim(), msg.missingEvidenceState.topic);
                                setSupplementalInput('');
                              }
                            }}
                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Submit</span>
                          </button>
                        </div>

                        {/* Quick Test Chips for Edge Case 3 */}
                        <div className="pt-1 flex flex-wrap gap-1.5 text-[10px]">
                          <span className="text-slate-500 self-center">Test Shortcuts:</span>
                          <button
                            onClick={() => {
                              onSubmitSupplementalDoc(msg.id, "Acme_Sensor_Hardware_Spec_Rev3.pdf", msg.missingEvidenceState.topic);
                            }}
                            className="px-2 py-1 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/60 transition"
                          >
                            + Submit Sensor Spec (Found)
                          </button>
                          <button
                            onClick={() => {
                              onSubmitSupplementalDoc(msg.id, "Marketing_Overview_2023.pdf", msg.missingEvidenceState.topic);
                            }}
                            className="px-2 py-1 rounded bg-rose-950/40 text-rose-300 border border-rose-800/40 hover:bg-rose-900/60 transition"
                          >
                            + Submit Unrelated Doc (Not Found)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* System / Notification message */}
            {msg.sender === 'system' && (
              <div className="flex justify-center my-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300">
                  <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                  <span>{msg.text}</span>
                </div>
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Test Prompt Shortcuts */}
      <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/80 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-1.5">
        <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mr-1 shrink-0">
          Try:
        </span>
        <button
          onClick={() => handleQuickPrompt(`Strengthen the evidence for ${claimChart[1]?.label || 'Element 2'}`)}
          className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition shrink-0"
        >
          Strengthen {claimChart[1]?.label ? claimChart[1].label.split('[')[0] : 'Element 2'}
        </button>
        <button
          onClick={() => handleQuickPrompt(`The reasoning for ${claimChart[0]?.label || 'Element 1'} is weak, add more technical detail`)}
          className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition shrink-0"
        >
          Fix {claimChart[0]?.label ? claimChart[0].label.split('[')[0] : 'Element 1'} Reasoning
        </button>
        <button
          onClick={() => {
            const prodSlug = (activeCase?.accusedProduct || "tech-spec").toLowerCase().replace(/[^a-z0-9]+/g, '-');
            handleQuickPrompt(`Strengthen evidence for ${claimChart[1]?.label ? claimChart[1].label.split('[')[0] : 'Element 2'} using https://${prodSlug}.com/technical-datasheet`);
          }}
          className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-950/50 hover:bg-indigo-900/70 text-indigo-300 border border-indigo-500/40 transition shrink-0 flex items-center gap-1"
          title="Test In-Prompt URL Evidence Search"
        >
          <span>🌐</span>
          <span>Refine with URL</span>
        </button>
        <button
          onClick={() => handleQuickPrompt(`That's wrong, ${activeCase?.accusedProduct || 'accused product'} does not disclose this citation`)}
          className="text-[11px] px-2.5 py-1 rounded-full bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition shrink-0"
          title="Test Edge Case 1: Wrong Evidence Correction"
        >
          Edge 1: "That's wrong"
        </button>
        <button
          onClick={() => handleQuickPrompt("undo last change")}
          className="text-[11px] px-2.5 py-1 rounded-full bg-sky-950/40 hover:bg-sky-900/60 text-sky-300 border border-sky-800/40 transition shrink-0"
          title="Test Edge Case 2: Undo Refinement"
        >
          Edge 2: "Undo"
        </button>
        <button
          onClick={() => {
            const isThermostat = (activeCase?.title || "").toLowerCase().includes("thermostat");
            handleQuickPrompt(isThermostat ? "Add temperature sensor array element" : "Add missing ultrasonic depth sensor element");
          }}
          className="text-[11px] px-2.5 py-1 rounded-full bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40 transition shrink-0"
          title="Test Edge Case 3: Missing Evidence Handling"
        >
          Edge 3: Missing Evidence
        </button>
      </div>

      {/* Chat Input Bar */}
      <form onSubmit={handleSubmit} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask iLumos to strengthen evidence, fix reasoning, correct citations..."
          className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className={`p-2.5 rounded-lg transition shrink-0 ${
            inputText.trim()
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md cursor-pointer'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
