import React from "react";
import { Mic, Volume2, Radio, Phone, PhoneOff } from "lucide-react";

const AGENT_NAMES = {
  "049e114f-e40a-4e2a-a3e8-07caa56a5ddd": "Dr. Ava Receptionist",
  "demo-restaurant-101": "Chef Marco Host",
  "law-firm-202": "Counsel Assistant"
};

export function SoftphoneConsole({ voiceCall, activeTenantId }) {
  const { callStatus, isSpeaking, isAgentReplying, transcripts, startCall, endCall } = voiceCall;
  const isConnected = callStatus === "connected";
  const agentTitle = AGENT_NAMES[activeTenantId] || "AI Phone Assistant";

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#1e293b", borderRadius: "1rem", border: "1px solid #334155", padding: "1.5rem" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>{agentTitle}</h2>
          <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0.25rem 0 0 0" }}>Live Web-RTC Voice Engine</p>
        </div>
        <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: isConnected ? "#34d399" : "#f87171", textTransform: "uppercase" }}>
          ● {callStatus}
        </span>
      </div>

      {/* Dynamic Visual Speaking / Listening Status Indicator Bar */}
      {isConnected && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          padding: "0.5rem 1rem",
          borderRadius: "0.5rem",
          marginBottom: "1rem",
          backgroundColor: isSpeaking ? "#1e3a8a" : isAgentReplying ? "#064e3b" : "#0f172a",
          border: `1px solid ${isSpeaking ? "#3b82f6" : isAgentReplying ? "#10b981" : "#334155"}`,
          transition: "all 0.3s ease"
        }}>
          {isSpeaking ? (
            <>
              <Mic size={18} color="#60a5fa" />
              <span style={{ color: "#93c5fd", fontSize: "0.875rem", fontWeight: "600" }}>You are speaking...</span>
            </>
          ) : isAgentReplying ? (
            <>
              <Volume2 size={18} color="#34d399" />
              <span style={{ color: "#a7f3d0", fontSize: "0.875rem", fontWeight: "600" }}>{agentTitle} is speaking...</span>
            </>
          ) : (
            <>
              <Radio size={18} color="#94a3b8" />
              <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Agent is listening to you...</span>
            </>
          )}
        </div>
      )}

      {/* Transcript Log Container */}
      <div style={{ height: "320px", backgroundColor: "#0f172a", borderRadius: "0.5rem", padding: "1rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", border: "1px solid #334155", marginBottom: "1.5rem" }}>
        {transcripts.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b", fontSize: "0.875rem" }}>
            Click "Start Call" to begin voice conversation.
          </div>
        ) : (
          transcripts.map((t, idx) => (
            <div key={idx} style={{ alignSelf: t.sender === "user" ? "flex-end" : "flex-start", maxWidth: "80%" }}>
              <span style={{ fontSize: "0.65rem", color: "#64748b", textTransform: "capitalize", display: "block" }}>{t.sender}</span>
              <div style={{ backgroundColor: t.sender === "user" ? "#4f46e5" : "#334155", color: "#ffffff", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.875rem", marginTop: "0.2rem" }}>
                {t.text}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Call Action Button */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        {!isConnected ? (
          <button onClick={startCall} style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "#10b981", color: "#ffffff", border: "none", borderRadius: "9999px", padding: "0.75rem 2rem", fontWeight: "bold", cursor: "pointer", fontSize: "1rem" }}>
            <Phone size={20} /> Start Call
          </button>
        ) : (
          <button onClick={endCall} style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "#ef4444", color: "#ffffff", border: "none", borderRadius: "9999px", padding: "0.75rem 2rem", fontWeight: "bold", cursor: "pointer", fontSize: "1rem" }}>
            <PhoneOff size={20} /> End Call
          </button>
        )}
      </div>
    </div>
  );
}