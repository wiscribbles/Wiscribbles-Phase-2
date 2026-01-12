"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import FormProgressSidebar from '@/components/FormProgressSidebar';
import { saveFormData, getFormData, saveDocumentFormData, getDocumentFormData } from '@/utils/formStorage';
import { saveDocumentFormDataLocalAndDB, getDocumentFormDataWithFallback } from '@/utils/documentFormStorage';
import DocumentFormFactory from '@/components/documentForms/DocumentFormFactory';
import { getDocumentConfig } from '@/config/documentTypes';

export default function DocumentFormPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split('/')?.[1] || '';
  const t = useTranslations();
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentFormData, setDocumentFormData] = useState({});
  const [documentConfig, setDocumentConfig] = useState(null);

  // Load saved data when component mounts
  useEffect(() => {
    const savedData = getFormData().step1;
    if (savedData && savedData.documentType) {
      setSelectedDocument(savedData.documentType);
    }
  }, []);

  // Load document configuration whenever selected document changes
  useEffect(() => {
    if (selectedDocument) {
      const cfg = getDocumentConfig(selectedDocument);
      setDocumentConfig(cfg);
    } else {
      setDocumentConfig(null);
    }
  }, [selectedDocument]);

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
    // Navigate to service selection step
    router.push(`/${locale}/form-step4`);
  }, [router, locale]);

  const handleBack = () => {
    router.push(`/${locale}/form-step2`);
  };

  if (!selectedDocument) {
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
                  <div className="text-center">
                    <h2 style={{ color: '#2D3748', fontSize: '28px', fontWeight: '600' }}>No Document Selected</h2>
                    <p style={{ color: '#718096', fontSize: '16px', marginTop: '8px' }}>
                      Please go back and select a document type first.
                    </p>
                    <button
                      className="btn"
                      onClick={handleBack}
                      style={{ 
                        backgroundColor: "#274171",
                        color: 'white',
                        padding: '10px 30px',
                        marginTop: '20px'
                      }}
                    >
                      <i className="fa fa-arrow-left me-2"></i> Go Back
                    </button>
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
          <FormProgressSidebar currentStep={3} />
        </div>
      </div>
    );
  }

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
        
        .document-form-container {
          margin-bottom: 2rem;
        }
        
        .navigation-buttons {
          display: flex;
          justify-content: space-between;
          margin-top: 2rem;
          gap: 1rem;
        }
        
        .btn {
          padding: 10px 30px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          border: none;
        }
        
        .btn-outline-secondary {
          background-color: transparent;
          color: #6c757d;
          border: 1px solid #6c757d;
        }
        
        .btn-outline-secondary:hover {
          background-color: #6c757d;
          color: white;
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
          
          .progress-sidebar {
            display: none;
          }
          
          .navigation-buttons {
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .btn {
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
                  <h2 className="form-title">
                    {(documentConfig?.title || selectedDocument || 'Document')} Form
                  </h2>
                  <p className="form-subtitle">
                    Please fill out the details for your {documentConfig?.title || selectedDocument || 'document'}
                  </p>
                </div>

                <div className="form-content">
                  <div className="document-form-container">
                    <DocumentFormFactory
                      documentType={selectedDocument}
                      formData={documentFormData}
                      onFormDataChange={handleDocumentFormDataChange}
                      onProceed={handleProceedFromForm}
                    />
                  </div>

                  {/* Navigation Buttons */}
                  <div className="navigation-buttons">
                    <button
                      onClick={handleBack}
                      className="btn btn-outline-secondary"
                    >
                      <i className="fa fa-arrow-left"></i> Back
                    </button>
                    {/* The DocumentFormFactory is expected to have its own "Next" button or call onProceed */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      

      <div className="progress-sidebar">
        <FormProgressSidebar currentStep={3} />
      </div>
    </>
  );
} 