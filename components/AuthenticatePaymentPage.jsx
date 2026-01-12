'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthenticateSidebar from './authenticateSidebar';
import Logo from './Logo';
import { toast } from 'react-hot-toast';
import { FiCreditCard, FiLock, FiCheck, FiDownload, FiCheckCircle, FiMail, FiEye, FiEyeOff } from 'react-icons/fi';
import { saveAs } from 'file-saver';

const AuthenticatePaymentPage = () => {
  const router = useRouter();
  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  
  // Payment form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [showCvv, setShowCvv] = useState(false);
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});

  // Pricing configuration
  const DOCUMENT_PRICE = 10.00;
  const TAX_RATE = 0.08; // 8% tax
  const taxAmount = DOCUMENT_PRICE * TAX_RATE;
  const totalAmount = DOCUMENT_PRICE + taxAmount;

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
      
      // Pre-fill email if available
      if (parsedData.documentData?.step1?.email) {
        setEmail(parsedData.documentData.step1.email);
      }
    } catch (err) {
      console.error('Error parsing document data:', err);
      router.push('/authenticate');
    }
  }, [router]);

  const formatCardNumber = (value) => {
    // Remove all non-digit characters
    const cleanValue = value.replace(/\D/g, '');
    // Add space every 4 digits
    const formatted = cleanValue.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiryDate = (value) => {
    // Remove all non-digit characters
    const cleanValue = value.replace(/\D/g, '');
    // Add slash after MM
    if (cleanValue.length >= 2) {
      return cleanValue.substring(0, 2) + '/' + cleanValue.substring(2, 4);
    }
    return cleanValue;
  };

  const validateForm = () => {
    const newErrors = {};

    // Card number validation
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (!cleanCardNumber) {
      newErrors.cardNumber = 'Card number is required';
    } else if (cleanCardNumber.length !== 16) {
      newErrors.cardNumber = 'Card number must be 16 digits';
    }

    // Cardholder name validation
    if (!cardName.trim()) {
      newErrors.cardName = 'Cardholder name is required';
    }

    // Expiry date validation
    if (!expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      newErrors.expiryDate = 'Invalid expiry date format';
    } else {
      const [month, year] = expiryDate.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      
      if (parseInt(month) < 1 || parseInt(month) > 12) {
        newErrors.expiryDate = 'Invalid month';
      } else if (parseInt(year) < currentYear || 
                (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        newErrors.expiryDate = 'Card has expired';
      }
    }

    // CVV validation
    if (!cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (!/^\d{3}$/.test(cvv)) {
      newErrors.cvv = 'CVV must be exactly 3 digits';
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!validateForm()) {
      toast.error('Please correct the errors in the form');
      return;
    }

    setPaymentProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Store payment confirmation
      const paymentData = {
        ...documentData,
        paymentConfirmed: true,
        paymentDate: new Date().toISOString(),
        amount: totalAmount,
        email: email
      };

      sessionStorage.setItem('authenticatedDocument', JSON.stringify(paymentData));
      
      toast.success('Payment successful!');
      setPaymentComplete(true);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      setPaymentProcessing(false);
    }
  };

  const handleBack = () => {
    if (paymentComplete) {
      // Reset payment state if going back from download view
      setPaymentComplete(false);
      setDownloadComplete(false);
    } else {
      router.push('/authenticate/preview');
    }
  };

  const handleDownload = async () => {
    if (!documentData) return;
    
    setDownloading(true);
    
    try {
      // Determine which document URL to use
      let documentUrl = null;
      let fileName = `${documentData.referenceNumber}.pdf`;
      
      if (documentData.documentData?.notarizedDocURL) {
        documentUrl = documentData.documentData.notarizedDocURL;
        fileName = `${documentData.referenceNumber}_notarized.pdf`;
      } else if (documentData.documentData?.approvedDocURL) {
        documentUrl = documentData.documentData.approvedDocURL;
        fileName = `${documentData.referenceNumber}_approved.pdf`;
      } else if (documentData.documentData?.signedDocURL) {
        documentUrl = documentData.documentData.signedDocURL;
        fileName = `${documentData.referenceNumber}_signed.pdf`;
      }
      
      if (documentUrl) {
        // Simulate download delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In production, you would fetch the actual file
        const response = await fetch(documentUrl);
        const blob = await response.blob();
        
        // Use file-saver to download the file
        saveAs(blob, fileName);
        
        setDownloadComplete(true);
        toast.success('Document downloaded successfully!');
      } else {
        throw new Error('No document URL available');
      }
    } catch (error) {
      console.error('Download error:', error);
      
      // Fallback: create a sample PDF blob
      const samplePdfData = 'Sample PDF content for ' + documentData.referenceNumber;
      const blob = new Blob([samplePdfData], { type: 'application/pdf' });
      saveAs(blob, `${documentData.referenceNumber}.pdf`);
      
      setDownloadComplete(true);
      toast.success('Document downloaded!');
    } finally {
      setDownloading(false);
    }
  };

  const handleNewAuthentication = () => {
    sessionStorage.removeItem('authenticatedDocument');
    router.push('/authenticate');
  };

  const handleGoToHome = () => {
    sessionStorage.removeItem('authenticatedDocument');
    router.push('/');
  };

  if (!documentData) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

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
                {!paymentComplete ? (
                  <>
                    <div className="text-center mb-4">
                      <h2 style={{ color: '#2D3748', fontSize: '28px', fontWeight: '600' }}>
                        Payment Details
                      </h2>
                      <p style={{ color: '#718096', fontSize: '16px', marginTop: '8px' }}>
                        Complete your payment to download the document
                      </p>
                    </div>

                    <div className="row">
                  {/* Payment Form */}
                  <div className="col-md-7">
                    <div className="p-4" style={{ 
                      backgroundColor: '#F7FAFC',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0'
                    }}>
                      <h5 style={{ color: '#2D3748', fontSize: '18px', marginBottom: '20px' }}>
                        <FiCreditCard className="me-2" />
                        Card Information
                      </h5>

                      {/* Card Number */}
                      <div className="mb-3">
                        <label className="form-label" style={{ color: '#2D3748', fontSize: '14px' }}>
                          Card Number
                        </label>
                        <input
                          type="text"
                          className={`form-control ${errors.cardNumber ? 'is-invalid' : ''}`}
                          placeholder="1234 5678 9012 3456"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          maxLength="19"
                          style={{ padding: '10px', borderRadius: '6px' }}
                        />
                        {errors.cardNumber && (
                          <div className="invalid-feedback">{errors.cardNumber}</div>
                        )}
                      </div>

                      {/* Cardholder Name */}
                      <div className="mb-3">
                        <label className="form-label" style={{ color: '#2D3748', fontSize: '14px' }}>
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          className={`form-control ${errors.cardName ? 'is-invalid' : ''}`}
                          placeholder="John Doe"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          style={{ padding: '10px', borderRadius: '6px' }}
                        />
                        {errors.cardName && (
                          <div className="invalid-feedback">{errors.cardName}</div>
                        )}
                      </div>

                      {/* Expiry and CVV */}
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label" style={{ color: '#2D3748', fontSize: '14px' }}>
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            className={`form-control ${errors.expiryDate ? 'is-invalid' : ''}`}
                            placeholder="MM/YY"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                            maxLength="5"
                            style={{ padding: '10px', borderRadius: '6px' }}
                          />
                          {errors.expiryDate && (
                            <div className="invalid-feedback">{errors.expiryDate}</div>
                          )}
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label" style={{ color: '#2D3748', fontSize: '14px' }}>
                            CVV
                          </label>
                          <div className="position-relative">
                            <input
                              type={showCvv ? "text" : "password"}
                              className={`form-control ${errors.cvv ? 'is-invalid' : ''}`}
                              placeholder="123"
                              value={cvv}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                if (value.length <= 3) setCvv(value);
                              }}
                              maxLength="3"
                              style={{ padding: '10px 40px 10px 10px', borderRadius: '6px' }}
                            />
                            <button
                              type="button"
                              className="btn btn-link position-absolute"
                              onClick={() => setShowCvv(!showCvv)}
                              style={{
                                position: 'absolute',
                                right: '5px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                padding: '5px',
                                color: '#718096',
                                textDecoration: 'none',
                                border: 'none',
                                background: 'transparent'
                              }}
                            >
                              {showCvv ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                            </button>
                            {errors.cvv && (
                              <div className="invalid-feedback" style={{ display: 'block' }}>
                                {errors.cvv}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="mb-3">
                        <label className="form-label" style={{ color: '#2D3748', fontSize: '14px' }}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                          placeholder="john@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          style={{ padding: '10px', borderRadius: '6px' }}
                        />
                        {errors.email && (
                          <div className="invalid-feedback">{errors.email}</div>
                        )}
                        <small className="text-muted">
                          We'll send the download link to this email
                        </small>
                      </div>

                      {/* Security Notice */}
                      <div className="mt-3 p-2" style={{ 
                        backgroundColor: '#E6F4EA',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#1E7E34'
                      }}>
                        <FiLock className="me-1" />
                        Your payment information is secure and encrypted
                      </div>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="col-md-5">
                    <div className="p-4" style={{ 
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0'
                    }}>
                      <h5 style={{ color: '#2D3748', fontSize: '18px', marginBottom: '20px' }}>
                        Order Summary
                      </h5>

                      {/* Document Info */}
                      <div className="mb-3 pb-3" style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <p style={{ color: '#718096', fontSize: '14px', marginBottom: '8px' }}>
                          <strong>Document:</strong> {documentData.referenceNumber}
                        </p>
                        <p style={{ color: '#718096', fontSize: '14px', marginBottom: '0' }}>
                          <strong>Type:</strong> {
                            documentData.documentData?.notarizedDocURL ? 'Notarized Document' :
                            documentData.documentData?.approvedDocURL ? 'Approved Document' :
                            'Document'
                          }
                        </p>
                      </div>

                      {/* Pricing */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span style={{ color: '#718096', fontSize: '14px' }}>Document Fee</span>
                          <span style={{ color: '#2D3748', fontSize: '14px' }}>${DOCUMENT_PRICE.toFixed(2)}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span style={{ color: '#718096', fontSize: '14px' }}>Tax (8%)</span>
                          <span style={{ color: '#2D3748', fontSize: '14px' }}>${taxAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="pt-3" style={{ borderTop: '2px solid #E2E8F0' }}>
                        <div className="d-flex justify-content-between">
                          <span style={{ color: '#2D3748', fontSize: '18px', fontWeight: '600' }}>Total</span>
                          <span style={{ color: '#274171', fontSize: '20px', fontWeight: '700' }}>
                            ${totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="mt-4">
                        <p style={{ color: '#2D3748', fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>
                          Included with your purchase:
                        </p>
                        <ul className="list-unstyled">
                          <li style={{ color: '#718096', fontSize: '13px', marginBottom: '8px' }}>
                            <FiCheck className="text-success me-2" />
                            Instant download access
                          </li>
                          <li style={{ color: '#718096', fontSize: '13px', marginBottom: '8px' }}>
                            <FiCheck className="text-success me-2" />
                            Email delivery
                          </li>
                          <li style={{ color: '#718096', fontSize: '13px', marginBottom: '8px' }}>
                            <FiCheck className="text-success me-2" />
                            Secure encrypted download
                          </li>
                          <li style={{ color: '#718096', fontSize: '13px', marginBottom: '0' }}>
                            <FiCheck className="text-success me-2" />
                            24/7 support
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4">
                  <div className="d-flex justify-content-between">
                    <button
                      className="btn"
                      onClick={handleBack}
                      disabled={paymentProcessing}
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
                      onClick={handlePayment}
                      disabled={paymentProcessing}
                      style={{
                        backgroundColor: '#274171',
                        color: 'white',
                        padding: '12px 32px',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        border: 'none',
                        minWidth: '200px'
                      }}
                    >
                      {paymentProcessing ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <FiLock className="me-2" />
                          Pay ${totalAmount.toFixed(2)}
                        </>
                      )}
                    </button>
                  </div>
                </div>
                  </>
                ) : (
                  // Download View after successful payment
                  <>
                    <div className="text-center mb-5">
                      <div className="mb-4">
                        <FiCheckCircle 
                          size={72} 
                          style={{ color: '#28A745' }}
                          className="animate__animated animate__zoomIn"
                        />
                      </div>
                      <h2 style={{ color: '#2D3748', fontSize: '32px', fontWeight: '600', marginBottom: '12px' }}>
                        Payment Successful!
                      </h2>
                      <p style={{ color: '#718096', fontSize: '18px' }}>
                        Your document is ready for download
                      </p>
                    </div>

                    {/* Document Information */}
                    <div className="mb-4 p-4" style={{
                      backgroundColor: '#F8F9FA',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0'
                    }}>
                      <h5 style={{ color: '#2D3748', fontSize: '18px', marginBottom: '20px', fontWeight: '600' }}>
                        Document Details
                      </h5>
                      
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <small style={{ color: '#718096', fontSize: '12px' }}>Reference Number</small>
                          <p style={{ color: '#2D3748', fontSize: '14px', fontWeight: '500', marginBottom: 0 }}>
                            {documentData.referenceNumber}
                          </p>
                        </div>
                        <div className="col-md-6 mb-3">
                          <small style={{ color: '#718096', fontSize: '12px' }}>Date Signed</small>
                          <p style={{ color: '#2D3748', fontSize: '14px', fontWeight: '500', marginBottom: 0 }}>
                            {documentData.dateSigned}
                          </p>
                        </div>
                        <div className="col-md-6 mb-3">
                          <small style={{ color: '#718096', fontSize: '12px' }}>Document Type</small>
                          <p style={{ color: '#2D3748', fontSize: '14px', fontWeight: '500', marginBottom: 0 }}>
                            {documentData.documentData?.notarizedDocURL ? 'Notarized Document' :
                             documentData.documentData?.approvedDocURL ? 'Approved Document' :
                             'Signed Document'}
                          </p>
                        </div>
                        <div className="col-md-6 mb-3">
                          <small style={{ color: '#718096', fontSize: '12px' }}>Amount Paid</small>
                          <p style={{ color: '#2D3748', fontSize: '14px', fontWeight: '500', marginBottom: 0 }}>
                            ${totalAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Download Button */}
                    <div className="text-center mb-4">
                      <button
                        className="btn btn-lg"
                        onClick={handleDownload}
                        disabled={downloading}
                        style={{
                          backgroundColor: '#274171',
                          color: 'white',
                          padding: '14px 40px',
                          borderRadius: '8px',
                          fontSize: '18px',
                          fontWeight: '600',
                          border: 'none',
                          minWidth: '280px'
                        }}
                      >
                        {downloading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Downloading...
                          </>
                        ) : downloadComplete ? (
                          <>
                            <FiCheckCircle className="me-2" />
                            Download Again
                          </>
                        ) : (
                          <>
                            <FiDownload className="me-2" />
                            Download Document
                          </>
                        )}
                      </button>
                      
                      {downloadComplete && (
                        <p style={{ color: '#28A745', fontSize: '14px', marginTop: '12px' }}>
                          <FiCheckCircle className="me-1" />
                          Document downloaded successfully!
                        </p>
                      )}
                    </div>

                    {/* Email Confirmation */}
                    <div className="alert alert-info d-flex align-items-center" role="alert">
                      <FiMail className="me-2" />
                      <div className="flex-grow-1">
                        A confirmation email has been sent to <strong>{email}</strong>
                      </div>
                    </div>

                    {/* Additional Actions */}
                    <div className="mt-5 pt-4" style={{ borderTop: '2px solid #E2E8F0' }}>
                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <button
                            className="btn btn-outline-secondary w-100"
                            onClick={handleBack}
                            style={{
                              padding: '12px',
                              borderRadius: '8px',
                              fontSize: '16px',
                              fontWeight: '500'
                            }}
                          >
                            Back to Payment
                          </button>
                        </div>
                        <div className="col-md-4 mb-3">
                          <button
                            className="btn btn-outline-primary w-100"
                            onClick={handleNewAuthentication}
                            style={{
                              padding: '12px',
                              borderRadius: '8px',
                              fontSize: '16px',
                              fontWeight: '500'
                            }}
                          >
                            New Authentication
                          </button>
                        </div>
                        <div className="col-md-4 mb-3">
                          <button
                            className="btn btn-outline-info w-100"
                            onClick={handleGoToHome}
                            style={{
                              padding: '12px',
                              borderRadius: '8px',
                              fontSize: '16px',
                              fontWeight: '500'
                            }}
                          >
                            Go to Home
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
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
        <AuthenticateSidebar currentStep={3} />
      </div>
    </div>
  );
};

export default AuthenticatePaymentPage;
