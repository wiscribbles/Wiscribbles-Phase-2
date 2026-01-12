'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { getDocumentConfig, getDocumentType } from '../../config/documentTypes';
import FieldRenderer from './FieldRenderer';
import SectionRenderer from './SectionRenderer';

/**
 * Universal Form Renderer - Dynamically renders any document form based on configuration
 * This replaces all hard-coded form components (ResidentialLeaseAgreementForm, etc.)
 */
const DynamicFormRenderer = ({
  documentType,
  subtype = null,
  config = null,
  formData = {},
  onFieldChange,
  onSignature,
  onSubmit,
  onSubtypeChange,
  validationErrors = {},
  isNotaryMode = false,
  mode = 'normal', // 'normal', 'video_call', 'notary'
  isCompact = false,
  isLoading = false,
  className = '',
  style = {}
}) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState(new Set());
  const [selectedSubtype, setSelectedSubtype] = useState(subtype);

  // Get document configuration
  const docConfig = config || getDocumentConfig(documentType, selectedSubtype);
  
  
  // Initialize form with React Hook Form
  const methods = useForm({
    defaultValues: formData,
    mode: 'onChange'
  });

  const { handleSubmit, watch, setValue, formState: { errors: formErrors, isValid } } = methods;

  // Watch all form values for real-time updates
  const watchedValues = watch();

  // Load initial data
  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
      Object.entries(formData).forEach(([key, value]) => {
        setValue(key, value);
      });
    }
  }, [formData, setValue]);

  // Handle subtype selection
  const handleSubtypeSelection = (subtypeValue) => {
    setSelectedSubtype(subtypeValue);
    if (onSubtypeChange) {
      onSubtypeChange(subtypeValue);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        flexDirection: 'column'
      }}>
        <div className="spinner-border" style={{ color: '#274171' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p style={{ marginTop: '15px', color: '#718096' }}>Loading form...</p>
      </div>
    );
  }

  if (!docConfig) {
    return (
      <div className="alert alert-danger">
        <h4>Document Type Not Found</h4>
        <p>The document type "{documentType}" is not configured.</p>
        {selectedSubtype && (
          <p>Subtype: "{selectedSubtype}"</p>
        )}
      </div>
    );
  }

  // Check if document has subtypes but no subtype is selected
  const baseDocType = getDocumentType(documentType);
  if (baseDocType?.hasSubtypes && !selectedSubtype && currentSection === 0) {
    // Show subtype selection as the first step
    return (
      <div className={`dynamic-form-renderer subtype-selection ${className}`} style={style}>
        <div className="form-header" style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h2 style={{ color: '#2D3748', fontSize: '28px', fontWeight: '600' }}>
            {baseDocType.title}
          </h2>
          <p style={{ color: '#718096', fontSize: '16px', marginTop: '8px' }}>
            {baseDocType.description}
          </p>
        </div>

        <SectionRenderer
          section={baseDocType.sections[0]} // Should be subtype_selection section
          formData={formData}
          onFieldChange={(fieldId, value) => {
            handleFieldChange(fieldId, value);
            if (fieldId === 'poa_subtype') {
              handleSubtypeSelection(value);
            }
          }}
          errors={validationErrors}
          isNotaryMode={isNotaryMode}
          notaryEditableFields={[]}
          methods={methods}
          isCompact={isCompact}
        />

        <div className="form-navigation" style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '30px'
        }}>
          <button
            type="button"
            onClick={() => {
              const subtypeValue = formData['poa_subtype'];
              if (subtypeValue) {
                handleSubtypeSelection(subtypeValue);
              }
            }}
            disabled={!formData['poa_subtype']}
            style={{
              backgroundColor: formData['poa_subtype'] ? '#274171' : '#E2E8F0',
              color: formData['poa_subtype'] ? 'white' : '#A0AEC0',
              border: 'none',
              padding: '12px 30px',
              borderRadius: '6px',
              cursor: formData['poa_subtype'] ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Continue with Selected Type
            <i className="fa fa-arrow-right"></i>
          </button>
        </div>
      </div>
    );
  }

  // Handle field changes - now supports external onFieldChange callback
  const handleFieldChange = (fieldId, value) => {
    // Update form state if using react-hook-form
    if (setValue) {
      setValue(fieldId, value, { shouldValidate: true });
    }
    
    // Call external field change handler (for WorkflowContext integration)
    if (onFieldChange) {
      onFieldChange(fieldId, value);
    }
    
    // Handle special case: subtype selection
    if (fieldId === 'poa_subtype' || fieldId === 'lease_subtype') {
      handleSubtypeSelection(value);
    }
    
    // Handle conditional fields
    const field = findFieldById(fieldId);
    if (field?.conditionalFields) {
      handleConditionalFields(field, value);
    }
  };

  const findFieldById = (fieldId) => {
    if (!docConfig || !docConfig.sections) return null;
    for (const section of docConfig.sections) {
      if (!section || !section.fields) continue;
      const field = section.fields.find(f => f.id === fieldId);
      if (field) return field;
    }
    return null;
  };

  const handleConditionalFields = (field, value) => {
    if (field.conditionalFields) {
      // Clear fields that are no longer relevant
      Object.entries(field.conditionalFields).forEach(([conditionValue, conditionalFields]) => {
        if (conditionValue !== value.toString()) {
          conditionalFields.forEach(condField => {
            setValue(condField.id, '', { shouldValidate: true });
          });
        }
      });
    }
  };

  const validateSection = (sectionIndex) => {
    if (!docConfig || !docConfig.sections || !docConfig.sections[sectionIndex]) {
      return false;
    }
    const section = docConfig.sections[sectionIndex];
    if (!section || !section.fields) {
      return false;
    }
    const sectionErrors = [];
    
    section.fields.forEach(field => {
      if (field && field.required && !watchedValues[field.id]) {
        sectionErrors.push(field.id);
      }
    });
    
    return sectionErrors.length === 0;
  };

  const handleNextSection = () => {
    if (!docConfig || !docConfig.sections) {
      console.error('DynamicFormRenderer: docConfig or sections is null');
      return;
    }
    if (validateSection(currentSection)) {
      setCompletedSections(prev => new Set([...prev, currentSection]));
      if (currentSection < docConfig.sections.length - 1) {
        setCurrentSection(currentSection + 1);
      } else {
        // Form completed, proceed
        if (onSubmit) {
          onSubmit(watchedValues);
        }
      }
    }
  };

  const handlePreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleFormSubmit = (data) => {
    if (onSubmit) {
      onSubmit(data);
    }
  };

  // Render style for video call mode
  const containerStyle = {
    ...style,
    ...(mode === 'video_call' ? {
      maxHeight: '80vh',
      overflowY: 'auto',
      backgroundColor: 'white',
      borderRadius: '8px'
    } : {})
  };

  return (
    <div className={`dynamic-form-renderer ${className}`} style={containerStyle}>
      {mode !== 'video_call' && (
        <div className="form-header" style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h2 style={{ color: '#2D3748', fontSize: '28px', fontWeight: '600' }}>
            {docConfig.title}
          </h2>
          <p style={{ color: '#718096', fontSize: '16px', marginTop: '8px' }}>
            {docConfig.description}
          </p>
        </div>
      )}

      {mode === 'video_call' && (
        <div className="video-call-form-header" style={{ 
          padding: '15px', 
          borderBottom: '1px solid #E2E8F0',
          backgroundColor: '#274171',
          color: 'white',
          borderRadius: '8px 8px 0 0'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>{docConfig.title}</h3>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
            {isNotaryMode ? 'Notary View - Edit as needed' : 'Review and confirm details'}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} style={{ padding: mode === 'video_call' ? '20px' : '0' }}>
        {/* Progress indicator for multi-section forms */}
        {docConfig.sections && docConfig.sections.length > 1 && mode !== 'video_call' && (
          <div className="progress-indicator" style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              {docConfig.sections.map((section, index) => (
                <div
                  key={section?.id || index}
                  style={{
                    flex: 1,
                    height: '4px',
                    backgroundColor: index <= currentSection ? '#274171' : '#E2E8F0',
                    marginRight: index < docConfig.sections.length - 1 ? '8px' : '0',
                    borderRadius: '2px',
                    transition: 'backgroundColor 0.3s ease'
                  }}
                />
              ))}
            </div>
            <p style={{ textAlign: 'center', color: '#718096', fontSize: '14px' }}>
              Section {currentSection + 1} of {docConfig.sections.length}: {docConfig.sections[currentSection]?.title || 'Loading...'}
            </p>
          </div>
        )}

        {/* Render current section or all sections in video call mode */}
        {mode === 'video_call' ? (
          // In video call mode, show all sections in a compact view
          <div className="all-sections">
            {docConfig.sections && docConfig.sections.map((section, sectionIndex) => (
              section && <SectionRenderer
                key={section.id || sectionIndex}
                section={section}
                formData={formData}
                onFieldChange={handleFieldChange}
                errors={validationErrors}
                isNotaryMode={isNotaryMode}
                notaryEditableFields={docConfig.notaryEditableFields || []}
                methods={methods}
                isCompact={isCompact}
              />
            ))}
          </div>
        ) : (
          // Normal mode - show current section
          docConfig.sections && docConfig.sections[currentSection] ? (
            <SectionRenderer
              section={docConfig.sections[currentSection]}
              formData={formData}
              onFieldChange={handleFieldChange}
              errors={validationErrors}
              isNotaryMode={isNotaryMode}
              notaryEditableFields={docConfig.notaryEditableFields || []}
              methods={methods}
              isCompact={isCompact}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
              <p>Loading section...</p>
            </div>
          )
        )}

        {/* Navigation buttons */}
        {mode !== 'video_call' && (
          <div className="form-navigation" style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '40px',
            paddingTop: '20px',
            borderTop: '1px solid #E2E8F0'
          }}>
            <button
              type="button"
              onClick={handlePreviousSection}
              disabled={currentSection === 0}
              style={{
                backgroundColor: currentSection === 0 ? '#E2E8F0' : '#274171',
                color: currentSection === 0 ? '#A0AEC0' : 'white',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '6px',
                cursor: currentSection === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fa fa-arrow-left"></i>
              Previous
            </button>

            <button
              type={docConfig.sections && currentSection === docConfig.sections.length - 1 ? "submit" : "button"}
              onClick={docConfig.sections && currentSection === docConfig.sections.length - 1 ? undefined : handleNextSection}
              style={{
                backgroundColor: '#274171',
                color: 'white',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {docConfig.sections && currentSection === docConfig.sections.length - 1 ? 'Complete' : 'Next'}
              <i className={`fa fa-${docConfig.sections && currentSection === docConfig.sections.length - 1 ? 'check' : 'arrow-right'}`}></i>
            </button>
          </div>
        )}

        {/* Video call mode actions */}
        {mode === 'video_call' && (
          <div className="video-call-actions" style={{
            display: 'flex',
            gap: '10px',
            marginTop: '20px',
            paddingTop: '15px',
            borderTop: '1px solid #E2E8F0'
          }}>
            {isNotaryMode ? (
              <>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    backgroundColor: '#10B981',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                  onClick={() => onSubmit && onSubmit(formData)}
                >
                  Save & Continue
                </button>
                <button
                  type="button"
                  style={{
                    backgroundColor: '#EF4444',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </>
            ) : (
              <button
                type="submit"
                style={{
                  flex: 1,
                  backgroundColor: '#274171',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Confirm Details
              </button>
            )}
          </div>
        )}
      </form>

    </div>
  );
};

export default DynamicFormRenderer;
