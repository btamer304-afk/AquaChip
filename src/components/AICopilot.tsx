/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, FormEvent } from "react";
import { Send, Sparkles, Droplets, CheckCircle, HelpCircle, RefreshCw } from "lucide-react";
import { Message, Zone, TelemetryReading } from "../types";

interface AICopilotProps {
  zones: Zone[];
  telemetry: Record<string, TelemetryReading>;
  activeZoneId: string;
  onTriggerIrrigation: (zoneId: string, durationMinutes: number) => void;
}

export default function AICopilot({
  zones,
  telemetry,
  activeZoneId,
  onTriggerIrrigation,
}: AICopilotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init-1",
      sender: "ai",
      content: `Hello! I am AquaMind's Agronomic AI Co-Pilot. I am loaded with local clay loam and sandy soil parameters, real-time ESP32 node telemetry, and daily Penman-Monteith ET0 models.

I can help you monitor moisture trends, identify pump dry-run risks, or calculate predictive watering schedules. 

Try asking: *"Should I water the North Orchard today?"* or *"Give me a status report."*`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Parse structured action tags out of AI response
  // Tag structure: [ACTION: irrigate zoneId="ZONE_ID" zoneName="ZONE_NAME" duration=15]
  const parseAIAction = (text: string) => {
    const regex = /\[ACTION:\s*irrigate\s+zoneId="([^"]+)"\s+zoneName="([^"]+)"\s+duration=(\d+)\]/i;
    const match = text.match(regex);
    if (match) {
      // Return details and sanitized text
      const cleanText = text.replace(regex, "").trim();
      return {
        cleanText,
        action: {
          type: "irrigate" as const,
          zoneId: match[1],
          zoneName: match[2],
          durationMinutes: parseInt(match[3]),
          approved: false,
        },
      };
    }
    return { cleanText: text, action: undefined };
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "user",
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: inputMessage,
          history: messages.slice(-6), // Send last 3 rounds of context
          telemetry,
          zones,
          activeZoneId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with AI server");
      }

      const data = await response.json();
      const { cleanText, action } = parseAIAction(data.text);

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        content: cleanText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        action,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        sender: "ai",
        content: `I'm having trouble syncing with the primary model framework at the moment. Please check local connectivity and retry.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAction = (msgId: string, zoneId: string, duration: number) => {
    onTriggerIrrigation(zoneId, duration);

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId && m.action) {
          return {
            ...m,
            action: { ...m.action, approved: true },
          };
        }
        return m;
      })
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs flex flex-col h-[520px] overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 px-4 py-3.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/20 rounded-lg">
            <Sparkles className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">AI Agronomic Copilot</h3>
            <span className="text-[10px] text-slate-400 font-mono">Model: gemini-3.5-flash | RAG Active</span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[9px] font-semibold text-emerald-300 uppercase tracking-wider font-mono">Live</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-xs leading-relaxed ${
                msg.sender === "user"
                  ? "bg-slate-900 text-white rounded-tr-none"
                  : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
              }`}
            >
              <div className="whitespace-pre-line">{msg.content}</div>

              {/* Parsed Action Card (Human-in-the-loop) */}
              {msg.action && (
                <div className="mt-4 border border-cyan-100 bg-cyan-50/50 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-cyan-900">
                  <div className="flex items-start gap-2">
                    <Droplets className="h-4 w-4 shrink-0 mt-0.5 text-cyan-600 animate-bounce" />
                    <div>
                      <span className="font-bold text-xs">Irrigate Suggestion Approved?</span>
                      <p className="text-[10px] text-cyan-800/85">
                        Water <strong>{msg.action.zoneName}</strong> for <strong>{msg.action.durationMinutes} min</strong>.
                      </p>
                    </div>
                  </div>
                  {msg.action.approved ? (
                    <span className="flex items-center gap-1 bg-cyan-100 border border-cyan-200 text-cyan-800 px-3 py-1 rounded-lg text-[10px] font-bold self-end sm:self-auto">
                      <CheckCircle className="h-3 w-3" />
                      Command Sent
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApproveAction(msg.id, msg.action!.zoneId, msg.action!.durationMinutes)}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition self-end sm:self-auto active:scale-95"
                    >
                      Approve Action
                    </button>
                  )}
                </div>
              )}
            </div>
            <span className="text-[9px] text-gray-400 mt-1 font-mono px-1">{msg.timestamp}</span>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500 font-mono text-[10px] pl-1.5">
            <RefreshCw className="h-3 w-3 animate-spin text-emerald-600" />
            Analyzing sensor array and assembling recommendation...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 bg-white flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask AI Copilot to analyze moisture or trigger pumps..."
          className="flex-1 bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:outline-hidden text-xs rounded-xl px-4 py-2.5 text-gray-800"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-slate-900 hover:bg-slate-800 text-white p-2.5 rounded-xl flex items-center justify-center transition shrink-0"
          disabled={isLoading || !inputMessage.trim()}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
