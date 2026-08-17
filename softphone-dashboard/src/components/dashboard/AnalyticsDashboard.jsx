import React, { useState, useEffect, useCallback } from "react";
import { Users, TrendingUp, Calendar, Trash2, PhoneOutgoing } from "lucide-react";
import { KpiCard } from "../common/KpiCard";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

export function AnalyticsDashboard({ activeTenantId }) {
  const [callLogs, setCallLogs] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [logsRes, apptsRes] = await Promise.all([
        fetch(`${API_BASE}/api/logs?tenant_id=${activeTenantId}`),
        fetch(`${API_BASE}/api/appointments?tenant_id=${activeTenantId}`)
      ]);
      if (logsRes.ok) setCallLogs(await logsRes.json());
      if (apptsRes.ok) setAppointments(await apptsRes.json());
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTenantId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchDashboardData();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to delete this appointment?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/appointments/${appointmentId}`, {
        method: "DELETE"
      });
      if (res.ok) fetchDashboardData();
    } catch (err) {
      console.error("Failed to delete appointment:", err);
    }
  };

  const handleTriggerOutbound = async (appt) => {
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${activeTenantId}/outbound/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: appt.patient_name,
          target_time: appt.appointment_time,
          service_type: appt.service_type
        })
      });
      const data = await res.json();
      alert(`[Outbound Engine]: ${data.message}\nOpening Line: "${data.initial_agent_speech}"`);
    } catch (err) {
      console.error("Failed to trigger outbound call:", err);
    }
  };

  const totalCalls = callLogs.length;
  const totalAppointments = appointments.length;
  const avgLeadScore = totalCalls > 0 ? Math.round(callLogs.reduce((acc, curr) => acc + (curr.lead_score || 0), 0) / totalCalls) : 0;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      {/* Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <KpiCard title="Total Handled Calls" value={totalCalls} icon={Users} iconColor="#818cf8" />
        <KpiCard title="Booked Appointments" value={totalAppointments} icon={Calendar} iconColor="#10b981" />
        <KpiCard title="Avg Lead Score" value={`${avgLeadScore}%`} icon={TrendingUp} iconColor="#f59e0b" />
      </div>

      {/* Interactive Appointments Table */}
      <div style={{ backgroundColor: "#1e293b", borderRadius: "0.75rem", border: "1px solid #334155", padding: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: "bold", margin: 0 }}>Booked Appointments & Reservations</h2>
          <button onClick={fetchDashboardData} style={{ padding: "0.375rem 0.75rem", backgroundColor: "#334155", color: "#ffffff", border: "none", borderRadius: "0.375rem", fontSize: "0.875rem", cursor: "pointer" }}>
            Refresh Calendar
          </button>
        </div>

        {isLoading ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: "2rem" }}>Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>No active bookings found for tenant {activeTenantId}.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8" }}>
                  <th style={{ padding: "0.75rem" }}>ID</th>
                  <th style={{ padding: "0.75rem" }}>Customer</th>
                  <th style={{ padding: "0.75rem" }}>Details / Service</th>
                  <th style={{ padding: "0.75rem" }}>Time Slot</th>
                  <th style={{ padding: "0.75rem" }}>Status Control</th>
                  <th style={{ padding: "0.75rem" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.id} style={{ borderBottom: "1px solid #0f172a" }}>
                    <td style={{ padding: "0.75rem", fontWeight: "bold", color: "#818cf8" }}>#{appt.id}</td>
                    <td style={{ padding: "0.75rem", fontWeight: "600" }}>{appt.patient_name}</td>
                    <td style={{ padding: "0.75rem" }}>
                      <span style={{ backgroundColor: "#0f172a", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", border: "1px solid #334155" }}>
                        {appt.service_type}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", color: "#f59e0b", fontWeight: "600" }}>{appt.appointment_time}</td>
                    <td style={{ padding: "0.75rem" }}>
                      <select
                        value={appt.status}
                        onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                        style={{
                          backgroundColor: appt.status === "Confirmed" ? "#064e3b" : appt.status === "Completed" ? "#1e3a8a" : "#7f1d1d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "0.25rem",
                          padding: "0.25rem 0.5rem",
                          fontWeight: "bold",
                          fontSize: "0.75rem",
                          cursor: "pointer"
                        }}
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td style={{ padding: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <button
                        onClick={() => handleTriggerOutbound(appt)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          backgroundColor: "#4f46e5",
                          border: "none",
                          borderRadius: "0.25rem",
                          color: "#ffffff",
                          padding: "0.25rem 0.5rem",
                          cursor: "pointer",
                          fontSize: "0.75rem"
                        }}
                        title="Trigger Automated Reminder Call"
                      >
                        <PhoneOutgoing size={14} /> Outbound
                      </button>
                      <button
                        onClick={() => handleDeleteAppointment(appt.id)}
                        style={{ backgroundColor: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "0.25rem" }}
                        title="Delete Record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Call Logs Table */}
      <div style={{ backgroundColor: "#1e293b", borderRadius: "0.75rem", border: "1px solid #334155", padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: "bold", margin: "0 0 1rem 0" }}>Call Logs & Post-Call Intelligence</h2>
        {isLoading ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: "2rem" }}>Loading call logs...</p>
        ) : callLogs.length === 0 ? (
          <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>No call logs recorded yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8" }}>
                  <th style={{ padding: "0.75rem" }}>Caller ID</th>
                  <th style={{ padding: "0.75rem" }}>Intent Category</th>
                  <th style={{ padding: "0.75rem" }}>Lead Score</th>
                  <th style={{ padding: "0.75rem" }}>Executive Summary</th>
                  <th style={{ padding: "0.75rem" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {callLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid #0f172a" }}>
                    <td style={{ padding: "0.75rem", fontWeight: "600" }}>{log.caller_id || "Web Demo Client"}</td>
                    <td style={{ padding: "0.75rem" }}>
                      <span style={{ backgroundColor: "#0f172a", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", border: "1px solid #334155" }}>
                        {log.intent_category || "General Inquiry"}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.25rem",
                        fontWeight: "bold",
                        backgroundColor: (log.lead_score || 0) >= 70 ? "#064e3b" : "#451a03",
                        color: (log.lead_score || 0) >= 70 ? "#34d399" : "#fbbf24"
                      }}>
                        {log.lead_score || 0}%
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", color: "#cbd5e1", maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {log.summary || "No summary recorded."}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <button
                        onClick={() => setSelectedLog(log)}
                        style={{ padding: "0.25rem 0.5rem", backgroundColor: "#4f46e5", color: "#ffffff", border: "none", borderRadius: "0.25rem", cursor: "pointer", fontSize: "0.75rem" }}
                      >
                        View Transcript
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transcript Drawer Modal */}
      {selectedLog && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 1000 }}>
          <div style={{ width: "100%", maxWidth: "600px", backgroundColor: "#1e293b", borderRadius: "0.75rem", padding: "1.5rem", border: "1px solid #334155", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid #334155", paddingBottom: "0.5rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.125rem" }}>Call Transcript - {selectedLog.caller_id}</h3>
              <button onClick={() => setSelectedLog(null)} style={{ backgroundColor: "#ef4444", color: "#ffffff", border: "none", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", cursor: "pointer" }}>Close</button>
            </div>
            <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "1rem" }}>
              <strong>Summary:</strong> {selectedLog.summary}
            </p>
            <div style={{ backgroundColor: "#090d16", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #1e293b" }}>
              {Array.isArray(selectedLog.transcript) ? (
                selectedLog.transcript.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: "0.75rem", textAlign: item.sender === "user" ? "right" : "left" }}>
                    <span style={{ fontSize: "0.65rem", color: "#64748b", textTransform: "capitalize" }}>{item.sender}</span>
                    <div style={{ display: "inline-block", maxWidth: "80%", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.875rem", backgroundColor: item.sender === "user" ? "#4f46e5" : "#334155", color: "#ffffff", marginTop: "0.25rem" }}>
                      {item.text}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: "#64748b", fontSize: "0.875rem" }}>No formatted transcript array available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}