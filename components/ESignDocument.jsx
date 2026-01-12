'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getFormData, getSubmissionId } from '@/utils/formStorage';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import SimplePDFViewer from './SimplePDFViewer';
import InteractivePDFSigner from './InteractivePDFSigner';
import { debugESign } from '@/utils/debugHelper';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const ESignDocument = () => {
  const router = useRouter();
  const t = useTranslations();
  const [formData, setFormData] = useState(null);
  const [submissionData, setSubmissionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSigningInProgress, setIsSigningInProgress] = useState(false);
  const [documentSigned, setDocumentSigned] = useState(false);
  const [signedDocumentUrl, setSignedDocumentUrl] = useState(null);
  const [showSignedVersion, setShowSignedVersion] = useState(false);
  
  // Interactive signature state
  const [showInteractiveSigner, setShowInteractiveSigner] = useState(false);
  const [userSignatures, setUserSignatures] = useState([]);
  const [signaturesPlaced, setSignaturesPlaced] = useState(false);

  // Load form data and submission from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedFormData = getFormData();
        setFormData(savedFormData);

        // Get submission ID and fetch from Firebase
        const submissionId = getSubmissionId();
        console.log('ESignDocument - Retrieved submission ID:', submissionId);
        if (submissionId) {
          const submissionRef = doc(db, 'formSubmissions', submissionId);
          const submissionDoc = await getDoc(submissionRef);
          
          if (submissionDoc.exists()) {
            setSubmissionData({ id: submissionId, ...submissionDoc.data() });
          } else {
            setError('Submission not found. Please restart the process.');
          }
        } else {
          // Check if we have document data, if so try to create submission first
          if (savedFormData.step2?.documentType === 'custom-document' && 
              savedFormData.documentForms?.['custom-document']?.documentUrl) {
            setError('Document found but submission not created. Please go back to step 3 and try again.');
          } else {
            setError('No submission found. Please restart the process.');
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load document data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle signature placement completion
  const handleSignaturesReady = (signatures) => {
    console.log('User signatures placed:', signatures);
    setUserSignatures(signatures);
    setShowInteractiveSigner(false);
    setSignaturesPlaced(signatures.length > 0);
    if (signatures.length > 0) {
      // Auto-proceed to signing with placed signatures
      setTimeout(() => {
        handleSignDocument(signatures);
      }, 500);
    }
  };
  
  // Toggle interactive signature mode
  const toggleSignatureMode = () => {
    if (!originalDocumentUrl) {
      setError('Document must be loaded first');
      return;
    }
    setShowInteractiveSigner(!showInteractiveSigner);
    if (!showInteractiveSigner) {
      // Clear existing signatures when entering interactive mode
      setUserSignatures([]);
      setSignaturesPlaced(false);
    }
  };

  const handleSignDocument = async (signatures = userSignatures) => {
    if (!submissionData || !formData) return;

    console.log('=== SIGNING DEBUG ===');
    console.log('Submission ID:', submissionData.id);
    console.log('Document URL from submission:', submissionData.documentUrl);
    console.log('User signatures:', signatures);
    
    setIsSigningInProgress(true);
    try {
      // Call the stamp-pdf API to apply the signature stamp
      const response = await fetch('/api/stamp-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: submissionData.id,
          userSignatures: signatures, // Include signature positions
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Document signed successfully
        setDocumentSigned(true);
        setSignedDocumentUrl(result.approvedDocURL);
        setShowSignedVersion(true);
        // Don't redirect immediately - let user see the signed document first
      } else {
        console.error('Signing failed:', result);
        setError(result.error + (result.details ? ` Details: ${result.details}` : ''));
      }
    } catch (error) {
      console.error('Error signing document:', error);
      setError('Failed to sign document. Please try again.');
    } finally {
      setIsSigningInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading your document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-danger">
              <h4>Error</h4>
              <p>{error}</p>
              <Link href="/form-step1" className="btn btn-primary">
                Start Over
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userName = formData?.step1 ? `${formData.step1.firstName || ''} ${formData.step1.lastName || ''}`.trim() : 'User';
  const documentType = formData?.step2?.documentType || 'document';
  
  // Get the document URL to display
  const originalDocumentUrl = submissionData?.documentUrl;
  
  // Validate document URL exists
  if (!originalDocumentUrl && !signedDocumentUrl) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-warning">
              <h4>Document Not Found</h4>
              <p>No document is available for signing. Please go back and upload a document first.</p>
              <Link href="/form-step2" className="btn btn-primary">
                Go Back to Upload
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const currentDocumentUrl = showSignedVersion ? signedDocumentUrl : originalDocumentUrl;
  
  // Debug logging
  console.log('ESignDocument Debug:');
  console.log('- Original URL:', originalDocumentUrl);
  console.log('- Signed URL:', signedDocumentUrl);
  console.log('- Current URL:', currentDocumentUrl);
  console.log('- Show signed version:', showSignedVersion);
  console.log('- Submission data:', submissionData);

  const handleProceedToCompletion = () => {
    router.push('/form-step4');
  };

  const toggleDocumentVersion = () => {
    setShowSignedVersion(!showSignedVersion);
  };

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Main Content */}
        <div className="col-12">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center py-3 px-4 border-bottom">
            <Link href="/">
              <img
                src="/assets/images/logos/logo.png"
                style={{ height: '60px' }}
                alt="Logo"
              />
            </Link>
            <h4 className="mb-0" style={{ color: '#2D3748' }}>
              Sign Your Document
            </h4>
            <Link href="/form-step3" className="btn btn-sm" style={{ backgroundColor: '#274171', color: 'white', border: 'none' }}>
              <i className="fa fa-arrow-left me-2"></i>
              Back
            </Link>
          </div>

          {/* Document Information Panel */}
          <div className="bg-light border-bottom p-4">
            <div className="row">
              <div className="col-md-8">
                <h5 className="mb-1">
                  {documentSigned 
                    ? (showSignedVersion ? 'Document Signed Successfully ✓' : 'Compare Documents') 
                    : 'Document Ready for Signing'
                  }
                </h5>
                <p className="text-muted mb-0">
                  {documentSigned 
                    ? (showSignedVersion 
                        ? `Your ${documentType.replace('-', ' ')} has been executed with digital stamp.`
                        : 'Toggle between original and signed versions to see the changes.'
                      )
                    : `Review your ${documentType.replace('-', ' ')} document and sign when ready.`
                  }
                </p>
                {documentSigned && (
                  <div className="mt-2">
                    <button 
                      className="btn btn-sm me-2"
                      onClick={toggleDocumentVersion}
                      style={{
                        backgroundColor: '#274171',
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      {showSignedVersion ? 'View Original' : 'View Signed'}
                    </button>
                    <span className="badge bg-success">
                      Currently viewing: {showSignedVersion ? 'Signed Version' : 'Original Version'}
                    </span>
                  </div>
                )}
              </div>
              <div className="col-md-4 text-md-end">
                <div className="d-flex align-items-center justify-content-md-end">
                  <div className="me-3">
                    <small className="text-muted">Signing as:</small>
                    <div className="fw-bold">{userName}</div>
                  </div>
                  <i className="fa fa-user-circle fa-2x text-primary"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Document Viewer Area */}
          <div className="document-viewer-container" style={{ height: 'calc(100vh - 200px)' }}>
            <div className="row h-100">
              <div className="col-lg-9 h-100">
                {/* Document Preview Area */}
                <div className="h-100 border-end position-relative">
                  {showInteractiveSigner && !showSignedVersion ? (
                    <InteractivePDFSigner
                      pdfUrl={originalDocumentUrl}
                      onSignaturesReady={handleSignaturesReady}
                      notaryName={userName}
                      isNotary={false}
                    />
                  ) : (
                    <SimplePDFViewer 
                      pdfUrl={currentDocumentUrl}
                      className="h-100"
                      title={showSignedVersion ? 'Signed Document' : 'Original Document'}
                    />
                  )}
                  {showSignedVersion && signedDocumentUrl && (
                    <div className="position-absolute" style={{ top: '10px', right: '70px', zIndex: 1000 }}>
                      <span className="badge bg-success">
                        <i className="fa fa-check-circle me-1"></i>
                        Signed & Stamped
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-lg-3 h-100">
                {/* Signature Panel */}
                <div className="h-100 bg-light p-4 d-flex flex-column">
                  <h6 className="mb-4">Electronic Signature</h6>
                  
                  {/* User Information */}
                  <div className="mb-4 p-3 bg-white rounded border">
                    <h6 className="mb-2">Signer Information</h6>
                    <div className="small">
                      <div><strong>Name:</strong> {userName}</div>
                      {formData?.step1?.email && (
                        <div><strong>Email:</strong> {formData.step1.email}</div>
                      )}
                      {formData?.step1?.jurisdictionOfDocumentUse && (
                        <div><strong>Jurisdiction:</strong> {formData.step1.jurisdictionOfDocumentUse}</div>
                      )}
                    </div>
                  </div>

                  {/* Signature Preview */}
                  <div className="mb-4 p-3 bg-white rounded border">
                    <h6 className="mb-2">Digital Signature</h6>
                    <div className="signature-preview p-3 border rounded text-center" 
                         style={{ backgroundColor: '#f8f9fa', fontFamily: 'cursive', fontSize: '18px' }}>
                      {userName}
                    </div>
                    <small className="text-muted mt-2 d-block">
                      This will be your digital signature on the document.
                    </small>
                  </div>

                  {/* Signature Stamp Preview */}
                  <div className="mb-4 p-3 bg-white rounded border">
                    <h6 className="mb-2">Document Stamp</h6>
                    <div className="small text-muted p-2 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
                      "This document has been executed by {userName} for use in the {formData?.step1?.jurisdictionOfDocumentUse || '[Jurisdiction]'} through www.wiscribbles.com on {new Date().toLocaleDateString('en-GB')}, under reference number [Generated]"
                    </div>
                    <small className="text-muted mt-2 d-block">
                      This stamp will be added to every page footer.
                    </small>
                  </div>


                  {/* Signature Status */}
                  {signaturesPlaced && (
                    <div className="mb-3 p-2 text-white rounded" style={{ backgroundColor: '#274171' }}>
                      <small>
                        <i className="fa fa-check me-1"></i>
                        {userSignatures.length} signature{userSignatures.length > 1 ? 's' : ''} placed
                      </small>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-auto">
                    {!documentSigned ? (
                      <>
                        {/* Signature Placement Button */}
                        <button
                          className="btn w-100 py-2 mb-2"
                          onClick={toggleSignatureMode}
                          disabled={isSigningInProgress}
                          style={{ 
                            fontSize: '14px', 
                            fontWeight: '500',
                            backgroundColor: showInteractiveSigner ? '#dc3545' : '#6c757d',
                            color: 'white',
                            border: 'none'
                          }}
                        >
                          <i className={`fa ${showInteractiveSigner ? 'fa-times' : 'fa-hand-pointer-o'} me-2`}></i>
                          {showInteractiveSigner ? 'Exit Signature Mode' : 'Place Signature'}
                        </button>
                        
                        {/* Sign Document Button */}
                        <button
                          className="btn w-100 py-3"
                          onClick={() => handleSignDocument()}
                          disabled={isSigningInProgress}
                          style={{ 
                            fontSize: '16px', 
                            fontWeight: '600',
                            backgroundColor: '#274171',
                            color: 'white',
                            border: 'none'
                          }}
                        >
                          {isSigningInProgress ? (
                            <>
                              <div className="spinner-border spinner-border-sm me-2" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              Signing Document...
                            </>
                          ) : (
                            <>
                              <i className="fa fa-pen me-2"></i>
                              {signaturesPlaced ? `Sign with ${userSignatures.length} Signature${userSignatures.length > 1 ? 's' : ''}` : `Sign as ${userName}`}
                            </>
                          )}
                        </button>
                        
                        <div className="mt-3 text-center">
                          <small className="text-muted">
                            {signaturesPlaced 
                              ? 'Your signatures are ready. Click "Sign" to apply them to the document.'
                              : 'You can place your signature anywhere on the document or use the default position.'
                            }
                          </small>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="alert alert-success mb-3">
                          <i className="fa fa-check-circle me-2"></i>
                          <strong>Document Signed Successfully!</strong>
                          <br />
                          <small>Your document has been stamped and is ready for use.</small>
                        </div>
                        
                        <button
                          className="btn w-100 py-3 mb-2"
                          onClick={handleProceedToCompletion}
                          style={{ 
                            fontSize: '16px', 
                            fontWeight: '600',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none'
                          }}
                        >
                          <i className="fa fa-arrow-right me-2"></i>
                          Continue to Download
                        </button>
                        
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ESignDocument;
