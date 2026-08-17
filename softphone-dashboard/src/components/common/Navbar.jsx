import React from "react";
import { PhoneCall, LayoutDashboard, Settings, Building } from "lucide-react";

export function Navbar({ activeTab, setActiveTab, activeTenantId, setActiveTenantId }) {
  const tenants = [
    { id: "049e114f-e40a-4e2a-a3e8-07caa56a5ddd", name: "Apex Dental Care" },
    { id: "demo-restaurant-101", name: "Pizza Palace Restaurant" },
    { id: "law-firm-202", name: "Justice & Associates Law" }
  ];

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto 2rem auto", borderBottom: "1px solid #334155", paddingBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>Aka AI Voice SaaS Platform</h1>
          <p style={{ fontSize: "0.875rem", color: "#94a3b8", margin: "0.25rem 0 0 0" }}>Multi-Tenant Autonomous Call Center Engine</p>
        </div>

        {/* Tenant Switcher Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "#1e293b", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #334155" }}>
          <Building size={16} color="#818cf8" />
          <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "600" }}>Tenant:</span>
          <select
            value={activeTenantId}
            onChange={(e) => setActiveTenantId(e.target.value)}
            style={{
              backgroundColor: "#0f172a",
              color: "#ffffff",
              border: "1px solid #334155",
              borderRadius: "0.25rem",
              padding: "0.25rem 0.5rem",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", backgroundColor: "#1e293b", padding: "0.25rem", borderRadius: "0.5rem", border: "1px solid #334155", width: "fit-content" }}>
        <button
          onClick={() => setActiveTab("softphone")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            borderRadius: "0.375rem",
            border: "none",
            backgroundColor: activeTab === "softphone" ? "#4f46e5" : "transparent",
            color: "#ffffff",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          <PhoneCall size={18} /> Softphone
        </button>
        <button
          onClick={() => setActiveTab("dashboard")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            borderRadius: "0.375rem",
            border: "none",
            backgroundColor: activeTab === "dashboard" ? "#4f46e5" : "transparent",
            color: "#ffffff",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          <LayoutDashboard size={18} /> Operations & Calendar
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            borderRadius: "0.375rem",
            border: "none",
            backgroundColor: activeTab === "settings" ? "#4f46e5" : "transparent",
            color: "#ffffff",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          <Settings size={18} /> Knowledge Base
        </button>
      </div>
    </div>
  );
}