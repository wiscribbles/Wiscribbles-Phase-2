"use client";

import React from "react";

// Read-only renderer for filled form data during the notary video call
// It renders a clean, two-column key/value layout for:
// - Step 1 (personal info)
// - Step 2 (document selection + document-specific fields)
// - Step 3 (signature options)
// - Document-specific data from documentForms[documentType]
//
// Props:
// - documentType: string (e.g., 'power-of-attorney')
// - formData: object from utils/formStorage.getFormData()
// - title?: optional title override
const DocumentFormReadOnly = ({ documentType, formData, title }) => {
  const step1 = formData?.step1 || {};
  const step2 = formData?.step2 || {};
  const step3 = formData?.step3 || {};
  const docForms = formData?.documentForms || {};
  const docSpecific = documentType ? (docForms[documentType] || {}) : {};

  const Section = ({ heading, children }) => (
    <div style={{
      background: "#fff",
      border: "1px solid #E2E8F0",
      borderRadius: 8,
      padding: 16,
      marginBottom: 16
    }}>
      <div style={{ fontWeight: 600, fontSize: 14, color: "#2D3748", marginBottom: 12 }}>{heading}</div>
      {children}
    </div>
  );

  const Grid = ({ data }) => {
    const entries = Object.entries(data || {}).filter(([k, v]) => v !== undefined && v !== null && v !== "");
    if (entries.length === 0) {
      return <div style={{ color: "#718096", fontSize: 12 }}>No data available</div>;
    }
    return (
      <div className="row g-2">
        {entries.map(([key, value]) => (
          <div className="col-md-6" key={key}>
            <div style={{
              border: "1px solid #EDF2F7",
              borderRadius: 8,
              padding: 12,
              background: "#F9FAFB"
            }}>
              <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>{formatLabel(key)}</div>
              <div style={{ fontSize: 13, color: "#111827", wordBreak: "break-word" }}>{formatValue(value)}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const formatLabel = (key) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/^./, (s) => s.toUpperCase());
  };

  const formatValue = (value) => {
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  return (
    <div style={{ padding: 16 }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h5 style={{ margin: 0, color: "#1F2937" }}>{title || "Filled Form Details"}</h5>
          {documentType && (
            <small style={{ color: "#6B7280" }}>Document type: {documentType}</small>
          )}
        </div>
      </div>

      <Section heading="Step 1 · Personal Information">
        <Grid data={step1} />
      </Section>

      <Section heading="Step 2 · Document Selection">
        <Grid data={step2} />
      </Section>

      {documentType && (
        <Section heading="Document Specific Fields">
          <Grid data={docSpecific} />
        </Section>
      )}

      <Section heading="Step 3 · Signature & Notarization">
        <Grid data={step3} />
      </Section>
    </div>
  );
};

export default DocumentFormReadOnly;

