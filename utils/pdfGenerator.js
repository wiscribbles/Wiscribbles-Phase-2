// PDF Generation Service for Form-Based Documents
// This service converts form data into PDF documents for preview

import { getUserContext } from './sessionUtils';

export const generatePDFFromFormData = async (documentType, formData) => {
  try {
    // Get user context for database data fetching
    const { userId, sessionId } = getUserContext();
    
    console.log('Generating PDF with context:', {
      documentType,
      userId: userId || 'anonymous',
      sessionId,
      hasFormData: !!formData
    });
    
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documentType,
        formData,
        userId,
        sessionId
      })
    });

    if (!response.ok) {
      throw new Error(`PDF generation failed: ${response.status}`);
    }

    const result = await response.json();
    return result.pdfUrl;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Check if document type requires PDF generation
export const requiresPDFGeneration = (documentType) => {
  const formBasedDocuments = [
    'affidavit-of-identity',
    'power-of-attorney',
    'durable-financial-power-of-attorney',
    'limited-special-power-of-attorney', 
    'real-estate-power-of-attorney',
    'last-will',
    'promissory-note',
    'agreement-of-sale',
    'lease-agreement',
    'residential-lease-agreement',
    'standard-lease-agreement',
    'property-management',
    'passport-application'
  ];
  
  return formBasedDocuments.includes(documentType);
};

// Get document URL or generate if needed
export const getOrGenerateDocumentUrl = async (documentType, formData, documentForms) => {
  // First check if document URL already exists
  if (formData?.step2?.documentUrl) {
    return formData.step2.documentUrl;
  }
  
  if (documentType === 'custom-document' && documentForms?.['custom-document']?.documentUrl) {
    return documentForms['custom-document'].documentUrl;
  }

  // If it's a form-based document, generate PDF
  if (requiresPDFGeneration(documentType)) {
    const relevantFormData = {
      personalInfo: formData?.step1 || {},
      documentInfo: formData?.step2 || {},
      documentFormData: documentForms?.[documentType] || {}
    };

    return await generatePDFFromFormData(documentType, relevantFormData);
  }

  return null;
};
