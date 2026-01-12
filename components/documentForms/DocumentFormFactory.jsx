'use client';

import React from 'react';
import PowerOfAttorneyForm from './PowerOfAttorneyForm';
import DurableFinancialPowerOfAttorneyForm from './DurableFinancialPowerOfAttorneyForm';
import LimitedSpecialPowerOfAttorneyForm from './LimitedSpecialPowerOfAttorneyForm';
import RealEstatePowerOfAttorneyForm from './RealEstatePowerOfAttorneyForm';
import LastWillTestamentForm from './LastWillTestamentForm';
import AgreementOfSaleForm from './AgreementOfSaleForm';
import LeaseAgreementForm from './LeaseAgreementForm';
import ResidentialLeaseAgreementForm from './ResidentialLeaseAgreementForm';
import StandardLeaseAgreementForm from './StandardLeaseAgreementForm';
import PromissoryNoteForm from './PromissoryNoteForm';
import PassportApplicationForm from './PassportApplicationForm';
import AffidavitOfIdentityForm from './AffidavitOfIdentityForm';
import PropertyManagementForm from './PropertyManagementForm';
import CustomDocumentForm from './CustomDocumentForm';
import UploadDocumentForm from './UploadDocumentForm';
import DynamicFormRenderer from '../DynamicFormRenderer/DynamicFormRenderer';
import { documentTypes } from '@/config/documentTypes';

const DocumentFormFactory = ({ documentType, formData, onFormDataChange, onProceed }) => {
  
  console.log('DocumentFormFactory - documentType:', documentType);
  console.log('DocumentFormFactory - documentTypes config has custom-document:', !!documentTypes['custom-document']);
  
  const getFormComponent = () => {
    // Handle power of attorney subtypes
    const powerOfAttorneySubtypeMap = {
      'durable-financial-power-of-attorney': { baseType: 'power-of-attorney', subtype: 'durable_financial' },
      'limited-special-power-of-attorney': { baseType: 'power-of-attorney', subtype: 'limited_special' },
      'real-estate-power-of-attorney': { baseType: 'power-of-attorney', subtype: 'real_estate' }
    };
    
    const subtypeInfo = powerOfAttorneySubtypeMap[documentType];
    
    if (subtypeInfo) {
      const docConfig = documentTypes[subtypeInfo.baseType];
      
      console.log('DocumentFormFactory - POA docConfig for', subtypeInfo.baseType, ':', docConfig);
      if (docConfig && docConfig.sections && docConfig.sections.length > 0) {
        return <DynamicFormRenderer 
          documentType={subtypeInfo.baseType}
          subtype={subtypeInfo.subtype}
          formData={formData}
          onFieldChange={(fieldId, value) => {
            // Update formData with new field value
            const updatedData = { ...formData, [fieldId]: value };
            onFormDataChange(updatedData);
          }}
          onSubmit={onProceed}
          mode="normal"
        />;
      }
    }
    
    // Check if document type is configured in documentTypes config
    const docConfig = documentTypes[documentType];
    console.log('DocumentFormFactory - docConfig for', documentType, ':', docConfig);
    if (docConfig && docConfig.sections && docConfig.sections.length > 0) {
      return <DynamicFormRenderer 
        documentType={documentType}
        formData={formData}
        onFieldChange={(fieldId, value) => {
          // Update formData with new field value
          const updatedData = { ...formData, [fieldId]: value };
          onFormDataChange(updatedData);
        }}
        onSubmit={onProceed}
        mode="normal"
      />;
    }

    // Fallback to legacy forms for types not yet configured
    switch (documentType) {
      case 'power-of-attorney':
        return <PowerOfAttorneyForm 
          formData={formData} 
          onFormDataChange={onFormDataChange}
          onProceed={onProceed}
        />;
    case 'durable-financial-power-of-attorney':
      return <DurableFinancialPowerOfAttorneyForm 
        formData={formData} 
        onFormDataChange={onFormDataChange}
        onProceed={onProceed}
      />;
    
    case 'limited-special-power-of-attorney':
      return <LimitedSpecialPowerOfAttorneyForm 
        formData={formData} 
        onFormDataChange={onFormDataChange}
        onProceed={onProceed}
      />;
    
    case 'real-estate-power-of-attorney':
      return <RealEstatePowerOfAttorneyForm 
        formData={formData} 
        onFormDataChange={onFormDataChange}
        onProceed={onProceed}
      />;
      
      case 'last-will':
        return <LastWillTestamentForm 
          formData={formData} 
          onFormDataChange={onFormDataChange}
          onProceed={onProceed}
        />;
      case 'agreement-of-sale':
        return <AgreementOfSaleForm 
          formData={formData} 
          onFormDataChange={onFormDataChange}
          onProceed={onProceed}
        />;
      case 'lease-agreement':
        return <LeaseAgreementForm 
          formData={formData} 
          onFormDataChange={onFormDataChange}
          onProceed={onProceed}
        />;
      case 'residential-lease-agreement':
        return <ResidentialLeaseAgreementForm 
          formData={formData} 
          onFormDataChange={onFormDataChange}
          onProceed={onProceed}
        />;
      case 'standard-lease-agreement':
        return <StandardLeaseAgreementForm 
          formData={formData} 
          onFormDataChange={onFormDataChange}
          onProceed={onProceed}
        />;
      case 'promissory-note':
        return <PromissoryNoteForm 
          formData={formData} 
          onFormDataChange={onFormDataChange}
          onProceed={onProceed}
        />;
      case 'passport-application':
        return <PassportApplicationForm 
          formData={formData} 
          onFormDataChange={onFormDataChange}
          onProceed={onProceed}
        />;
      case 'affidavit-of-identity':
        return <AffidavitOfIdentityForm 
          formData={formData} 
          onFormDataChange={onFormDataChange}
          onProceed={onProceed}
        />;
      case 'property-management':
        return <PropertyManagementForm 
          formData={formData} 
          onFormDataChange={onFormDataChange}
          onProceed={onProceed}
        />;
      case 'custom-document':
        console.log('DocumentFormFactory - Rendering UploadDocumentForm for custom-document');
        return <UploadDocumentForm 
          formData={formData} 
          onFormDataChange={onFormDataChange}
          onProceed={onProceed}
        />;
      default:
        return null;
    }
  };

  if (!documentType) return null;

  return (
    <div className="document-form-container" style={{
      marginTop: '30px',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #e9ecef'
    }}>
      {getFormComponent()}
    </div>
  );
};

export default DocumentFormFactory;
