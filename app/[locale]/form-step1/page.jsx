"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import FormProgressSidebar from '@/components/FormProgressSidebar';
import { saveFormData, getFormData } from '@/utils/formStorage';

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

export default function DocumentSelectionPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split('/')?.[1] || '';
  const t = useTranslations();
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedLeaseType, setSelectedLeaseType] = useState(null);
  const [showLeaseSubOptions, setShowLeaseSubOptions] = useState(false);
  const [selectedSubtype, setSelectedSubtype] = useState(null);
  const [showPowerOfAttorneySubOptions, setShowPowerOfAttorneySubOptions] = useState(false);

  // Load saved data when component mounts
  useEffect(() => {
    const savedData = getFormData().step1;
    const urlParams = new URLSearchParams(window.location.search);
    const docFromUrl = urlParams.get('doc');
    
    if (docFromUrl) {
      // Pre-select document from URL parameter
      handleDocumentSelect(docFromUrl);
    } else if (savedData && savedData.documentType) {
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
        // If the saved type is the old general power-of-attorney, show sub-options
        setShowPowerOfAttorneySubOptions(true);
        setSelectedDocument(null);
        setSelectedSubtype(null);
      } else {
        // Regular document type
        setSelectedDocument(docType);
      }
    }
  }, []);

  const handleDocumentSelect = (docId) => {
    setSelectedDocument(docId);
    
    // Save selection
    const formData = getFormData();
    saveFormData(1, {
      ...formData.step1,
      documentType: docId
    });

    // Handle special cases
    if (docId === 'lease-agreement') {
      setShowLeaseSubOptions(true);
      setSelectedDocument(null);
    } else if (docId === 'power-of-attorney') {
      setShowPowerOfAttorneySubOptions(true);
      setSelectedDocument(null);
    } else {
      // Regular document - proceed to next step
      setTimeout(() => {
        router.push(`/${locale}/form-step2`);
      }, 300);
    }
  };

  const handleLeaseTypeSelect = (leaseType) => {
    setSelectedLeaseType(leaseType);
    setSelectedDocument(leaseType);
    
    // Save selection
    const formData = getFormData();
    saveFormData(1, {
      ...formData.step1,
      documentType: leaseType
    });

    // Proceed to next step
    setTimeout(() => {
      router.push(`/${locale}/form-step2`);
    }, 300);
  };

  const handlePowerOfAttorneySubtypeSelect = (subtype) => {
    setSelectedSubtype(subtype);
    const docType = `power-of-attorney-${subtype.replace('_', '-')}`;
    setSelectedDocument(docType);
    
    // Save selection
    const formData = getFormData();
    saveFormData(1, {
      ...formData.step1,
      documentType: docType
    });

    // Proceed to next step
    setTimeout(() => {
      router.push(`/${locale}/form-step2`);
    }, 300);
  };

  const handleBackToMainOptions = () => {
    setShowLeaseSubOptions(false);
    setShowPowerOfAttorneySubOptions(false);
    setSelectedDocument(null);
    setSelectedLeaseType(null);
    setSelectedSubtype(null);
  };

  const handleNext = () => {
    if (selectedDocument) {
      router.push(`/${locale}/form-step2`);
    } else {
      alert('Please select a document to proceed');
    }
  };

  return (
    <>
      <style jsx>{`
        .form-page-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          margin-right: 300px; /* Account for fixed sidebar */
        }
        
        .form-main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .form-header {
          padding: 1rem;
          background-color: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .form-content-area {
          flex: 1;
          padding: 2rem;
          background-color: #f8f9fa;
        }
        
        .form-card {
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          padding: 2rem;
          margin-bottom: 2rem;
        }
        
        .form-title {
          color: #2D3748;
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        
        .form-subtitle {
          color: #718096;
          font-size: 16px;
          margin-bottom: 2rem;
        }
        
        .document-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .document-card {
          cursor: pointer;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          transition: all 0.3s ease;
          padding: 20px;
          background-color: #FFFFFF;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 15px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          min-height: 160px;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        
        .document-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .document-card.selected {
          border: 2px solid #274171;
          background-color: #F7FAFC;
        }
        
        .document-icon {
          width: 40px;
          height: 40px;
          object-fit: contain;
          pointer-events: none;
        }
        
        .document-title {
          margin: 0;
          font-size: 14px;
          font-weight: 500;
          color: #2D3748;
          text-align: center;
          pointer-events: none;
        }
        
        .subtype-section {
          margin-bottom: 2rem;
        }
        
        .subtype-header {
          display: flex;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .subtype-title {
          margin: 0;
          color: #2D3748;
          font-size: 1.25rem;
          font-weight: 600;
        }
        
        .back-button {
          background-color: #6c757d;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        
        .back-button:hover {
          background-color: #5a6268;
        }
        
        .next-button {
          background-color: #274171;
          color: white;
          border: none;
          padding: 10px 30px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .next-button:hover {
          background-color: #1a2d4a;
          transform: translateY(-1px);
        }
        
        .progress-sidebar {
          width: 300px;
          position: fixed;
          right: 0;
          top: 0;
          height: 100vh;
          border-left: 1px solid rgba(0,0,0,0.1);
          background-color: #091534;
          z-index: 1000;
        }
        
        /* Mobile styles */
        @media (max-width: 768px) {
          .form-page-container {
            flex-direction: column;
            margin-right: 0; /* Remove margin on mobile */
          }
          
          .form-content-area {
            padding: 1rem;
            margin-bottom: 0;
          }
          
          .form-card {
            padding: 1.5rem;
            margin-bottom: 1rem;
          }
          
          .form-title {
            font-size: 24px;
            text-align: center;
          }
          
          .form-subtitle {
            font-size: 14px;
            text-align: center;
          }
          
          .document-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
          }
          
          .document-card {
            padding: 15px;
            min-height: 140px;
          }
          
          .document-icon {
            width: 35px;
            height: 35px;
          }
          
          .document-title {
            font-size: 13px;
          }
          
          .subtype-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          
          .subtype-title {
            font-size: 1.1rem;
          }
          
          .progress-sidebar {
            display: none;
          }
          
          .next-button {
            width: 100%;
            justify-content: center;
            padding: 12px 30px;
          }
        }
        
        /* Tablet styles */
        @media (min-width: 769px) and (max-width: 1024px) {
          .form-page-container {
            margin-right: 250px; /* Adjust for smaller sidebar */
          }
          
          .form-content-area {
            padding: 1.5rem;
          }
          
          .form-card {
            padding: 1.75rem;
          }
          
          .document-grid {
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 1.25rem;
          }
          
          .progress-sidebar {
            width: 250px;
          }
        }
        
        /* Large desktop styles */
        @media (min-width: 1200px) {
          .form-content-area {
            padding: 3rem;
          }
          
          .form-card {
            padding: 3rem;
          }
          
          .document-grid {
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem;
          }
        }
        
        /* Extra small mobile */
        @media (max-width: 480px) {
          .form-content-area {
            padding: 0.75rem;
          }
          
          .form-card {
            padding: 1rem;
          }
          
          .form-title {
            font-size: 20px;
          }
          
          .form-subtitle {
            font-size: 13px;
          }
          
          .document-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          
          .document-card {
            padding: 12px;
            min-height: 120px;
          }
          
          .document-icon {
            width: 30px;
            height: 30px;
          }
          
          .document-title {
            font-size: 12px;
          }
        }
      `}</style>
      
      <div className="form-page-container">
        <div className="form-header">
          <Link legacyBehavior href={`/${locale}`}>
            <a>
              <img
                src="/assets/images/logos/logo.png"
                style={{ height: '70px', maxWidth: '100%' }}
                alt="Logo"
                title="Logo"
              />
            </a>
          </Link>
        </div>

        <div className="form-main-content">
          <div className="form-content-area">
            <div className="form-card">
                {/* Form Header */}
                <div className="text-center mb-5">
                  <h2 className="form-title">Select Document Type</h2>
                  <p className="form-subtitle">Choose the type of document you want to notarize or e-sign</p>
                </div>

                <div className="form-content">
                  {!showLeaseSubOptions && !showPowerOfAttorneySubOptions ? (
                    <div className="document-grid">
                      {documentTypes.map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => handleDocumentSelect(doc.id)}
                          className={`document-card ${selectedDocument === doc.id ? 'selected' : ''}`}
                        >
                          <img
                            src={doc.icon}
                            alt={doc.title}
                            className="document-icon"
                          />
                          <h5 className="document-title">
                            {doc.title}
                          </h5>
                        </div>
                      ))}
                    </div>
                  ) : showLeaseSubOptions ? (
                    <div className="subtype-section">
                      <div className="subtype-header">
                        <button
                          onClick={handleBackToMainOptions}
                          className="back-button"
                        >
                          ← Back
                        </button>
                        <h4 className="subtype-title">Select Lease Agreement Type</h4>
                      </div>
                      <div className="document-grid">
                        <div
                          onClick={() => handleLeaseTypeSelect('residential-lease-agreement')}
                          className={`document-card ${selectedLeaseType === 'residential-lease-agreement' ? 'selected' : ''}`}
                        >
                          <img
                            src="/assets/v3/img/form-img04.png"
                            alt="Residential Lease Agreement"
                            className="document-icon"
                          />
                          <h5 className="document-title">
                            Residential Lease Agreement
                          </h5>
                        </div>
                        <div
                          onClick={() => handleLeaseTypeSelect('standard-lease-agreement')}
                          className={`document-card ${selectedLeaseType === 'standard-lease-agreement' ? 'selected' : ''}`}
                        >
                          <img
                            src="/assets/v3/img/form-img04.png"
                            alt="Standard Lease Agreement"
                            className="document-icon"
                          />
                          <h5 className="document-title">
                            Standard Lease Agreement
                          </h5>
                        </div>
                      </div>
                    </div>
                  ) : showPowerOfAttorneySubOptions ? (
                    <div className="subtype-section">
                      <div className="subtype-header">
                        <button
                          onClick={handleBackToMainOptions}
                          className="back-button"
                        >
                          ← Back
                        </button>
                        <h4 className="subtype-title">Select Power of Attorney Type</h4>
                      </div>
                      <div className="document-grid">
                        <div
                          onClick={() => handlePowerOfAttorneySubtypeSelect('durable_financial')}
                          className={`document-card ${selectedSubtype === 'durable_financial' ? 'selected' : ''}`}
                        >
                          <img
                            src="/assets/v3/img/form-img01.png"
                            alt="Durable Financial Power of Attorney"
                            className="document-icon"
                          />
                          <h5 className="document-title">
                            Durable Financial
                          </h5>
                        </div>
                        <div
                          onClick={() => handlePowerOfAttorneySubtypeSelect('limited_special')}
                          className={`document-card ${selectedSubtype === 'limited_special' ? 'selected' : ''}`}
                        >
                          <img
                            src="/assets/v3/img/form-img01.png"
                            alt="Limited Special Power of Attorney"
                            className="document-icon"
                          />
                          <h5 className="document-title">
                            Limited Special
                          </h5>
                        </div>
                        <div
                          onClick={() => handlePowerOfAttorneySubtypeSelect('real_estate')}
                          className={`document-card ${selectedSubtype === 'real_estate' ? 'selected' : ''}`}
                        >
                          <img
                            src="/assets/v3/img/form-img01.png"
                            alt="Real Estate Power of Attorney"
                            className="document-icon"
                          />
                          <h5 className="document-title">
                            Real Estate
                          </h5>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Next Button */}
                  {selectedDocument && (
                    <div className="text-center mt-4">
                      <button
                        className="next-button"
                        onClick={handleNext}
                      >
                        Next <i className="fa fa-arrow-right"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      

      <div className="progress-sidebar">
        <FormProgressSidebar currentStep={1} />
      </div>
    </>
  );
}
