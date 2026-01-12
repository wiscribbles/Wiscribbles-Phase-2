//not being used additional component used earlier

'use client';

import React, { useState } from 'react';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { useCollaborativeForm } from '../../hooks/useCollaborativeForm';
import DynamicFormRenderer from '../DynamicFormRenderer/DynamicFormRenderer';
import { getDocumentConfig, getAvailableDocumentTypes } from '../../config/documentTypes';

/**
 * DynamicFormExample - Example component demonstrating the dynamic form system
 * Shows how to integrate the form renderer with workflow context and real-time sync
 */
const DynamicFormExample = () => {
  const { state, actions, computed } = useWorkflow();
  const [selectedDocType, setSelectedDocType] = useState('');
  const [isNotaryMode, setIsNotaryMode] = useState(false);
  const [showCollaborativeFeatures, setShowCollaborativeFeatures] = useState(false);

  // Collaborative form hook
  const {
    syncFormField,
    syncSignature,
    isCollaborative,
    isConnected,
    collaborators,
    getSyncStatus
  } = useCollaborativeForm({
    enableSync: showCollaborativeFeatures,
    sessionId: 'example-session-' + Date.now(),
    maxRetries: 3
  });

  // Handle document type selection
  const handleDocumentTypeChange = (docType) => {
    setSelectedDocType(docType);
    const config = getDocumentConfig(docType);
    if (config) {
      actions.setDocumentType(docType, config);
      // Clear any existing form data
      actions.setFormData({});
    }
  };

  // Handle form field changes
  const handleFormFieldChange = (fieldId, value) => {
    actions.updateFormField(fieldId, value);
    
    // Sync with collaborators if enabled
    if (showCollaborativeFeatures && isCollaborative) {
      syncFormField(fieldId, value);
    }
  };

  // Handle signature changes
  const handleSignatureChange = (fieldId, signature) => {
    const signedBy = isNotaryMode ? 'notary' : 'client';
    actions.addSignature(fieldId, signature, signedBy);
    
    // Sync with collaborators if enabled
    if (showCollaborativeFeatures && isCollaborative) {
      syncSignature(fieldId, signature, signedBy);
    }
  };

  // Handle form submission
  const handleFormSubmit = (formData) => {
    console.log('Form submitted:', formData);
    actions.addNotification('success', 'Form submitted successfully!');
    
    // Simulate form processing
    actions.setLoading(true);
    setTimeout(() => {
      actions.setLoading(false);
      actions.addNotification('success', 'Form processed successfully!');
    }, 2000);
  };

  // Toggle collaborative features
  const toggleCollaborativeFeatures = () => {
    setShowCollaborativeFeatures(!showCollaborativeFeatures);
    if (!showCollaborativeFeatures) {
      // Enable collaborative mode
      actions.setServiceType('notary');
      actions.addNotification('info', 'Collaborative features enabled');
    } else {
      // Disable collaborative mode
      actions.setServiceType('e-sign');
      actions.addNotification('info', 'Collaborative features disabled');
    }
  };

  // Get available document types
  const documentTypes = getAvailableDocumentTypes();
  const syncStatus = getSyncStatus();

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: "'Jost', sans-serif"
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h1 style={{
          color: '#2D3748',
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '10px'
        }}>
          Dynamic Form System Example
        </h1>
        <p style={{
          color: '#718096',
          fontSize: '16px',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          This example demonstrates the dynamic form system with real-time collaboration features.
          Select a document type to see the form configuration in action.
        </p>
      </div>

      {/* Controls */}
      <div style={{
        backgroundColor: '#F7FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px'
      }}>
        <div className="row">
          {/* Document Type Selection */}
          <div className="col-md-6">
            <h5 style={{ color: '#2D3748', marginBottom: '15px' }}>Document Type</h5>
            <select
              value={selectedDocType}
              onChange={(e) => handleDocumentTypeChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #CBD5E0',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="">Select a document type...</option>
              {documentTypes.map(docType => (
                <option key={docType.id} value={docType.id}>
                  {docType.title}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Controls */}
          <div className="col-md-6">
            <h5 style={{ color: '#2D3748', marginBottom: '15px' }}>Mode Controls</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}>
                <input
                  type="checkbox"
                  checked={isNotaryMode}
                  onChange={(e) => setIsNotaryMode(e.target.checked)}
                />
                Notary Mode
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}>
                <input
                  type="checkbox"
                  checked={showCollaborativeFeatures}
                  onChange={toggleCollaborativeFeatures}
                />
                Collaborative Features
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Status Panel */}
      {(state.selectedDocumentType || showCollaborativeFeatures) && (
        <div style={{
          backgroundColor: '#EBF8FF',
          border: '1px solid #3182CE',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h6 style={{ color: '#1E3A8A', marginBottom: '10px' }}>Status</h6>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <strong>Selected Document:</strong> {state.selectedDocumentType || 'None'}
            </div>
            <div>
              <strong>Form Progress:</strong> {Math.round(computed.getFormProgress())}%
            </div>
            <div>
              <strong>Current Section:</strong> {state.currentFormSection + 1} of {state.documentConfig?.sections?.length || 0}
            </div>
            {showCollaborativeFeatures && (
              <>
                <div>
                  <strong>Collaboration:</strong> {isConnected ? '✅ Connected' : '❌ Disconnected'}
                </div>
                <div>
                  <strong>Collaborators:</strong> {collaborators.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Form Renderer */}
      <div className="row">
        <div className="col-12">
          {state.selectedDocumentType && state.documentConfig ? (
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '30px'
            }}>
              <DynamicFormRenderer
                documentType={state.selectedDocumentType}
                config={state.documentConfig}
                formData={state.formData}
                onFieldChange={handleFormFieldChange}
                onSignature={handleSignatureChange}
                onSubmit={handleFormSubmit}
                errors={state.formErrors}
                isNotaryMode={isNotaryMode}
                mode="normal"
                isLoading={state.isLoading}
              />
            </div>
          ) : (
            <div style={{
              backgroundColor: '#F7FAFC',
              border: '2px dashed #CBD5E0',
              borderRadius: '8px',
              padding: '60px 20px',
              textAlign: 'center',
              color: '#718096'
            }}>
              <i className="fa fa-file-text" style={{ fontSize: '48px', marginBottom: '20px', display: 'block' }}></i>
              <h4 style={{ marginBottom: '10px' }}>Select a Document Type</h4>
              <p>Choose a document type from the dropdown above to see the dynamic form in action.</p>
            </div>
          )}
        </div>
      </div>

      {/* Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          backgroundColor: '#1A202C',
          color: '#E2E8F0',
          borderRadius: '8px',
          padding: '20px',
          marginTop: '30px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <h6 style={{ color: '#63B3ED', marginBottom: '15px' }}>Debug Information</h6>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <strong>Workflow State:</strong>
              <pre style={{ marginTop: '10px', fontSize: '11px', overflow: 'auto' }}>
                {JSON.stringify({
                  selectedDocumentType: state.selectedDocumentType,
                  currentFormSection: state.currentFormSection,
                  formDataKeys: Object.keys(state.formData),
                  formErrorsKeys: Object.keys(state.formErrors),
                  isLoading: state.isLoading,
                  currentStep: state.currentStep,
                  selectedService: state.selectedService
                }, null, 2)}
              </pre>
            </div>
            {showCollaborativeFeatures && (
              <div>
                <strong>Sync Status:</strong>
                <pre style={{ marginTop: '10px', fontSize: '11px', overflow: 'auto' }}>
                  {JSON.stringify(syncStatus, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicFormExample;
