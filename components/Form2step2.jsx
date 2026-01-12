'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import FormProgressSidebar from './FormProgressSidebar';
import { saveFormData, getFormData, saveDocumentFormData, getDocumentFormData } from '@/utils/formStorage';
import { saveDocumentFormDataLocalAndDB, getDocumentFormDataWithFallback } from '@/utils/documentFormStorage';
import DocumentFormFactory from './documentForms/DocumentFormFactory';
import { documentTypes as documentTypesConfig } from '@/config/documentTypes';
import DynamicFormRenderer from './DynamicFormRenderer/DynamicFormRenderer';





const documentTypes = [
  {
    id: 'power-of-attorney',
    icon: '/assets/v3/img/form-img01.png',
    title: 'Power of Attorney',
    selected: false
  },
  {
    id: 'last-will',
    icon: '/assets/v3/img/form-img02.png',
    title: 'Last Will & Testament',
    selected: false
  },
  {
    id: 'agreement-of-sale',
    icon: '/assets/v3/img/form-img03.png',
    title: 'Agreement of Sale',
    selected: false
  },
  {
    id: 'lease-agreement',
    icon: '/assets/v3/img/form-img04.png',
    title: 'Lease Agreement',
    selected: false
  },
  {
    id: 'promissory-note',
    icon: '/assets/v3/img/form-img05.png',
    title: 'Promissory Note',
    selected: false
  },
  {
    id: 'passport-application',
    icon: '/assets/v3/img/form-img06.png',
    title: 'Passport Application',
    selected: false
  },
  {
    id: 'affidavit-of-identity',
    icon: '/assets/v3/img/form-img07.png',
    title: 'Affidavit Of Identity',
    selected: false
  },
  {
    id: 'property-management',
    icon: '/assets/v3/img/form-img08.png',
    title: 'Property Management Agreement',
    selected: false
  },
  {
    id: 'custom-document',
    icon: '/assets/v3/img/form-img09.png',
    title: 'Upload your own Document',
    selected: false
  }
];

