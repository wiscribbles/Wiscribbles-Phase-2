'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthenticateSidebar from './authenticateSidebar';
import SimplePDFViewer from './SimplePDFViewer';
import Logo from './Logo';
import { toast } from 'react-hot-toast';

const DocumentPreviewPage = () => {
  const router = useRouter();
  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Retrieve authenticated document data from sessionStorage
    const authData = sessionStorage.getItem('authenticatedDocument');
    
    if (!authData) {
      // If no authenticated data, redirect back to authenticate page
      router.push('/authenticate');
      return;
    }

    try {
      const parsedData = JSON.parse(authData);
      setDocumentData(parsedData);
      setLoading(false);
    } catch (err) {
      console.error('Error parsing document data:', err);
      setError('Error loading document data');
      setLoading(false);
    }
  }, [router]);

  const handleProceedToPayment = () => {
    // Navigate to payment page
    router.push('/authenticate/payment');
  };

  const handleBack = () => {
    // Clear session data and go back to authenticate
    sessionStorage.removeItem('authenticatedDocument');
    router.push('/authenticate');
  };

  const getDocumentUrl = () => {
    if (!documentData?.documentData) return null;
    
    const data = documentData.documentData;
    
    // Priority: notarized > approved > original
    if (data.notarizedDocURL) return data.notarizedDocURL;
    if (data.approvedDocURL) return data.approvedDocURL;
    if (data.documentUrl) return data.documentUrl;
    if (data.step3?.documentUrl) return data.step3.documentUrl;
    if (data.document?.originalUrl) return data.document.originalUrl;
    
    return null;
  };

  const getDocumentType = () => {
    if (!documentData?.documentData) return 'Document';
    
    const data = documentData.documentData;
    
    if (data.notarizedDocURL) return 'Notarized Document';
    if (data.approvedDocURL) return 'Approved Document';
    if (data.type === 'notary') return 'Notarized Document';
    if (data.step3?.signingOption === 'esign') return 'E-Signed Document';
    
    return 'Document';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !documentData) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <h3 className="text-danger">{error || 'No document data available'}</h3>
          <button className="btn btn-primary mt-3" onClick={handleBack}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const documentUrl = getDocumentUrl();
  const documentType = getDocumentType();

  return (
    <div className="d-flex">
      <div className="flex-grow-1" style={{ marginRight: '320px' }}>
        <div className="mt-4" style={{ marginLeft: '22px' }}>
          <Logo variant="dark" size="default" />
        </div>

        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="form-card bg-white p-4 rounded-3">
                <div className="text-center mb-4">
                  <h2 style={{ color: '#2D3748', fontSize: '28px', fontWeight: '600' }}>
                    Document Preview
                  </h2>
                  <p style={{ color: '#718096', fontSize: '16px', marginTop: '8px' }}>
                    Review your {documentType.toLowerCase()} before proceeding to payment
                  </p>
                  <div className="mt-3">
                    <span className="badge" style={{ 
                      backgroundColor: '#E6F4EA', 
                      color: '#1E7E34',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      Reference: {documentData.referenceNumber}
                    </span>
                  </div>
                </div>

                {/* Document Preview Area */}
                <div className="row justify-content-center mb-4">
                  <div className="col-md-10">
                    <div style={{ 
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      height: '600px',
                      backgroundColor: '#F7FAFC'
                    }}>
                      {documentUrl ? (
                        <SimplePDFViewer 
                          pdfUrl={documentUrl}
                          title={documentType}
                          className="h-100"
                        />
                      ) : (
                        <div className="d-flex justify-content-center align-items-center h-100">
                          <div className="text-center text-muted">
                            <i className="fa fa-file-pdf-o fa-4x mb-3"></i>
                            <h4>Document Preview Not Available</h4>
                            <p>Please proceed to download the document</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Document Info */}
                <div className="row justify-content-center mb-4">
                  <div className="col-md-10">
                    <div className="p-3" style={{ 
                      backgroundColor: '#F7FAFC',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0'
                    }}>
                      <h5 style={{ color: '#2D3748', fontSize: '16px', marginBottom: '12px' }}>
                        Document Information
                      </h5>
                      <div className="row">
                        <div className="col-md-6">
                          <p style={{ color: '#718096', fontSize: '14px', marginBottom: '8px' }}>
                            <strong>Type:</strong> {documentType}
                          </p>
                          <p style={{ color: '#718096', fontSize: '14px', marginBottom: '8px' }}>
                            <strong>Reference:</strong> {documentData.referenceNumber}
                          </p>
                        </div>
                        <div className="col-md-6">
                          <p style={{ color: '#718096', fontSize: '14px', marginBottom: '8px' }}>
                            <strong>Status:</strong> {documentData.documentData.status || 'Ready for Download'}
                          </p>
                          <p style={{ color: '#718096', fontSize: '14px', marginBottom: '8px' }}>
                            <strong>Download Price:</strong> $10.00
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="row justify-content-center">
                  <div className="col-md-10">
                    <div className="d-flex justify-content-between">
                      <button
                        className="btn"
                        onClick={handleBack}
                        style={{
                          backgroundColor: '#6C757D',
                          color: 'white',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: '500',
                          border: 'none'
                        }}
                      >
                        <i className="fa fa-arrow-left me-2"></i>
                        Back
                      </button>
                      
                      <button
                        className="btn"
                        onClick={handleProceedToPayment}
                        style={{
                          backgroundColor: '#274171',
                          color: 'white',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: '500',
                          border: 'none'
                        }}
                      >
                        Proceed to Payment
                        <i className="fa fa-arrow-right ms-2"></i>
                      </button>
                    </div>
                  </div>
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
        <AuthenticateSidebar currentStep={2} />
      </div>
    </div>
  );
};

export default DocumentPreviewPage;
