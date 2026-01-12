'use client';

import React from 'react';

const FormWrapper = ({ 
  title, 
  subtitle, 
  children, 
  onProceed, 
  isValid = true,
  isLoading = false 
}) => {
  const inputStyle = {
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "16px",
    width: "100%",
    color: "#333333",
    transition: "border-color 0.2s ease",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  };

  const labelStyle = {
    fontSize: "14px",
    fontWeight: "500",
    color: "#4A5568",
    marginBottom: "8px",
    display: "block"
  };

  const buttonStyle = {
    backgroundColor: isValid ? "#274171" : "#9ca3af",
    color: 'white',
    padding: '12px 30px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '500',
    cursor: isValid ? 'pointer' : 'not-allowed',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease'
  };

  return (
    <div className="form-wrapper">
      {/* Form Header */}
      <div className="text-center mb-4">
        <h3 style={{ 
          color: '#2D3748', 
          fontSize: '24px', 
          fontWeight: '600',
          marginBottom: '8px'
        }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ 
            color: '#718096', 
            fontSize: '14px', 
            margin: 0 
          }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Form Content */}
      <div className="form-content" style={{ marginBottom: '30px' }}>
        {children}
      </div>

      {/* Form Actions */}
      <div className="form-actions" style={{
        borderTop: '1px solid #e9ecef',
        paddingTop: '20px',
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
        <button
          style={buttonStyle}
          onClick={onProceed}
          disabled={!isValid || isLoading}
        >
          {isLoading ? 'Processing...' : 'Proceed to Personal Information'}
          {!isLoading && <i className="fa fa-arrow-right"></i>}
        </button>
      </div>
    </div>
  );
};

// Export reusable form field components
export const FormField = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  required = false,
  options = [], // for select fields
  ...props 
}) => {
  const inputStyle = {
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "16px",
    width: "100%",
    color: "#333333",
    transition: "border-color 0.2s ease",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  };

  const labelStyle = {
    fontSize: "14px",
    fontWeight: "500",
    color: "#4A5568",
    marginBottom: "8px",
    display: "block"
  };

  return (
    <div className="form-field" style={{ marginBottom: '20px' }}>
      <label style={labelStyle}>
        {label} {required && <span style={{ color: '#E53E3E' }}>*</span>}
      </label>
      
      {type === 'select' ? (
        <select
          style={inputStyle}
          value={value || ''}
          onChange={onChange}
          {...props}
        >
          <option value="">{placeholder || `Select ${label}`}</option>
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          {...props}
        />
      ) : (
        <input
          style={inputStyle}
          type={type}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          {...props}
        />
      )}
    </div>
  );
};

export default FormWrapper;
