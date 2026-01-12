"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import FormProgressSidebar from './FormProgressSidebar';
import { toast } from 'react-hot-toast';
import { getFormData, saveFormData, clearFormData, getSubmissionId } from '@/utils/formStorage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import emailjs from '@emailjs/browser';

// Initialize EmailJS
emailjs.init("nWH88iJVBzhSqWLzz");

const Form2step5 = () => {
  const router = useRouter();
  const t = useTranslations();
  const [deliveryMethod, setDeliveryMethod] = useState('download');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [submissionData, setSubmissionData] = useState(null);
  const [processType, setProcessType] = useState(null); // 'esign' or 'notary'

  // Load saved data when component mounts
  useEffect(() => {
    const loadData = async () => {
      const savedData = getFormData();
      console.log('Initial form data loaded:', savedData);
      if (savedData) {
        setFormData(savedData);
        if (savedData.step5) {
          setDeliveryMethod(savedData.step5.deliveryMethod || 'download');
          setEmail(savedData.step5.email || '');
        }
        
        // Determine the process type from saved data
        const signingOption = savedData.step3?.signingOption;
        if (signingOption) {
          setProcessType(signingOption); // 'esign' or 'notary'
          console.log('Process type detected:', signingOption);
        }
        
        // Try to get submission data from Firebase if available
        const submissionId = getSubmissionId();
        if (submissionId) {
          try {
            const submissionRef = doc(db, 'formSubmissions', submissionId);
            const submissionDoc = await getDoc(submissionRef);
            if (submissionDoc.exists()) {
              const data = submissionDoc.data();
              setSubmissionData({ id: submissionId, ...data });
              
              // Also determine process type from submission data if not already set
              if (!signingOption && data.type) {
                setProcessType(data.type === 'notary' ? 'notary' : 'esign');
              }
              
              console.log('Submission data loaded:', {
                id: submissionId,
                type: data.type,
                status: data.status,
                hasNotarizedDoc: !!data.notarizedDocURL,
                hasApprovedDoc: !!data.approvedDocURL
              });
            }
          } catch (error) {
            console.error('Error fetching submission data:', error);
          }
        }
      }
    };
    
    loadData();
  }, []);

  // Save data when values change
  useEffect(() => {
    if (formData) {
      const step5Data = {
        deliveryMethod,
        email: deliveryMethod === 'email' ? email : ''
      };
      console.log('Saving step 5 data:', step5Data);
      saveFormData(5, step5Data);
    }
  }, [deliveryMethod, email, formData]);

  const sendDocumentByEmail = async () => {
    // Validate email
    if (!email || !email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!submissionData && !formData) {
      toast.error('Document not available');
      return;
    }

    try {
      setIsDownloading(true);
      
      // Show loading toast
      const loadingToast = toast.loading('Sending document to your email...');
      
      let documentURL = null;
      let documentType = 'document';
      
      // Determine which document URL to use based on process type and availability
      if (processType === 'notary') {
        // For notary process, prioritize notarized document
        if (submissionData?.notarizedDocURL) {
          documentURL = submissionData.notarizedDocURL;
          documentType = 'notarized document';
          console.log('Using notarized document URL:', documentURL);
        } else if (submissionData?.document?.notarizedUrl) {
          documentURL = submissionData.document.notarizedUrl;
          documentType = 'notarized document';
          console.log('Using notarized document URL from nested document:', documentURL);
        } else if (submissionData?.documentUrl || submissionData?.document?.originalUrl) {
          documentURL = submissionData?.documentUrl || submissionData?.document?.originalUrl;
          documentType = 'document (pending notarization)';
          console.log('Using original document URL (notarization pending):', documentURL);
        }
      } else if (processType === 'esign') {
        // For e-sign process, prioritize approved/signed document
        if (submissionData?.approvedDocURL) {
          documentURL = submissionData.approvedDocURL;
          documentType = 'signed document';
          console.log('Using e-signed document URL:', documentURL);
        } else if (submissionData?.documentUrl) {
          documentURL = submissionData.documentUrl;
          documentType = 'document (pending signature)';
          console.log('Using original document URL (e-sign pending):', documentURL);
        }
      }
      
      // Fallback to any available document URL
      if (!documentURL) {
        if (submissionData?.documentUrl) {
          documentURL = submissionData.documentUrl;
          documentType = 'document';
        } else if (formData?.step3?.documentUrl) {
          documentURL = formData.step3.documentUrl;
          documentType = 'document';
        } else if (formData?.step2?.documentUrl) {
          documentURL = formData.step2.documentUrl;
          documentType = 'document';
        }
      }
      
      if (!documentURL) {
        const errorMessage = processType === 'notary' 
          ? 'Notarized document not found. It may still be processing.'
          : 'Signed document not found. Please complete the signing process.';
        toast.error(errorMessage);
        console.error('No document URL found. Submission data:', submissionData);
        return;
      }
      
      // Validate document URL
      if (!documentURL || !documentURL.startsWith('http')) {
        toast.error('Invalid document URL. Please contact support.');
        console.error('Invalid document URL:', documentURL);
        return;
      }
      
      // Get user information
      const userName = formData?.step1 ? `${formData.step1.firstName || ''} ${formData.step1.lastName || ''}`.trim() : 'User';
      const referenceNumber = submissionData?.referenceNumber || formData?.referenceNumber || `DOC-${Date.now()}`;
      const documentTypeName = formData?.step2?.documentType || 'Document';
      
      // Create download link HTML
      const downloadLinkHTML = `<a href="${documentURL}" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #274171; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">Download Your ${documentType}</a>`;
      
      // Create detailed message
      const detailedMessage = `
Dear ${userName},

Your ${documentType} is ready for download!

Document Details:
- Type: ${documentTypeName}
- Reference Number: ${referenceNumber}
- Status: ${documentType.includes('signed') ? 'Signed and Ready' : 'Processed'}

You can download your document by clicking the button below or using this direct link:
${documentURL}

If you have any questions, please contact our support team.

Best regards,
WiScribbles Team
      `;
      
      // Template parameters for the new document delivery template
      // This matches the fields in your new template: template_ib55ck2
      const templateParams = {
        // Recipient email (some templates use 'email', others use 'to_email')
        email: email,
        to_email: email,  // Include both for compatibility
        
        // User name for personalization
        user_name: userName,
        
        // Document information
        document_type: documentTypeName,
        document_url: documentURL,
        document_status: documentType.includes('notarized') 
          ? 'Notarized and Ready' 
          : documentType.includes('signed') 
          ? 'Signed and Ready' 
          : 'Processed and Ready',
        
        // Reference number
        reference_number: referenceNumber,
        
        // Additional fields that might be useful
        download_link: documentURL,  // Alternative field name
        company_name: 'WiScribbles',
        current_date: new Date().toLocaleDateString(),
        current_year: new Date().getFullYear().toString()
      };

      console.log('=== EMAIL SENDING DEBUG ===');
      console.log('Using template: template_ib55ck2 (Document Delivery)');
      console.log('Document URL:', documentURL);
      console.log('Email recipient:', email);
      console.log('Reference number:', referenceNumber);
      console.log('Template parameters being sent:');
      console.log('- email:', templateParams.email);
      console.log('- user_name:', templateParams.user_name);
      console.log('- document_type:', templateParams.document_type);
      console.log('- document_url:', templateParams.document_url);
      console.log('- document_status:', templateParams.document_status);
      console.log('- reference_number:', templateParams.reference_number);

      // Initialize EmailJS if not already done
      if (typeof emailjs !== 'undefined' && emailjs.init) {
        emailjs.init('nWH88iJVBzhSqWLzz');
      }

      // Send email using EmailJS with the new document delivery template
      const response = await emailjs.send(
        'service_9wu43ho',     // Your service ID (same for all templates)
        'template_ib55ck2',    // NEW template ID for document delivery
        templateParams
      );
      
      // Note: template_bu0fm8i is for authentication emails
      // template_ib55ck2 is for document delivery emails

      console.log('EmailJS Response:', response);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (response.status === 200 || response.text === 'OK') {
        toast.success(
          <div>
            <strong>Email sent successfully!</strong>
            <br />
            <small>Check {email} for your document download link</small>
          </div>,
          { duration: 5000 }
        );
        
        // Optionally clear the email field after successful send
        // setEmail('');
      } else {
        throw new Error(`Failed to send email - Status: ${response.status}`);
      }
      
    } catch (error) {
      console.error('=== EMAIL SENDING ERROR ===');
      console.error('Error details:', error);
      console.error('Email recipient:', email);
      
      // Store variables in outer scope for fallback
      const fallbackData = {
        email,
        documentURL,
        documentType,
        referenceNumber,
        userName,
        documentTypeName
      };
      
      // Try fallback API method
      try {
        console.log('Attempting fallback email method...');
        console.log('Fallback data:', fallbackData);
        
        const fallbackResponse = await fetch('/api/send-document-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: fallbackData.email,
            documentUrl: fallbackData.documentURL,
            documentType: fallbackData.documentType,
            referenceNumber: fallbackData.referenceNumber,
            userName: fallbackData.userName,
            documentTypeName: fallbackData.documentTypeName
          })
        });
        
        const fallbackResult = await fallbackResponse.json();
        
        // Dismiss loading toast if it exists
        if (typeof loadingToast !== 'undefined') {
          toast.dismiss(loadingToast);
        }
        
        if (fallbackResult.success) {
          // Show alternative success message with copy link option
          toast(
            <div>
              <strong>Email service is temporarily unavailable</strong>
              <br />
              <small>Please copy this link to download your document:</small>
              <br />
              <input 
                type="text" 
                value={fallbackData.documentURL} 
                readOnly 
                onClick={(e) => {
                  e.target.select();
                  navigator.clipboard.writeText(fallbackData.documentURL);
                  toast.success('Link copied to clipboard!');
                }}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '4px',
                  fontSize: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              />
            </div>,
            { duration: 10000 }
          );
        } else {
          throw new Error(fallbackResult.error || 'Fallback email failed');
        }
      } catch (fallbackError) {
        console.error('Fallback email also failed:', fallbackError);
        
        // Dismiss loading toast if it exists
        if (typeof loadingToast !== 'undefined') {
          toast.dismiss(loadingToast);
        }
        
        // Show final error with multiple options
        toast(
          <div>
            <strong>Email service is currently unavailable</strong>
            <br />
            <small className="d-block mt-2">You have several options:</small>
            <div className="mt-2">
              <button 
                className="btn btn-sm btn-primary me-2"
                onClick={() => {
                  // Copy link to clipboard
                  navigator.clipboard.writeText(fallbackData.documentURL);
                  toast.success('Link copied! You can paste it in your email.');
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: '#274171',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                Copy Link
              </button>
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  // Open default email client with pre-filled content
                  const subject = encodeURIComponent(`Your Document - Reference: ${fallbackData.referenceNumber}`);
                  const body = encodeURIComponent(`Dear User,\n\nYour document is ready for download!\n\nDownload Link: ${fallbackData.documentURL}\n\nReference Number: ${fallbackData.referenceNumber}\n\nBest regards,\nWiScribbles Team`);
                  window.location.href = `mailto:${fallbackData.email}?subject=${subject}&body=${body}`;
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: '#6c757d',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white'
                }}
              >
                Open Email App
              </button>
            </div>
            <div className="mt-2">
              <small style={{ fontSize: '11px', color: '#666' }}>
                Document link: 
                <span 
                  style={{ 
                    fontSize: '10px', 
                    wordBreak: 'break-all',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText(fallbackData.documentURL);
                    toast.success('Link copied!');
                  }}
                >
                  {fallbackData.documentURL.substring(0, 50)}...
                </span>
              </small>
            </div>
          </div>,
          { duration: 15000 }
        );
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadDocument = async () => {
    console.log('=== DOWNLOAD DEBUG START ===');
    console.log('Process type:', processType);
    console.log('Submission data:', submissionData);
    console.log('Form data:', formData);
    
    if (!submissionData && !formData) {
      console.error('No submission data or form data available');
      toast.error('Document not available for download');
      return;
    }

    try {
      setIsDownloading(true);
      
      let downloadURL = null;
      let fileName = '';
      
      // Determine which document URL to use based on process type
      console.log('=== URL SELECTION LOGIC ===');
      if (processType === 'notary') {
        console.log('Processing notary document download');
        console.log('Available fields in submissionData:');
        console.log('- notarizedDocURL:', submissionData?.notarizedDocURL);
        console.log('- document.notarizedUrl:', submissionData?.document?.notarizedUrl);
        console.log('- documentUrl:', submissionData?.documentUrl);
        console.log('- document.originalUrl:', submissionData?.document?.originalUrl);
        
        // For notary process, prioritize notarized document
        if (submissionData?.notarizedDocURL) {
          downloadURL = submissionData.notarizedDocURL;
          fileName = `notarized_document_${submissionData?.referenceNumber || new Date().toISOString().slice(0, 10)}.pdf`;
          console.log('✅ Found notarizedDocURL:', downloadURL);
        } else if (submissionData?.document?.notarizedUrl) {
          downloadURL = submissionData.document.notarizedUrl;
          fileName = `notarized_document_${submissionData?.referenceNumber || new Date().toISOString().slice(0, 10)}.pdf`;
          console.log('✅ Found nested notarizedUrl:', downloadURL);
        } else if (submissionData?.documentUrl || submissionData?.document?.originalUrl) {
          downloadURL = submissionData?.documentUrl || submissionData?.document?.originalUrl;
          fileName = `document_pending_notarization_${new Date().toISOString().slice(0, 10)}.pdf`;
          console.log('⚠️  Using original document (notarization pending):', downloadURL);
          toast.warning('Document is pending notarization. Downloading original version.');
        } else {
          console.error('❌ No document URLs found for notary process');
        }
      } else if (processType === 'esign') {
        // For e-sign process, prioritize approved/signed document
        if (submissionData?.approvedDocURL) {
          downloadURL = submissionData.approvedDocURL;
          fileName = `signed_document_${new Date().toISOString().slice(0, 10)}.pdf`;
          console.log('Downloading e-signed document:', downloadURL);
        } else if (submissionData?.documentUrl) {
          downloadURL = submissionData.documentUrl;
          fileName = `document_pending_signature_${new Date().toISOString().slice(0, 10)}.pdf`;
          console.log('Downloading original document (e-sign pending):', downloadURL);
          toast.warning('Document is pending signature. Downloading original version.');
        }
      }
      
      // Fallback to any available document URL
      if (!downloadURL) {
        if (submissionData?.documentUrl) {
          downloadURL = submissionData.documentUrl;
          fileName = `document_${new Date().toISOString().slice(0, 10)}.pdf`;
        } else if (formData?.step3?.documentUrl) {
          downloadURL = formData.step3.documentUrl;
          fileName = `document_${new Date().toISOString().slice(0, 10)}.pdf`;
        } else if (formData?.step2?.documentUrl) {
          downloadURL = formData.step2.documentUrl;
          fileName = `document_${new Date().toISOString().slice(0, 10)}.pdf`;
        }
      }
      
      console.log('=== FINAL URL CHECK ===');
      console.log('Final downloadURL:', downloadURL);
      console.log('Final fileName:', fileName);
      
      if (!downloadURL) {
        const errorMessage = processType === 'notary' 
          ? 'Notarized document not found. It may still be processing.'
          : 'Signed document not found. Please complete the signing process.';
        console.error('❌ DOWNLOAD FAILED - No URL found');
        console.error('Process type:', processType);
        console.error('Submission data available:', !!submissionData);
        console.error('Full submission data keys:', submissionData ? Object.keys(submissionData) : 'N/A');
        toast.error(errorMessage);
        return;
      }
      
      // Method 1: Use our API endpoint for server-side download (most reliable)
      try {
        // Show download progress
        const loadingToast = toast.loading('Preparing document for download...');
        
        // Use our API endpoint to handle the download
        const apiUrl = `/api/download-document?url=${encodeURIComponent(downloadURL)}&filename=${encodeURIComponent(fileName || `document_${new Date().toISOString().slice(0, 10)}.pdf`)}`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error('Failed to fetch document from server');
        }
        
        // Get the blob from response
        const blob = await response.blob();
        
        // Create object URL from blob
        const objectUrl = window.URL.createObjectURL(blob);
        
        // Create invisible download link
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName || `document_${new Date().toISOString().slice(0, 10)}.pdf`;
        link.style.display = 'none';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => {
          window.URL.revokeObjectURL(objectUrl);
        }, 100);
        
        // Show success
        toast.dismiss(loadingToast);
        toast.success('Document downloaded successfully!');
        console.log('Document downloaded successfully via API');
        
      } catch (apiError) {
        console.warn('API download failed, trying direct method:', apiError);
        toast.dismiss();
        
        // Method 2: Try direct download with blob (may face CORS issues)
        try {
          const response = await fetch(downloadURL);
          if (response.ok) {
            const blob = await response.blob();
            const objectUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = fileName || `document_${new Date().toISOString().slice(0, 10)}.pdf`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => window.URL.revokeObjectURL(objectUrl), 100);
            toast.success('Document downloaded successfully!');
            console.log('Document downloaded via direct blob method');
            return;
          }
        } catch (directError) {
          console.warn('Direct blob download failed:', directError);
        }
        
        // Method 3: Fallback using download attribute (least reliable but simplest)
        const link = document.createElement('a');
        link.href = downloadURL;
        link.download = fileName || `document_${new Date().toISOString().slice(0, 10)}.pdf`;
        link.style.display = 'none';
        
        // Force download attribute
        link.setAttribute('download', '');
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Document download started!');
        console.log('Document download initiated using fallback link method');
      }
      
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="d-flex">
      <div className="flex-grow-1" style={{ marginRight: '320px' }}>
        <div className="mt-4 ml-4">
          <Link legacyBehavior href="/">
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
                {/* Form Header - Dynamic based on process type */}
                <div className="text-center mb-5">
                  <h2 style={{ color: '#2D3748', fontSize: '28px', fontWeight: '600' }}>
                    {processType === 'notary' 
                      ? 'Download Your Notarized Document'
                      : processType === 'esign'
                      ? 'Download Your E-Signed Document'
                      : 'Download Your Document'
                    }
                  </h2>
                  <p style={{ color: '#718096', fontSize: '16px', marginTop: '8px' }}>
                    {processType === 'notary'
                      ? 'Your document has been successfully notarized. Choose how you would like to receive it.'
                      : processType === 'esign'
                      ? 'Your document has been successfully signed. Choose how you would like to receive it.'
                      : 'Your document is ready. Choose how you would like to receive it.'
                    }
                  </p>
                  {submissionData?.referenceNumber && (
                    <p style={{ color: '#4A5568', fontSize: '14px', marginTop: '12px' }}>
                      Reference Number: <strong>{submissionData.referenceNumber}</strong>
                    </p>
                  )}
                </div>

                {/* Delivery Method Selection */}
                <div className="row justify-content-center mb-5">
                  <div className="col-md-8">
                    <div className="d-flex gap-4">
                      <div
                        className={`delivery-option ${deliveryMethod === 'download' ? 'selected' : ''}`}
                        onClick={() => setDeliveryMethod('download')}
                        style={{
                          flex: 1,
                          padding: '20px',
                          border: '2px solid',
                          borderColor: deliveryMethod === 'download' ? '#274171' : '#E2E8F0',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: deliveryMethod === 'download' ? '#F7FAFC' : 'white',
                        }}
                      >
                        <h5 style={{ color: '#2D3748', marginBottom: '10px' }}>{t('Download')}</h5>
                        <p style={{ color: '#718096', margin: 0 }}>{t('Download your document directly')}</p>
                      </div>
                      
                      <div
                        className={`delivery-option ${deliveryMethod === 'email' ? 'selected' : ''}`}
                        onClick={() => setDeliveryMethod('email')}
                        style={{
                          flex: 1,
                          padding: '20px',
                          border: '2px solid',
                          borderColor: deliveryMethod === 'email' ? '#274171' : '#E2E8F0',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: deliveryMethod === 'email' ? '#F7FAFC' : 'white',
                        }}
                      >
                        <h5 style={{ color: '#2D3748', marginBottom: '10px' }}>{t('Email')}</h5>
                        <p style={{ color: '#718096', margin: 0 }}>{t('form2_receive_via_email')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Input (shown only when email delivery is selected) */}
                {deliveryMethod === 'email' && (
                  <div className="row justify-content-center mb-5">
                    <div className="col-md-8">
                      <div className="form-group">
                        <label className="form-label" htmlFor="email-input" style={{ color: '#4A5568', fontWeight: '500', marginBottom: '8px' }}>
                          {t('Email Address')} <span className="text-danger">*</span>
                        </label>
                        <input
                          id="email-input"
                          type="email"
                          className="form-control"
                          placeholder="johndoe@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          autoFocus
                          required
                          style={{
                            border: '2px solid #E2E8F0',
                            borderRadius: '6px',
                            padding: '12px',
                            fontSize: '15px',
                            height: '50px',
                            transition: 'border-color 0.3s',
                            outline: 'none'
                          }}
                          onMouseEnter={(e) => e.target.style.borderColor = '#274171'}
                          onMouseLeave={(e) => e.target.style.borderColor = '#E2E8F0'}
                        />
                        <small className="text-muted mt-1 d-block">
                          We'll send the document download link to this email address
                        </small>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="actions">
                  <div className="d-flex justify-content-between align-items-center mt-5" style={{ paddingBottom: '5px' }}>
                    <Link href="/form2-page4" className="text-decoration-none">
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
                          left: '150px',
                          border: 'none'
                        }}
                      >
                        <i className="fa fa-arrow-left"></i> {t('Back')}
                      </span>
                    </Link>
                    <button
                      onClick={deliveryMethod === 'email' ? sendDocumentByEmail : downloadDocument}
                      disabled={isDownloading}
                      className="btn"
                      style={{
                        backgroundColor: deliveryMethod === 'email' ? '#274171' : '#274171',
                        color: 'white',
                        padding: '10px 30px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '-170px',
                        position: 'relative',
                        right: '20px',
                        border: 'none',
                        opacity: isDownloading ? 0.7 : 1,
                        cursor: isDownloading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isDownloading ? (
                        <>
                          <i className="fa fa-spinner fa-spin"></i> {deliveryMethod === 'email' ? 'Sending...' : 'Downloading...'}
                        </>
                      ) : (
                        <>
                          <i className={deliveryMethod === 'email' ? 'fa fa-envelope' : 'fa fa-download'}></i> 
                          {deliveryMethod === 'email' ? 'Send Document' : 'Download Document'}
                        </>
                      )}
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
          <FormProgressSidebar currentStep={5} />
        </div>
      </div>
    </div>
  );
};

export default Form2step5;
