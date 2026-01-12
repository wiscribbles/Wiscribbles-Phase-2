'use client';

import React from 'react';
import FormWrapper, { FormField } from '../shared/FormWrapper';
import useDocumentForm from '@/hooks/useDocumentForm';
import DocumentFormStatus from '../shared/DocumentFormStatus';

const PowerOfAttorneyForm = ({ formData = {}, onFormDataChange, onProceed }) => {
  const initialFormData = {
    principalName: '',
    attorneyName: '',
    powersGranted: '',
    durationType: '',
    startDate: '',
    endDate: '',
    witnessName: '',
    specificInstructions: '',
    ...formData
  };

  const requiredFields = ['principalName', 'attorneyName', 'powersGranted', 'durationType'];

  const {
    formData: localFormData,
    isLoading,
    saveStatus,
    isValid,
    handleFieldChange
  } = useDocumentForm({
    documentType: 'power-of-attorney',
    initialFormData,
    requiredFields,
    onFormDataChange
  });

  const durationTypeOptions = [
    { value: 'general', label: 'General Power of Attorney' },
    { value: 'limited', label: 'Limited Power of Attorney' },
    { value: 'durable', label: 'Durable Power of Attorney' },
    { value: 'springing', label: 'Springing Power of Attorney' }
  ];

  const powersOptions = [
    { value: 'financial', label: 'Financial Affairs' },
    { value: 'property', label: 'Property Management' },
    { value: 'healthcare', label: 'Healthcare Decisions' },
    { value: 'legal', label: 'Legal Matters' },
    { value: 'business', label: 'Business Operations' }
  ];

  if (isLoading) {
    return (
      <FormWrapper
        title="Power of Attorney Form"
        subtitle="Loading your saved data..."
        onProceed={() => false}
        isValid={false}
      >
        <DocumentFormStatus 
          isLoading={isLoading}
          loadingMessage="Loading your Power of Attorney data..."
        />
      </FormWrapper>
    );
  }

  return (
    <FormWrapper
      title="Power of Attorney Form"
      subtitle="Create a legal document to authorize someone to act on your behalf"
      onProceed={() => isValid && onProceed()}
      isValid={isValid}
    >
      <DocumentFormStatus saveStatus={saveStatus} />
      <div className="row">
        <div className="col-md-6">
          <FormField
            label="Principal (Your Name)"
            value={localFormData.principalName}
            onChange={handleFieldChange('principalName')}
            placeholder="Full legal name of person granting power"
            required
          />
        </div>
        <div className="col-md-6">
          <FormField
            label="Attorney-in-Fact Name"
            value={localFormData.attorneyName}
            onChange={handleFieldChange('attorneyName')}
            placeholder="Full name of person receiving power"
            required
          />
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <FormField
            label="Type of Power of Attorney"
            type="select"
            value={localFormData.durationType}
            onChange={handleFieldChange('durationType')}
            options={durationTypeOptions}
            required
          />
        </div>
        <div className="col-md-6">
          <FormField
            label="Powers Granted"
            type="select"
            value={localFormData.powersGranted}
            onChange={handleFieldChange('powersGranted')}
            options={powersOptions}
            required
          />
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <FormField
            label="Effective Start Date"
            type="date"
            value={localFormData.startDate}
            onChange={handleFieldChange('startDate')}
          />
        </div>
        <div className="col-md-6">
          <FormField
            label="Expiration Date (if applicable)"
            type="date"
            value={localFormData.endDate}
            onChange={handleFieldChange('endDate')}
          />
        </div>
      </div>

      <FormField
        label="Witness Name"
        value={localFormData.witnessName}
        onChange={handleFieldChange('witnessName')}
        placeholder="Full name of witness (if required)"
      />

      <FormField
        label="Specific Instructions or Limitations"
        type="textarea"
        value={localFormData.specificInstructions}
        onChange={handleFieldChange('specificInstructions')}
        placeholder="Enter any specific instructions or limitations for the attorney-in-fact"
      />
    </FormWrapper>
  );
};

export default PowerOfAttorneyForm;
