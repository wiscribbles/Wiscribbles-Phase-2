//not being used additional component used earlier

'use client';

import React, { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

/**
 * FieldRenderer - Renders individual form fields based on type
 * Supports all field types defined in documentTypes.js configuration
 */
const FieldRenderer = ({
  field,
  value,
  onChange,
  error,
  isNotaryMode = false,
  isEditable = true,
  methods,
  formData,
  isCompact = false
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const signatureRef = useRef();

  if (!field) return null;

  // Base styles
  const baseInputStyle = {
    width: '100%',
    padding: isCompact ? '8px 12px' : '12px 16px',
    border: '2px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: isCompact ? '14px' : '16px',
    backgroundColor: !isEditable ? '#F7FAFC' : '#FFFFFF',
    color: !isEditable ? '#A0AEC0' : '#2D3748',
    cursor: !isEditable ? 'not-allowed' : 'text',
    transition: 'all 0.2s ease',
    outline: 'none'
  };

  const errorInputStyle = {
    ...baseInputStyle,
    borderColor: '#E53E3E',
    backgroundColor: '#FED7D7'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: isCompact ? '4px' : '6px',
    fontSize: isCompact ? '13px' : '14px',
    fontWeight: '600',
    color: '#2D3748',
    lineHeight: '1.4'
  };

  const errorStyle = {
    color: '#E53E3E',
    fontSize: '12px',
    marginTop: '4px',
    fontWeight: '500'
  };

  // Handle signature clearing
  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      onChange('');
    }
  };

  // Handle signature saving
  const saveSignature = () => {
    if (signatureRef.current) {
      const dataURL = signatureRef.current.getTrimmedCanvas().toDataURL('image/png');
      onChange(dataURL);
    }
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (field.validation?.maxFileSize && file.size > field.validation.maxFileSize) {
        // Show error for file too large
        return;
      }
      
      if (field.validation?.allowedTypes && !field.validation.allowedTypes.includes(file.type)) {
        // Show error for invalid file type
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        onChange({
          name: file.name,
          size: file.size,
          type: file.type,
          data: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Render different field types
  const renderField = () => {
    const inputStyle = error ? errorInputStyle : baseInputStyle;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <input
            type={field.type === 'phone' ? 'tel' : field.type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={!isEditable}
            style={inputStyle}
            maxLength={field.validation?.maxLength}
            pattern={field.validation?.pattern}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={!isEditable}
            style={inputStyle}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={!isEditable}
            style={{
              ...inputStyle,
              minHeight: isCompact ? '80px' : '120px',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
            maxLength={field.validation?.maxLength}
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={!isEditable}
            style={{
              ...inputStyle,
              cursor: !isEditable ? 'not-allowed' : 'pointer'
            }}
          >
            <option value="">{field.placeholder || 'Select an option'}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div style={{ display: 'flex', flexDirection: isCompact ? 'row' : 'column', gap: isCompact ? '15px' : '10px' }}>
            {field.options?.map(option => (
              <label key={option.value} style={{
                display: 'flex',
                alignItems: 'center',
                cursor: !isEditable ? 'not-allowed' : 'pointer',
                fontSize: isCompact ? '13px' : '14px',
                color: !isEditable ? '#A0AEC0' : '#2D3748'
              }}>
                <input
                  type="radio"
                  name={field.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={!isEditable}
                  style={{
                    marginRight: '8px',
                    cursor: !isEditable ? 'not-allowed' : 'pointer'
                  }}
                />
                {option.label}
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {field.options?.map(option => (
              <label key={option.value} style={{
                display: 'flex',
                alignItems: 'center',
                cursor: !isEditable ? 'not-allowed' : 'pointer',
                fontSize: isCompact ? '13px' : '14px',
                color: !isEditable ? '#A0AEC0' : '#2D3748'
              }}>
                <input
                  type="checkbox"
                  value={option.value}
                  checked={Array.isArray(value) ? value.includes(option.value) : false}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      onChange([...currentValues, option.value]);
                    } else {
                      onChange(currentValues.filter(v => v !== option.value));
                    }
                  }}
                  disabled={!isEditable}
                  style={{
                    marginRight: '8px',
                    cursor: !isEditable ? 'not-allowed' : 'pointer'
                  }}
                />
                {option.label}
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={!isEditable}
            style={inputStyle}
            min={field.validation?.minDate}
            max={field.validation?.maxDate}
          />
        );

      case 'file':
        return (
          <div>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={!isEditable}
              accept={field.validation?.allowedTypes?.join(',')}
              style={{
                ...inputStyle,
                padding: isCompact ? '6px' : '8px',
                cursor: !isEditable ? 'not-allowed' : 'pointer'
              }}
            />
            {value && (
              <div style={{
                marginTop: '8px',
                padding: '8px',
                backgroundColor: '#F7FAFC',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#4A5568'
              }}>
                <strong>Uploaded:</strong> {value.name} ({Math.round(value.size / 1024)}KB)
              </div>
            )}
          </div>
        );

      case 'signature':
        return (
          <div style={{
            border: error ? '2px solid #E53E3E' : '2px solid #E2E8F0',
            borderRadius: '8px',
            padding: isCompact ? '10px' : '15px',
            backgroundColor: !isEditable ? '#F7FAFC' : '#FFFFFF'
          }}>
            {!isEditable && value ? (
              <div style={{ textAlign: 'center' }}>
                <img src={value} alt="Signature" style={{
                  maxWidth: '100%',
                  maxHeight: isCompact ? '80px' : '120px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '4px'
                }} />
                <p style={{ fontSize: '12px', color: '#718096', marginTop: '8px', margin: 0 }}>
                  Signed by {isNotaryMode ? 'User' : 'Notary'}
                </p>
              </div>
            ) : (
              <>
                <SignatureCanvas
                  ref={signatureRef}
                  penColor="black"
                  canvasProps={{
                    width: isCompact ? 300 : 400,
                    height: isCompact ? 80 : 120,
                    className: 'signature-canvas',
                    style: { border: '1px solid #E2E8F0', borderRadius: '4px' }
                  }}
                  onEnd={saveSignature}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px'
                }}>
                  <button
                    type="button"
                    onClick={clearSignature}
                    style={{
                      background: 'none',
                      border: '1px solid #CBD5E0',
                      borderRadius: '4px',
                      padding: '4px 12px',
                      fontSize: '12px',
                      color: '#4A5568',
                      cursor: 'pointer'
                    }}
                  >
                    Clear
                  </button>
                  <span style={{ fontSize: '12px', color: '#718096' }}>
                    Sign above
                  </span>
                </div>
              </>
            )}
          </div>
        );

      case 'boolean':
        return (
          <label style={{
            display: 'flex',
            alignItems: 'center',
            cursor: !isEditable ? 'not-allowed' : 'pointer',
            fontSize: isCompact ? '13px' : '14px',
            color: !isEditable ? '#A0AEC0' : '#2D3748'
          }}>
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              disabled={!isEditable}
              style={{
                marginRight: '10px',
                cursor: !isEditable ? 'not-allowed' : 'pointer',
                transform: 'scale(1.2)'
              }}
            />
            {field.checkboxLabel || field.label}
          </label>
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={!isEditable}
            style={inputStyle}
          />
        );
    }
  };

  return (
    <div className="field-renderer">
      {/* Field Label */}
      {field.type !== 'boolean' && (
        <label htmlFor={field.id} style={labelStyle}>
          {field.label}
          {field.required && <span style={{ color: '#E53E3E', marginLeft: '2px' }}>*</span>}
          {isNotaryMode && field.notaryField && (
            <span style={{
              marginLeft: '8px',
              fontSize: '11px',
              color: '#3182CE',
              backgroundColor: '#EBF8FF',
              padding: '2px 6px',
              borderRadius: '12px',
              fontWeight: '500'
            }}>
              NOTARY
            </span>
          )}
        </label>
      )}

      {/* Field Description */}
      {field.description && (
        <p style={{
          fontSize: '12px',
          color: '#718096',
          margin: '0 0 8px 0',
          lineHeight: '1.4'
        }}>
          {field.description}
        </p>
      )}

      {/* Field Input */}
      <div className="field-input">
        {renderField()}
      </div>

      {/* Field Error */}
      {error && (
        <div style={errorStyle}>
          {error.message || error}
        </div>
      )}

      {/* Field Help Text */}
      {field.helpText && !error && (
        <div style={{
          fontSize: '12px',
          color: '#718096',
          marginTop: '4px',
          lineHeight: '1.4'
        }}>
          {field.helpText}
        </div>
      )}
    </div>
  );
};

export default FieldRenderer;
