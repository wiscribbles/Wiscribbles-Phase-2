"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import FormProgressSidebar from '@/components/FormProgressSidebar';
import { saveFormData, getFormData } from '@/utils/formStorage';

export default function PaymentPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split('/')?.[1] || '';
  const t = useTranslations();
  const [selectedService, setSelectedService] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
    billingCountry: ''
  });

  // Load saved data when component mounts
  useEffect(() => {
    const savedData = getFormData().step4;
    if (savedData && savedData.serviceType) {
      setSelectedService(savedData.serviceType);
    }

    const paymentData = getFormData().step5;
    if (paymentData) {
      setPaymentData(prev => ({ ...prev, ...paymentData }));
    }
  }, []);

  const handleInputChange = (field, value) => {
    const newData = { ...paymentData, [field]: value };
    setPaymentData(newData);
    
    // Save to localStorage
    const allFormData = getFormData();
    saveFormData(5, {
      ...allFormData.step5,
      ...newData
    });
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    
    // Save payment method
    const allFormData = getFormData();
    saveFormData(5, {
      ...allFormData.step5,
      paymentMethod: method
    });
  };

  const handleSubmit = () => {
    // Basic validation
    if (paymentMethod === 'credit-card') {
      const requiredFields = ['cardNumber', 'expiryDate', 'cvv', 'cardholderName'];
      const missingFields = requiredFields.filter(field => !paymentData[field]);
      
      if (missingFields.length > 0) {
        alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
        return;
      }
    }

    // Process payment (simulate)
    alert('Payment processed successfully! Redirecting to video call...');
    
    // Navigate to video call or completion page
    if (selectedService === 'notary') {
      router.push(`/${locale}/video-call`);
    } else {
      router.push(`/${locale}/form-success`);
    }
  };

  const handleBack = () => {
    router.push(`/${locale}/form-step4`);
  };

  const getServicePrice = () => {
    return selectedService === 'notary' ? '$50' : '$25';
  };

  const getServiceName = () => {
    return selectedService === 'notary' ? 'Notary Service' : 'E-Sign Only';
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
        
        .order-summary {
          background-color: #F7FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .summary-title {
          color: #2D3748;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        
        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid #E2E8F0;
        }
        
        .summary-item:last-child {
          border-bottom: none;
          font-weight: 600;
          color: #274171;
        }
        
        .summary-label {
          color: #718096;
          font-size: 14px;
        }
        
        .summary-value {
          color: #2D3748;
          font-size: 14px;
          font-weight: 500;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .form-field {
          display: flex;
          flex-direction: column;
        }
        
        .form-label {
          font-weight: 500;
          color: #2D3748;
          margin-bottom: 0.5rem;
          font-size: 14px;
        }
        
        .form-control {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        }
        
        .form-control:focus {
          border-color: #274171;
          box-shadow: 0 0 0 0.2rem rgba(39, 65, 113, 0.25);
          outline: none;
        }
        
        .form-control.is-invalid {
          border-color: #dc3545;
        }
        
        .form-select {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          background-color: white;
          cursor: pointer;
        }
        
        .form-select:focus {
          border-color: #274171;
          box-shadow: 0 0 0 0.2rem rgba(39, 65, 113, 0.25);
          outline: none;
        }
        
        .payment-info-box {
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        
        .payment-info-header {
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .payment-icon {
          width: 24px;
          height: 24px;
          margin-right: 8px;
        }
        
        .payment-title {
          font-weight: 500;
          color: #2D3748;
        }
        
        .payment-description {
          color: #6c757d;
          font-size: 14px;
          margin: 0;
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
        
        .btn-primary {
          background-color: #274171;
          color: white;
        }
        
        .btn-primary:hover {
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
          
          .form-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .form-control {
            padding: 0.6rem;
            font-size: 16px; /* Prevent zoom on iOS */
          }
          
          .form-select {
            padding: 0.6rem;
            font-size: 16px;
          }
          
          .order-summary {
            padding: 1rem;
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
          
          .form-grid {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
          
          .form-grid {
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
          
          .form-control {
            padding: 0.5rem;
          }
          
          .form-select {
            padding: 0.5rem;
          }
          
          .order-summary {
            padding: 0.75rem;
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
                  <h2 style={{ color: '#2D3748', fontSize: '28px', fontWeight: '600' }}>Payment Details</h2>
                  <p style={{ color: '#718096', fontSize: '16px', marginTop: '8px' }}>
                    Complete your payment to proceed with {getServiceName()}
                  </p>
                </div>

                <div className="form-content">
                  {/* Order Summary */}
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <div
                        style={{
                          backgroundColor: '#F7FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          padding: '20px'
                        }}
                      >
                        <h5 style={{ color: '#2D3748', marginBottom: '15px' }}>Order Summary</h5>
                        <div className="d-flex justify-content-between mb-2">
                          <span style={{ color: '#4A5568' }}>Service:</span>
                          <span style={{ color: '#2D3748', fontWeight: '500' }}>{getServiceName()}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span style={{ color: '#4A5568' }}>Price:</span>
                          <span style={{ color: '#2D3748', fontWeight: '500' }}>{getServicePrice()}</span>
                        </div>
                        <hr style={{ margin: '10px 0' }} />
                        <div className="d-flex justify-content-between">
                          <span style={{ color: '#2D3748', fontWeight: '600' }}>Total:</span>
                          <span style={{ color: '#274171', fontWeight: '700', fontSize: '18px' }}>{getServicePrice()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <div className="mb-4">
                    <h5 style={{ color: '#2D3748', marginBottom: '15px' }}>Payment Method</h5>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div
                          onClick={() => handlePaymentMethodChange('credit-card')}
                          style={{
                            cursor: 'pointer',
                            border: paymentMethod === 'credit-card' ? '2px solid #274171' : '1px solid #E2E8F0',
                            borderRadius: '8px',
                            padding: '15px',
                            backgroundColor: paymentMethod === 'credit-card' ? '#F7FAFC' : '#FFFFFF',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <div className="d-flex align-items-center">
                            <input
                              type="radio"
                              checked={paymentMethod === 'credit-card'}
                              onChange={() => handlePaymentMethodChange('credit-card')}
                              style={{ marginRight: '10px' }}
                            />
                            <span style={{ fontWeight: '500', color: '#2D3748' }}>Credit Card</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div
                          onClick={() => handlePaymentMethodChange('paypal')}
                          style={{
                            cursor: 'pointer',
                            border: paymentMethod === 'paypal' ? '2px solid #274171' : '1px solid #E2E8F0',
                            borderRadius: '8px',
                            padding: '15px',
                            backgroundColor: paymentMethod === 'paypal' ? '#F7FAFC' : '#FFFFFF',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <div className="d-flex align-items-center">
                            <input
                              type="radio"
                              checked={paymentMethod === 'paypal'}
                              onChange={() => handlePaymentMethodChange('paypal')}
                              style={{ marginRight: '10px' }}
                            />
                            <span style={{ fontWeight: '500', color: '#2D3748' }}>PayPal</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Form */}
                  {paymentMethod === 'credit-card' && (
                    <div className="row g-3">
                      <div className="col-12">
                        <h5 style={{ color: '#2D3748', marginBottom: '15px' }}>Card Information</h5>
                      </div>

                      <div className="col-12">
                        <label className="form-label" style={{ fontWeight: '500', color: '#2D3748' }}>
                          Card Number *
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={paymentData.cardNumber}
                          onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label" style={{ fontWeight: '500', color: '#2D3748' }}>
                          Expiry Date *
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={paymentData.expiryDate}
                          onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label" style={{ fontWeight: '500', color: '#2D3748' }}>
                          CVV *
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={paymentData.cvv}
                          onChange={(e) => handleInputChange('cvv', e.target.value)}
                          placeholder="123"
                          maxLength={4}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label" style={{ fontWeight: '500', color: '#2D3748' }}>
                          Cardholder Name *
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={paymentData.cardholderName}
                          onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                          placeholder="John Doe"
                        />
                      </div>

                      <div className="col-12">
                        <h6 style={{ color: '#2D3748', marginTop: '20px', marginBottom: '15px' }}>Billing Address</h6>
                      </div>

                      <div className="col-12">
                        <label className="form-label" style={{ fontWeight: '500', color: '#2D3748' }}>
                          Street Address
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={paymentData.billingAddress}
                          onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                          placeholder="Enter your billing address"
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label" style={{ fontWeight: '500', color: '#2D3748' }}>
                          City
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={paymentData.billingCity}
                          onChange={(e) => handleInputChange('billingCity', e.target.value)}
                          placeholder="Enter your city"
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label" style={{ fontWeight: '500', color: '#2D3748' }}>
                          State
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={paymentData.billingState}
                          onChange={(e) => handleInputChange('billingState', e.target.value)}
                          placeholder="Enter your state"
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label" style={{ fontWeight: '500', color: '#2D3748' }}>
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={paymentData.billingZip}
                          onChange={(e) => handleInputChange('billingZip', e.target.value)}
                          placeholder="Enter your ZIP code"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'paypal' && (
                    <div className="text-center py-4">
                      <div
                        style={{
                          backgroundColor: '#F7FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          padding: '30px'
                        }}
                      >
                        <div style={{ fontSize: '48px', marginBottom: '15px' }}>💳</div>
                        <h5 style={{ color: '#2D3748', marginBottom: '10px' }}>PayPal Payment</h5>
                        <p style={{ color: '#718096', marginBottom: '20px' }}>
                          You will be redirected to PayPal to complete your payment securely.
                        </p>
                        <button
                          className="btn"
                          style={{
                            backgroundColor: '#0070BA',
                            color: 'white',
                            padding: '10px 30px'
                          }}
                        >
                          Pay with PayPal
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="d-flex justify-content-between mt-5">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={handleBack}
                      style={{ padding: '10px 30px' }}
                    >
                      <i className="fa fa-arrow-left me-2"></i> Back
                    </button>
                    <button
                      className="btn"
                      onClick={handleSubmit}
                      style={{ 
                        backgroundColor: "#274171",
                        color: 'white',
                        padding: '10px 30px'
                      }}
                    >
                      Complete Payment <i className="fa fa-credit-card ms-2"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      

      <div className="progress-sidebar">
        <FormProgressSidebar currentStep={5} />
      </div>
    </>
  );
} 