const Form2step2 = () => {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split('/')?.[1] || '';
  const t = useTranslations();
  const [selectedDocument, setSelectedDocument] = React.useState(null);
  const [selectedLeaseType, setSelectedLeaseType] = React.useState(null);
  const [showLeaseSubOptions, setShowLeaseSubOptions] = React.useState(false);
  const [selectedSubtype, setSelectedSubtype] = React.useState(null);
  const [showPowerOfAttorneySubOptions, setShowPowerOfAttorneySubOptions] = React.useState(false);
  const [documentFormData, setDocumentFormData] = useState({});

  // Load saved data when component mounts
  useEffect(() => {
    const savedData = getFormData().step2;
    if (savedData && savedData.documentType) {
      const docType = savedData.documentType;
      
      // Check if it's one of the new lease agreement sub-types
      if (docType === 'residential-lease-agreement' || docType === 'standard-lease-agreement') {
        setShowLeaseSubOptions(true);
        setSelectedLeaseType(docType);
        setSelectedDocument(docType);
      } else if (docType === 'lease-agreement') {
        // If the saved type is the old general lease-agreement, show sub-options
        setShowLeaseSubOptions(true);
        setSelectedDocument(null);
        setSelectedLeaseType(null);
      } else if (docType === 'durable-financial-power-of-attorney' || 
                 docType === 'limited-special-power-of-attorney' || 
                 docType === 'real-estate-power-of-attorney') {
        // Power of Attorney subtypes - map to config subtypes
        const subtypeMap = {
          'durable-financial-power-of-attorney': 'durable_financial',
          'limited-special-power-of-attorney': 'limited_special', 
          'real-estate-power-of-attorney': 'real_estate'
        };
        setShowPowerOfAttorneySubOptions(true);
        setSelectedSubtype(subtypeMap[docType]);
        setSelectedDocument(docType);
      } else if (docType === 'power-of-attorney') {
        // If the saved type is the general power-of-attorney, show sub-options
        setShowPowerOfAttorneySubOptions(true);
        setSelectedDocument(null);
        setSelectedSubtype(null);
      } else {
        // For all other document types, proceed normally
        setSelectedDocument(docType);
        setShowLeaseSubOptions(false);
        setShowPowerOfAttorneySubOptions(false);
        setSelectedLeaseType(null);
        setSelectedSubtype(null);
      }
      
      // Load document form data from database with localStorage fallback
      const loadDocumentFormData = async () => {
        try {
          const docFormData = await getDocumentFormDataWithFallback(docType);
          setDocumentFormData(docFormData);
        } catch (error) {
          console.error('Error loading document form data:', error);
          // Fallback to localStorage only
          const docFormData = getDocumentFormData(docType);
          setDocumentFormData(docFormData);
        }
      };
      loadDocumentFormData();
    }
  }, []);

  const handleDocumentSelect = (documentId) => {
    if (documentId === 'lease-agreement') {
      setShowLeaseSubOptions(true);
      setShowPowerOfAttorneySubOptions(false);
      setSelectedDocument(null); // Reset selected document to show sub-options
      setSelectedLeaseType(null);
      setSelectedSubtype(null);
    } else if (documentId === 'power-of-attorney') {
      setShowPowerOfAttorneySubOptions(true);
      setShowLeaseSubOptions(false);
      setSelectedDocument(null); // Reset selected document to show sub-options
      setSelectedSubtype(null);
      setSelectedLeaseType(null);
    } else {
      setShowLeaseSubOptions(false);
      setShowPowerOfAttorneySubOptions(false);
      setSelectedDocument(documentId);
      setSelectedLeaseType(null);
      setSelectedSubtype(null);
      // Save to localStorage
      saveFormData(2, {
        documentType: documentId
      });
      // Load existing form data for this document type from database with fallback
      const loadExistingFormData = async () => {
        try {
          const existingFormData = await getDocumentFormDataWithFallback(documentId);
          setDocumentFormData(existingFormData);
        } catch (error) {
          console.error('Error loading document form data:', error);
          const existingFormData = getDocumentFormData(documentId);
          setDocumentFormData(existingFormData);
        }
      };
      loadExistingFormData();
    }
  };

  const handleLeaseTypeSelect = (leaseType) => {
    setSelectedLeaseType(leaseType);
    setSelectedDocument(leaseType);
    // Save to localStorage
    saveFormData(2, {
      documentType: leaseType
    });
    // Load existing form data for this document type from database with fallback
    const loadExistingFormData = async () => {
      try {
        const existingFormData = await getDocumentFormDataWithFallback(leaseType);
        setDocumentFormData(existingFormData);
      } catch (error) {
        console.error('Error loading lease form data:', error);
        const existingFormData = getDocumentFormData(leaseType);
        setDocumentFormData(existingFormData);
      }
    };
    loadExistingFormData();
  };

  const handlePowerOfAttorneyTypeSelect = (subtypeId) => {
    // Map display subtype IDs to actual document type names
    const subtypeMap = {
      'durable-financial-power-of-attorney': 'durable_financial',
      'limited-special-power-of-attorney': 'limited_special', 
      'real-estate-power-of-attorney': 'real_estate'
    };
    
    const actualSubtype = subtypeMap[subtypeId] || subtypeId;
    setSelectedSubtype(actualSubtype);
    setSelectedDocument(subtypeId); // Keep the full ID for display purposes
    
    // Save to localStorage with the full document type ID
    saveFormData(2, {
      documentType: subtypeId,
      subtype: actualSubtype
    });
    // Load existing form data for this document type from database with fallback
    const loadExistingFormData = async () => {
      try {
        const existingFormData = await getDocumentFormDataWithFallback(subtypeId);
        setDocumentFormData(existingFormData);
      } catch (error) {
        console.error('Error loading POA form data:', error);
        const existingFormData = getDocumentFormData(subtypeId);
        setDocumentFormData(existingFormData);
      }
    };
    loadExistingFormData();
  };

  const handleBackToMainOptions = () => {
    setShowLeaseSubOptions(false);
    setShowPowerOfAttorneySubOptions(false);
    setSelectedDocument(null);
    setSelectedLeaseType(null);
    setSelectedSubtype(null);
  };

  const handleDocumentFormDataChange = useCallback(async (data) => {
    setDocumentFormData(data);
    // Save document form data to both localStorage and database
    if (selectedDocument) {
      try {
        // Save to localStorage immediately for instant feedback
        saveDocumentFormData(selectedDocument, data);
        // Save to database for persistence
        await saveDocumentFormDataLocalAndDB(selectedDocument, data);
      } catch (error) {
        console.error('Error saving document form data:', error);
        // Fallback to localStorage only
        saveDocumentFormData(selectedDocument, data);
      }
    }
  }, [selectedDocument]);

  const handleProceedFromForm = useCallback(() => {
    // Navigate to personal information step
    router.push(`/${locale}/form-step2`);
  }, [router, locale]);

  const handleNext = () => {
    console.log('Selected:', selectedDocument);
    if (selectedDocument) {
      // Always go to personal information step (step 2) after document selection
      router.push(`/${locale}/form-step2`); // This will be the personal info step
    } else {
      alert('Please select a document to proceed');
    }
  };

  return (
    <div className="d-flex">
      <div className="flex-grow-1" style={{ marginRight: '320px' }}>
        <div className="mt-4 ml-4">
          <Link legacyBehavior href={`/${locale}`}>
            <a>
              <img
                src="/assets/images/logos/logo.png"
                style={{ height: '70px' }}
                alt="Logo"
                title="Logo"
              />
            </a>
          </Link>
        </div>

        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="form-card bg-white p-4 rounded-3">
                {/* Form Header */}
                <div className="text-center mb-5">
                  <h2 style={{ color: '#2D3748', fontSize: '28px', fontWeight: '600' }}>{t('form2_step2_title')}</h2>
                  <p style={{ color: '#718096', fontSize: '16px', marginTop: '8px' }}>{t('form2_step2_subtitle')}</p>
                </div>

                
                <div className="form-content">
                  {!showLeaseSubOptions && !showPowerOfAttorneySubOptions ? (
                    <div className="row g-4">
                      {documentTypes.map((doc) => (
                        <div key={doc.id} className="col-md-4">
                          <div
                            onClick={() => handleDocumentSelect(doc.id)}
                            className="document-card"
                            style={{
                              cursor: 'pointer',
                              border: selectedDocument === doc.id ? '2px solid #274171' : '1px solid #E2E8F0',
                              borderRadius: '8px',
                              transition: 'all 0.3s ease',
                              padding: '20px',
                              backgroundColor: selectedDocument === doc.id ? '#F7FAFC' : '#FFFFFF',
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '15px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              minHeight: '160px',
                              userSelect: 'none',
                              WebkitUserSelect: 'none',
                              MozUserSelect: 'none',
                              msUserSelect: 'none'
                            }}
                          >
                            <div 
                              style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '15px'
                              }}
                            >
                              <img
                                src={doc.icon}
                                alt={doc.title}
                                style={{ 
                                  width: '40px', 
                                  height: '40px',
                                  objectFit: 'contain',
                                  pointerEvents: 'none'
                                }}
                              />
                              <h5 
                                style={{
                                  margin: 0,
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  color: '#2D3748',
                                  textAlign: 'center',
                                  pointerEvents: 'none'
                                }}
                              >
                                {doc.title}
                              </h5>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : showLeaseSubOptions ? (
                    <div>
                      {/* Back button */}
                      <div className="mb-4">
                        <button
                          onClick={handleBackToMainOptions}
                          className="btn"
                          style={{
                            backgroundColor: '#274171',
                            color: 'white',
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '5px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <i className="fa fa-arrow-left"></i> Back to Document Types
                        </button>
                      </div>
                      
                      {/* Lease type selection */}
                      <div className="text-center mb-4">
                        <h4 style={{ color: '#274171', marginBottom: '10px' }}>Choose Lease Agreement Type</h4>
                        <p style={{ color: '#718096', fontSize: '14px' }}>Select the type of lease agreement you need:</p>
                      </div>
                      
                      <div className="row g-4 justify-content-center">
                        <div className="col-md-5">
                          <div
                            onClick={() => handleLeaseTypeSelect('residential-lease-agreement')}
                            className="lease-type-card"
                            style={{
                              cursor: 'pointer',
                              border: selectedLeaseType === 'residential-lease-agreement' ? '2px solid #274171' : '1px solid #E2E8F0',
                              borderRadius: '8px',
                              transition: 'all 0.3s ease',
                              padding: '30px 20px',
                              backgroundColor: selectedLeaseType === 'residential-lease-agreement' ? '#F7FAFC' : '#FFFFFF',
                              textAlign: 'center',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              minHeight: '180px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center'
                            }}
                          >
                            <div style={{ marginBottom: '15px' }}>
                              <i className="fa fa-home" style={{ fontSize: '32px', color: '#274171' }}></i>
                            </div>
                            <h5 style={{ color: '#2D3748', fontWeight: '600', marginBottom: '10px' }}>Residential Lease Agreement</h5>
                            <p style={{ color: '#718096', fontSize: '13px', margin: 0 }}>For apartments, houses, condos, and other residential properties</p>
                          </div>
                        </div>
                        
                        <div className="col-md-5">
                          <div
                            onClick={() => handleLeaseTypeSelect('standard-lease-agreement')}
                            className="lease-type-card"
                            style={{
                              cursor: 'pointer',
                              border: selectedLeaseType === 'standard-lease-agreement' ? '2px solid #274171' : '1px solid #E2E8F0',
                              borderRadius: '8px',
                              transition: 'all 0.3s ease',
                              padding: '30px 20px',
                              backgroundColor: selectedLeaseType === 'standard-lease-agreement' ? '#F7FAFC' : '#FFFFFF',
                              textAlign: 'center',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              minHeight: '180px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center'
                            }}
                          >
                            <div style={{ marginBottom: '15px' }}>
                              <i className="fa fa-building" style={{ fontSize: '32px', color: '#274171' }}></i>
                            </div>
                            <h5 style={{ color: '#2D3748', fontWeight: '600', marginBottom: '10px' }}>Standard Lease Agreement</h5>
                            <p style={{ color: '#718096', fontSize: '13px', margin: 0 }}>For commercial, retail, office, and other general lease purposes</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : showPowerOfAttorneySubOptions ? (
                    <div>
                      {/* Back button */}
                      <div className="mb-4">
                        <button
                          onClick={handleBackToMainOptions}
                          className="btn"
                          style={{
                            backgroundColor: '#274171',
                            color: 'white',
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '5px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <i className="fa fa-arrow-left"></i> Back to Document Types
                        </button>
                      </div>
                      
                      {/* Power of Attorney type selection */}
                      <div className="text-center mb-4">
                        <h4 style={{ color: '#274171', marginBottom: '10px' }}>Choose Power of Attorney Type</h4>
                        <p style={{ color: '#718096', fontSize: '14px' }}>Select the type of power of attorney you need:</p>
                      </div>
                      
                      <div className="row g-4 justify-content-center">
                        <div className="col-md-4">
                          <div
                            onClick={() => handlePowerOfAttorneyTypeSelect('durable-financial-power-of-attorney')}
                            className="poa-type-card"
                            style={{
                              cursor: 'pointer',
                              border: selectedSubtype === 'durable_financial' ? '2px solid #274171' : '1px solid #E2E8F0',
                              borderRadius: '8px',
                              transition: 'all 0.3s ease',
                              padding: '25px 15px',
                              backgroundColor: selectedSubtype === 'durable_financial' ? '#F7FAFC' : '#FFFFFF',
                              textAlign: 'center',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              minHeight: '200px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center'
                            }}
                          >
                            <div style={{ marginBottom: '15px' }}>
                              <i className="fa fa-university" style={{ fontSize: '32px', color: '#274171' }}></i>
                            </div>
                            <h5 style={{ color: '#2D3748', fontWeight: '600', marginBottom: '10px' }}>Durable Financial</h5>
                            <p style={{ color: '#718096', fontSize: '12px', margin: 0 }}>Manage financial affairs and assets with lasting authority</p>
                          </div>
                        </div>
                        
                        <div className="col-md-4">
                          <div
                            onClick={() => handlePowerOfAttorneyTypeSelect('limited-special-power-of-attorney')}
                            className="poa-type-card"
                            style={{
                              cursor: 'pointer',
                              border: selectedSubtype === 'limited_special' ? '2px solid #274171' : '1px solid #E2E8F0',
                              borderRadius: '8px',
                              transition: 'all 0.3s ease',
                              padding: '25px 15px',
                              backgroundColor: selectedSubtype === 'limited_special' ? '#F7FAFC' : '#FFFFFF',
                              textAlign: 'center',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              minHeight: '200px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center'
                            }}
                          >
                            <div style={{ marginBottom: '15px' }}>
                              <i className="fa fa-tasks" style={{ fontSize: '32px', color: '#274171' }}></i>
                            </div>
                            <h5 style={{ color: '#2D3748', fontWeight: '600', marginBottom: '10px' }}>Limited Special</h5>
                            <p style={{ color: '#718096', fontSize: '12px', margin: 0 }}>For specific tasks or limited time periods</p>
                          </div>
                        </div>
                        
                        <div className="col-md-4">
                          <div
                            onClick={() => handlePowerOfAttorneyTypeSelect('real-estate-power-of-attorney')}
                            className="poa-type-card"
                            style={{
                              cursor: 'pointer',
                              border: selectedSubtype === 'real_estate' ? '2px solid #274171' : '1px solid #E2E8F0',
                              borderRadius: '8px',
                              transition: 'all 0.3s ease',
                              padding: '25px 15px',
                              backgroundColor: selectedSubtype === 'real_estate' ? '#F7FAFC' : '#FFFFFF',
                              textAlign: 'center',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              minHeight: '200px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center'
                            }}
                          >
                            <div style={{ marginBottom: '15px' }}>
                              <i className="fa fa-home" style={{ fontSize: '32px', color: '#274171' }}></i>
                            </div>
                            <h5 style={{ color: '#2D3748', fontWeight: '600', marginBottom: '10px' }}>Real Estate</h5>
                            <p style={{ color: '#718096', fontSize: '12px', margin: 0 }}>For property transactions and real estate matters</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Document-Specific Form */}
                  {selectedDocument && (
                    <DocumentFormFactory
                      documentType={selectedDocument}
                      formData={documentFormData}
                      onFormDataChange={handleDocumentFormDataChange}
                      onProceed={handleProceedFromForm}
                    />
                  )}

                  {/* Form Actions - Only show when no document is selected */}
                  {!selectedDocument && (
                    <div className="actions">
                      <div className="d-flex justify-content-between align-items-center mt-5" style={{ paddingBottom: '5px' }}>
                {/* <Link href="/" className="text-decoration-none">
                  <span
                    className="btn"
                    style={{ 
                      backgroundColor: "#274171",
                      color: 'white',
                      padding: '10px 30px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginRight: '465px',
                      marginBottom: '-170px',
                      position: 'relative',
                      left: '20px'
                    }}
                  >
                    <i className="fa fa-arrow-left"></i> Back
                  </span>
                </Link> */}
                      <span
                        className="btn"
                        style={{ 
                          backgroundColor: "#274171",
                          color: 'white',
                          padding: '10px 30px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '-170px',
                          cursor: 'pointer',
                          position: 'relative',
                          right: '20px'
                        }}
                        onClick={handleNext}
                      >
                        Next <i className="fa fa-arrow-right"></i>
                      </span>
                    </div>
                  </div>
                  )}
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        width: '300px', 
        position: 'fixed', 
        right: 0, 
        top: 0, 
        height: '100vh',
        borderLeft: '1px solid rgba(0,0,0,0.1)',
        backgroundColor: '#091534'
      }}>
        <FormProgressSidebar currentStep={1} />
      </div>
    </div>
  );
};

export default Form2step2;
