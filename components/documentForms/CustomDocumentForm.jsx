'use client';
import React, { useState, useEffect } from 'react';
import FormWrapper, { FormField } from '../shared/FormWrapper';

const CustomDocumentForm = ({ formData = {}, onFormDataChange, onProceed }) => {
  const [localFormData, setLocalFormData] = useState({
    documentTitle: '', documentDescription: '', customFields: '', additionalNotes: '', ...formData
  });
  const [isValid, setIsValid] = useState(false);

  useEffect(() => { onFormDataChange(localFormData); }, [localFormData, onFormDataChange]);
  useEffect(() => {
    const valid = ['documentTitle', 'documentDescription'].every(field => localFormData[field]);
    setIsValid(valid);
  }, [localFormData]);

  const handleFieldChange = (field) => (e) => {
    setLocalFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <FormWrapper title="Upload Your Own Document" subtitle="Please provide details about your custom document" onProceed={() => isValid && onProceed()} isValid={isValid}>
      <FormField label="Document Title" value={localFormData.documentTitle} onChange={handleFieldChange('documentTitle')} placeholder="Enter document title" required />
      <FormField label="Document Description" type="textarea" value={localFormData.documentDescription} onChange={handleFieldChange('documentDescription')} placeholder="Describe what this document is for" required />
      <FormField label="Custom Fields/Requirements" type="textarea" value={localFormData.customFields} onChange={handleFieldChange('customFields')} placeholder="List any specific fields or requirements for this document" />
      <FormField label="Additional Notes" type="textarea" value={localFormData.additionalNotes} onChange={handleFieldChange('additionalNotes')} placeholder="Any other information we should know" />
      
      <div style={{ 
        backgroundColor: '#e3f2fd', 
        border: '1px solid #90caf9', 
        borderRadius: '8px', 
        padding: '16px', 
        marginTop: '20px' 
      }}>
        <h5 style={{ color: '#1976d2', marginBottom: '8px' }}>📄 Note:</h5>
        <p style={{ color: '#1565c0', margin: 0, fontSize: '14px' }}>
          For custom documents, you'll be able to upload your own document file in the next steps of the process.
        </p>
      </div>
    </FormWrapper>
  );
};

export default CustomDocumentForm;
