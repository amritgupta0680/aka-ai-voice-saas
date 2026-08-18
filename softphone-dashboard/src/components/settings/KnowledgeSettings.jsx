import React, { useState, useEffect, useCallback } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Database, RefreshCw, Trash2 } from "lucide-react";
import { API_BASE_URL } from "../../config/api";

export function KnowledgeSettings({ activeTenantId }) {
  const [file, setFile] = useState(null);
  const [textPolicy, setTextPolicy] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [knowledgeInfo, setKnowledgeInfo] = useState(null);

  const fetchKnowledgeInfo = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tenants/${activeTenantId}/knowledge/files`);
      if (response.ok) {
        const data = await response.json();
        setKnowledgeInfo(data);
      }
    } catch (err) {
      console.error("Failed to fetch knowledge metadata:", err);
    }
  }, [activeTenantId]);

  useEffect(() => {
    fetchKnowledgeInfo();
  }, [fetchKnowledgeInfo]);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/tenants/${activeTenantId}/knowledge/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setStatusMessage({ type: "success", text: `Indexed successfully! Processed ${data.chunks_indexed} document chunks.` });
        setFile(null);
        fetchKnowledgeInfo();
      } else {
        setStatusMessage({ type: "error", text: data.detail || "Upload failed." });
      }
    } catch (err) {
      setStatusMessage({ type: "error", text: "Connection error. Ensure server is running." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextIndexing = async (e) => {
    e.preventDefault();
    if (!textPolicy.trim()) return;

    setIsUploading(true);
    setStatusMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/tenants/${activeTenantId}/knowledge/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: textPolicy }),
      });

      const data = await response.json();
      if (response.ok) {
        setStatusMessage({ type: "success", text: `Text policies indexed! Processed ${data.chunks_indexed} chunks.` });
        setTextPolicy("");
        fetchKnowledgeInfo();
      } else {
        setStatusMessage({ type: "error", text: data.detail || "Indexing failed." });
      }
    } catch (err) {
      setStatusMessage({ type: "error", text: "Connection error. Ensure server is running." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetKnowledge = async () => {
    if (!window.confirm("Are you sure you want to delete all uploaded knowledge for this tenant?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/tenants/${activeTenantId}/knowledge/reset`, {
        method: "DELETE"
      });
      if (res.ok) {
        setStatusMessage({ type: "success", text: "Knowledge base cleared successfully." });
        fetchKnowledgeInfo();
      }
    } catch (err) {
      console.error("Failed to clear knowledge base:", err);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ backgroundColor: "#1e293b", borderRadius: "0.75rem", padding: "1.5rem", border: "1px solid #334155", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Database size={20} color="#818cf8" /> Active Document Library
          </h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={fetchKnowledgeInfo}
              style={{
                backgroundColor: "#334155",
                color: "#ffffff",
                border: "none",
                borderRadius: "0.375rem",
                padding: "0.375rem 0.75rem",
                fontSize: "0.875rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem"
              }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
            {knowledgeInfo && knowledgeInfo.has_index && (
              <button
                onClick={handleResetKnowledge}
                style={{
                  backgroundColor: "#7f1d1d",
                  color: "#fca5a5",
                  border: "1px solid #991b1b",
                  borderRadius: "0.375rem",
                  padding: "0.375rem 0.75rem",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem"
                }}
              >
                <Trash2 size={14} /> Clear Knowledge
              </button>
            )}
          </div>
        </div>

        {knowledgeInfo && knowledgeInfo.has_index ? (
          <div style={{ backgroundColor: "#0f172a", padding: "1.25rem", borderRadius: "0.5rem", border: "1px solid #334155" }}>
            <p style={{ color: "#34d399", fontWeight: "600", margin: "0 0 1rem 0", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle size={16} /> FAISS Vector Store Active for Tenant: {activeTenantId}
            </p>

            <h4 style={{ fontSize: "0.875rem", color: "#94a3b8", margin: "0 0 0.75rem 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>Indexed Knowledge Files:</h4>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {knowledgeInfo.uploaded_documents && knowledgeInfo.uploaded_documents.length > 0 ? (
                knowledgeInfo.uploaded_documents.map((docName, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      backgroundColor: "#1e293b",
                      border: "1px solid #818cf8",
                      borderRadius: "0.375rem",
                      padding: "0.5rem 0.75rem",
                      fontSize: "0.875rem",
                      color: "#f8fafc"
                    }}
                  >
                    <FileText size={16} color="#818cf8" />
                    <span style={{ fontWeight: "500" }}>{docName}</span>
                  </div>
                ))
              ) : (
                <span style={{ color: "#64748b", fontSize: "0.875rem" }}>Custom Text Knowledge Base Loaded</span>
              )}
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: "#0f172a", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #334155" }}>
            <p style={{ color: "#fbbf24", margin: 0, fontSize: "0.875rem" }}>
              No custom knowledge base indexed yet for this tenant. Upload a file or paste text below to initialize RAG memory.
            </p>
          </div>
        )}
      </div>

      <div style={{ backgroundColor: "#1e293b", borderRadius: "0.75rem", padding: "1.5rem", border: "1px solid #334155" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: "0 0 1.5rem 0" }}>Upload or Add Knowledge Data</h2>

        {statusMessage && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              marginBottom: "1.5rem",
              backgroundColor: statusMessage.type === "success" ? "#064e3b" : "#451a03",
              color: statusMessage.type === "success" ? "#34d399" : "#fbbf24",
              border: `1px solid ${statusMessage.type === "success" ? "#047857" : "#78350f"}`
            }}
          >
            {statusMessage.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span style={{ fontSize: "0.875rem" }}>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleFileUpload} style={{ marginBottom: "2rem", borderBottom: "1px solid #334155", paddingBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Upload size={18} color="#818cf8" /> Upload Policy PDF or TXT File
          </h3>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={(e) => setFile(e.target.files[0])}
              style={{
                flex: 1,
                padding: "0.5rem",
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "0.375rem",
                color: "#94a3b8",
                fontSize: "0.875rem"
              }}
            />
            <button
              type="submit"
              disabled={!file || isUploading}
              style={{
                padding: "0.625rem 1.25rem",
                backgroundColor: !file || isUploading ? "#334155" : "#4f46e5",
                color: "#ffffff",
                border: "none",
                borderRadius: "0.375rem",
                fontWeight: "600",
                cursor: !file || isUploading ? "not-allowed" : "pointer"
              }}
            >
              {isUploading ? "Processing..." : "Upload & Index"}
            </button>
          </div>
        </form>

        <form onSubmit={handleTextIndexing}>
          <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FileText size={18} color="#10b981" /> Or Paste Policy Text
          </h3>
          <textarea
            rows={5}
            value={textPolicy}
            onChange={(e) => setTextPolicy(e.target.value)}
            placeholder="e.g. Working hours: Monday - Saturday 9 AM to 7 PM. Consultation fee: $50..."
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "0.5rem",
              color: "#ffffff",
              fontSize: "0.875rem",
              marginBottom: "1rem",
              boxSizing: "border-box",
              resize: "vertical"
            }}
          />
          <button
            type="submit"
            disabled={!textPolicy.trim() || isUploading}
            style={{
              padding: "0.625rem 1.25rem",
              backgroundColor: !textPolicy.trim() || isUploading ? "#334155" : "#10b981",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.375rem",
              fontWeight: "600",
              cursor: !textPolicy.trim() || isUploading ? "not-allowed" : "pointer"
            }}
          >
            {isUploading ? "Indexing..." : "Save Knowledge Text"}
          </button>
        </form>
      </div>
    </div>
  );
}