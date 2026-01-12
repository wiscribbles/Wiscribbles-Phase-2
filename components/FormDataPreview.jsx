'use client';

import React from 'react';

const FormDataPreview = ({ formData, documentType = 'document' }) => {
  if (!formData) {
    return (
      <div className="text-center text-muted p-4">
        <i className="fa fa-file-text-o fa-3x mb-3"></i>
        <h5>No Form Data Available</h5>
        <p>Form data will appear here during the session.</p>
      </div>
    );
  }

  const { step1, step2, documentForms } = formData;

  // Get document-specific form data
  const getDocumentFormData = () => {
    if (!documentForms || !step2?.documentType) return null;
    return documentForms[step2.documentType] || null;
  };

  const docFormData = getDocumentFormData();

  const formatFieldName = (fieldName) => {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/([a-z])([A-Z])/g, '$1 $2');
  };

  const formatValue = (value) => {
    if (typeof value === 'boolean') {
      return value ? '✓ Yes' : '✗ No';
    }
    if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
      // Likely a date string
      return new Date(value).toLocaleDateString();
    }
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Date in YYYY-MM-DD format
      return new Date(value).toLocaleDateString();
    }
    return value || 'Not provided';
  };

  const renderSection = (title, data, excludeFields = []) => {
    if (!data || typeof data !== 'object') return null;

    const filteredEntries = Object.entries(data).filter(([key, value]) => {
      return !excludeFields.includes(key) && 
             value !== '' && 
             value !== null && 
             value !== undefined;
    });

    if (filteredEntries.length === 0) return null;

    return (
      <div className="mb-4">
        <h6 className="text-primary border-bottom pb-2 mb-3">{title}</h6>
        <div className="row">
          {filteredEntries.map(([key, value]) => (
            <div key={key} className="col-md-6 mb-2">
              <div className="d-flex">
                <strong className="me-2" style={{ minWidth: '40%', fontSize: '13px' }}>
                  {formatFieldName(key)}:
                </strong>
                <span style={{ fontSize: '13px' }}>{formatValue(value)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAffidavitOfIdentity = (data) => {
    if (!data) return null;

    const identificationTypes = [];
    if (data.driversLicense) identificationTypes.push("Driver's License");
    if (data.passport) identificationTypes.push("Passport");
    if (data.identityCard) identificationTypes.push("Identity Card");
    if (data.otherIdType && data.otherIdDescription) {
      identificationTypes.push(`Other: ${data.otherIdDescription}`);
    }

    return (
      <div className="mb-4">
        <h6 className="text-primary border-bottom pb-2 mb-3">Affidavit of Identity Details</h6>
        
        <div className="mb-3">
          <strong>Legal Name:</strong> {data.affiantName || 'Not provided'}
        </div>
        
        <div className="mb-3">
          <strong>Date of Birth:</strong> {formatValue(data.dateOfBirth)}
        </div>
        
        <div className="mb-3">
          <strong>Current Address:</strong> {data.currentAddress || 'Not provided'}
        </div>
        
        <div className="mb-3">
          <strong>Phone Number:</strong> {data.phoneNumber || 'Not provided'}
        </div>
        
        <div className="mb-3">
          <strong>Identification Presented:</strong>
          <ul className="mt-1 mb-0">
            {identificationTypes.length > 0 ? (
              identificationTypes.map((type, index) => (
                <li key={index} style={{ fontSize: '13px' }}>{type}</li>
              ))
            ) : (
              <li style={{ fontSize: '13px', color: '#666' }}>None specified</li>
            )}
          </ul>
        </div>
        
        <div className="mb-3">
          <strong>Affirmation Date:</strong> {formatValue(data.affirmDate)}
        </div>
        
        <div className="mb-3">
          <strong>Signature:</strong> {data.affiantSignature || 'Pending'}
        </div>
        
        <div className="mb-3">
          <strong>Signature Date:</strong> {formatValue(data.signatureDate)}
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '20px' }}>
      <div className="bg-white">
        <div className="d-flex align-items-center mb-4">
          <i className="fa fa-file-text-o fa-2x text-primary me-3"></i>
          <div>
            <h4 className="mb-1">Form Data Preview</h4>
            <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
              Document Type: {step2?.documentType?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
            </p>
          </div>
        </div>

        {/* Personal Information Section */}
        {step1 && renderSection(
          'Personal Information',
          step1,
          ['identificationImage', 'identificationImageUrl']
        )}

        {/* Document Selection */}
        {step2 && renderSection(
          'Document Selection',
          step2,
          ['documentUrl']
        )}

        {/* Document-Specific Form Data */}
        {docFormData && step2?.documentType === 'affidavit-of-identity' && renderAffidavitOfIdentity(docFormData)}
        
        {/* Other document types - generic display */}
        {docFormData && step2?.documentType !== 'affidavit-of-identity' && renderSection(
          `${step2.documentType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Details`,
          docFormData,
          ['documentUrl', 'signatures']
        )}

        {/* Session Information */}
        <div className="mt-4 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h6 className="text-secondary mb-2">Session Status</h6>
          <div className="d-flex align-items-center">
            <div 
              className="rounded-circle me-2"
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#10B981'
              }}
            ></div>
            <small className="text-success">Live Session Active</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormDataPreview;
