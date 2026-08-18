import React, { useState } from "react";
import { Navbar } from "./components/common/Navbar";
import { SoftphoneConsole } from "./components/softphone/SoftphoneConsole";
import { AnalyticsDashboard } from "./components/dashboard/AnalyticsDashboard";
import { KnowledgeSettings } from "./components/settings/KnowledgeSettings";
import { useVoiceCall } from "./hooks/useVoiceCall";
import { Building2, Stethoscope, UtensilsCrossed, Scale, ArrowRight } from "lucide-react";

const AVAILABLE_TENANTS = [
  {
    id: "demo-restaurant-101",
    name: "Pizza Palace Restaurant",
    domain: "Food & Hospitality",
    icon: UtensilsCrossed,
    color: "#f59e0b",
    desc: "Autonomous table bookings, menu inquiries, and delivery assistance."
  },
  {
    id: "049e114f-e40a-4e2a-a3e8-07caa56a5ddd",
    name: "Apex Dental Care",
    domain: "Healthcare & Clinic",
    icon: Stethoscope,
    color: "#38bdf8",
    desc: "Dental checkup reservations, procedure policies, and patient triage."
  },
  {
    id: "law-firm-202",
    name: "Justice & Associates Law",
    domain: "Legal Services",
    icon: Scale,
    color: "#a855f7",
    desc: "Client intake, legal consultation scheduling, and attorney routing."
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState("softphone");
  const [activeTenantId, setActiveTenantId] = useState(null);

  // Bind active tenant dynamically to voice hook
  const voiceCall = useVoiceCall(activeTenantId || "demo-restaurant-101");

  // Switch workspace and ensure clean voice hook reset
  const handleTenantChange = (tenantId) => {
    if (voiceCall.callStatus !== "disconnected") {
      voiceCall.endCall();
    }
    setActiveTenantId(tenantId);
    setActiveTab("softphone");
  };

  // LANDING SCREEN: Select Tenant First
  if (!activeTenantId) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc", fontFamily: "sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
        <div style={{ maxWidth: "850px", width: "100%", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", backgroundColor: "#1e293b", padding: "0.5rem 1rem", borderRadius: "9999px", border: "1px solid #334155", marginBottom: "1rem" }}>
            <Building2 size={16} color="#818cf8" />
            <span style={{ fontSize: "0.875rem", color: "#94a3b8", fontWeight: "600" }}>Enterprise SaaS Multi-Tenant Gateway</span>
          </div>

          <h1 style={{ fontSize: "2.25rem", fontWeight: "bold", margin: "0 0 0.75rem 0" }}>Select Business Tenant Workspace</h1>
          <p style={{ color: "#94a3b8", fontSize: "1rem", margin: "0 0 2.5rem 0" }}>
            Choose a business account to load its isolated agent persona, FAISS knowledge base, and live operations CRM.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.25rem", textAlign: "left" }}>
            {AVAILABLE_TENANTS.map((tenant) => {
              const IconComponent = tenant.icon;
              return (
                <div
                  key={tenant.id}
                  onClick={() => handleTenantChange(tenant.id)}
                  style={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "0.75rem",
                    padding: "1.5rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = tenant.color)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#334155")}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <div style={{ backgroundColor: "#0f172a", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #334155" }}>
                        <IconComponent size={24} color={tenant.color} />
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "bold", textTransform: "uppercase" }}>{tenant.domain}</span>
                    </div>

                    <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", margin: "0 0 0.5rem 0", color: "#f8fafc" }}>{tenant.name}</h3>
                    <p style={{ fontSize: "0.875rem", color: "#94a3b8", lineHeight: "1.4", margin: 0 }}>{tenant.desc}</p>
                  </div>

                  <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", color: tenant.color, fontWeight: "600", fontSize: "0.875rem" }}>
                    Launch Workspace <ArrowRight size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE WORKSPACE
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc", fontFamily: "sans-serif", padding: "1.5rem" }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeTenantId={activeTenantId}
        setActiveTenantId={handleTenantChange}
      />

      {activeTab === "softphone" && (
        <SoftphoneConsole 
          voiceCall={voiceCall} 
          activeTenantId={activeTenantId} 
        />
      )}

      {activeTab === "dashboard" && (
        <AnalyticsDashboard 
          activeTenantId={activeTenantId} 
        />
      )}

      {activeTab === "settings" && (
        <KnowledgeSettings 
          activeTenantId={activeTenantId} 
        />
      )}
    </div>
  );
}