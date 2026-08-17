import React from "react";

export function KpiCard({ title, value, icon: Icon, iconColor }) {
  return (
    <div style={{ backgroundColor: "#1e293b", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid #334155" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>{title}</span>
        {Icon && <Icon size={20} color={iconColor} />}
      </div>
      <h3 style={{ fontSize: "1.75rem", fontWeight: "bold", margin: "0.5rem 0 0 0" }}>{value}</h3>
    </div>
  );
}