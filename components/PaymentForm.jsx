//using this as Forms2 Step4 not any other

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import FormProgressSidebar from './FormProgressSidebar';
import CountrySelect from '@/components/CountrySelect';
import { saveFormData, getFormData } from '@/utils/formStorage';
import { v4 as uuidv4 } from 'uuid';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { addDoc, collection } from "firebase/firestore";

const PaymentForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [hoveredMethod, setHoveredMethod] = useState(null);

  const initialFormState = {
    cardNumber: '',
    cardholderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    province: '',
    address: '',
    city: '',
    zipCode: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // Load saved data when component mounts
  useEffect(() => {
    const savedData = getFormData().step4;
    if (savedData) {
      setPaymentMethod(savedData.paymentMethod || 'credit-card');
      setFormData(prev => ({
        ...prev,
        ...savedData
      }));
    }
  }, []);

  // Save data when it changes
  useEffect(() => {
    saveFormData(4, {
      paymentMethod,
      ...formData
    });
  }, [paymentMethod, formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "phone") {
      // If the value contains non-digits, set error
      if (/[^0-9]/.test(value)) {
        setErrors(prev => ({
          ...prev,
          phone: "Enter numbers only"
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          phone: ""
        }));
      }
      // Always strip non-digits from the value
      newValue = value.replace(/[^0-9]/g, "");
    } else if (name === "zipCode") {
      newValue = value.replace(/[^0-9]/g, "");
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    // Clear error when user types (for other fields)
    if (name !== "phone" && errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (paymentMethod === 'credit-card') {
      if (!formData.cardNumber) newErrors.cardNumber = 'Card number is required';
      if (!formData.cardholderName) newErrors.cardholderName = 'Cardholder name is required';
      if (!formData.expiryMonth) newErrors.expiryMonth = 'Expiry month is required';
      if (!formData.expiryYear) newErrors.expiryYear = 'Expiry year is required';
      if (!formData.cvv) newErrors.cvv = 'CVV is required';
    }

    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    if (!formData.country) newErrors.country = 'Country is required';
    if (!formData.province) newErrors.province = 'Province is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.zipCode) newErrors.zipCode = 'ZIP code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validateForm()) {
      setIsProcessing(true);
      try {
        let submissionId = getFormData().submissionId;
        // If submissionId is missing, create a new submission
        if (!submissionId) {
          // Gather all form data from previous steps
          const allFormData = getFormData();
          const newSubmission = {
            step1: allFormData.step1 || {},
            step2: allFormData.step2 || {},
            step3: allFormData.step3 || {},
            step4: {
              paymentMethod,
              ...formData
            },
            status: 'pending',
            createdAt: new Date().toISOString(),
            submittedAt: new Date().toISOString()
          };
          const docRef = await addDoc(collection(db, 'formSubmissions'), newSubmission);
          submissionId = docRef.id;
          saveFormData('submissionId', submissionId);
        } else {
          // Update step4 in Firestore if needed
          await updateDoc(doc(db, 'formSubmissions', submissionId), {
            step4: {
              paymentMethod,
              ...formData
            }
          });
        }
        // Payment completed successfully, proceed to step 5 (delivery)
        router.push('/form-step5');
      } catch (err) {
        setErrors({ form: err.message });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleBack = (e) => {
    e.preventDefault();
    const from = searchParams?.get('from');
    if (from === 'step2') {
      router.push('/form-step2');
    } else {
      router.push('/form-step3');
    }
  };

  const inputClasses = (error) => `
    
  `;

  const labelClasses = 'block text-sm font-medium text-gray-700 mb-1 font-poppins';

  const errorMessageClasses = 'mt-1 text-sm text-[#dc3545] font-poppins';

  return (
    <div className="d-flex">
      <div className="flex-grow-1" style={{ marginRight: '320px' }}>
        <div className="mt-4 ml-4">
          <Link legacyBehavior href="/">
            <a>
              <img
                src="/assets/images/logos/logo.png"
                alt="Logo"
                title="Logo"
                style={{ height: '70px' }}
              />
            </a>
          </Link>
        </div>

        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="form-card bg-white p-4 rounded-3">
                {/* Page Title */}
                <div className="text-center mb-5">
                  <h2 style={{ color: '#2D3748', fontSize: '28px', fontWeight: '600' }}>{t('form2_step4_title')}</h2>
                  <p style={{ color: '#718096', fontSize: '16px', marginTop: '8px' }}>{t('form2_step4_payment_selection_text')}</p>
                </div>

                {/* Payment Method Selection */}
                <div className="mb-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <div 
                        className={`p-3 rounded cursor-pointer`}
                        onClick={() => setPaymentMethod('credit-card')}
                        style={{ 
                          cursor: 'pointer',
                          border: paymentMethod === 'credit-card' ? '2px solid #274171' : '1px solid #E2E8F0',
                          backgroundColor: paymentMethod === 'credit-card' ? '#F7FAFC' : '#FFFFFF',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <img src="/assets/v3/img/creditCard.png" alt="Credit Card" style={{ width: '24px', marginRight: '12px' }} />
                          <span style={{ color: '#2D3748', fontWeight: '500' }}>Credit Card</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div 
                        className={`p-3 rounded`}
                        onClick={() => setPaymentMethod('paypal')}
                        style={{ 
                          cursor: 'pointer',
                          border: paymentMethod === 'paypal' ? '2px solid #274171' : '1px solid #E2E8F0',
                          backgroundColor: paymentMethod === 'paypal' ? '#F7FAFC' : '#FFFFFF',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <img src="/assets/v3/img/payPal.png" alt="PayPal" style={{ width: '24px', marginRight: '12px' }} />
                          <span style={{ color: '#2D3748', fontWeight: '500' }}>PayPal</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Credit Card Form */}
                {paymentMethod === 'credit-card' && (
                  <div className="card mb-4" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div className="card-body p-4">
                      <h5 style={{ color: '#2D3748', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                      {t('form2_step4_credit_card_details_text')}
                      </h5>
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>Card Number</label>
                          <input
                            type="text"
                            className={`form-control ${errors.cardNumber ? 'is-invalid' : ''}`}
                            name="cardNumber"
                            value={formData.cardNumber}
                            onChange={handleInputChange}
                            placeholder="XXXX XXXX XXXX XXXX"
                            maxLength="19"
                            style={{
                              border: errors.cardNumber ? '1px solid #dc3545' : '1px solid #E2E8F0',
                              borderRadius: '6px',
                              padding: '10px'
                            }}
                          />
                          {errors.cardNumber && <div className="invalid-feedback">{errors.cardNumber}</div>}
                        </div>
                        <div className="col-12">
                          <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>Cardholder Name</label>
                          <input
                            type="text"
                            className={`form-control ${errors.cardholderName ? 'is-invalid' : ''}`}
                            name="cardholderName"
                            value={formData.cardholderName}
                            onChange={handleInputChange}
                            placeholder="John Doe"
                            style={{
                              border: errors.cardholderName ? '1px solid #dc3545' : '1px solid #E2E8F0',
                              borderRadius: '6px',
                              padding: '10px'
                            }}
                          />
                          {errors.cardholderName && <div className="invalid-feedback">{errors.cardholderName}</div>}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>Expiry Month</label>
                          <input
                            type="text"
                            className={`form-control ${errors.expiryMonth ? 'is-invalid' : ''}`}
                            name="expiryMonth"
                            value={formData.expiryMonth}
                            onChange={handleInputChange}
                            placeholder="MM"
                            maxLength="2"
                            style={{
                              border: errors.expiryMonth ? '1px solid #dc3545' : '1px solid #E2E8F0',
                              borderRadius: '6px',
                              padding: '10px'
                            }}
                          />
                          {errors.expiryMonth && <div className="invalid-feedback">{errors.expiryMonth}</div>}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>Expiry Year</label>
                          <input
                            type="text"
                            className={`form-control ${errors.expiryYear ? 'is-invalid' : ''}`}
                            name="expiryYear"
                            value={formData.expiryYear}
                            onChange={handleInputChange}
                            placeholder="YYYY"
                            maxLength="4"
                            style={{
                              border: errors.expiryYear ? '1px solid #dc3545' : '1px solid #E2E8F0',
                              borderRadius: '6px',
                              padding: '10px'
                            }}
                          />
                          {errors.expiryYear && <div className="invalid-feedback">{errors.expiryYear}</div>}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>CVV</label>
                          <input
                            type="password"
                            className={`form-control ${errors.cvv ? 'is-invalid' : ''}`}
                            name="cvv"
                            value={formData.cvv}
                            onChange={handleInputChange}
                            placeholder="***"
                            maxLength="3"
                            style={{
                              border: errors.cvv ? '1px solid #dc3545' : '1px solid #E2E8F0',
                              borderRadius: '6px',
                              padding: '10px'
                            }}
                          />
                          {errors.cvv && <div className="invalid-feedback">{errors.cvv}</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Billing Address */}
                <div className="card" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div className="card-body p-4">
                    <h5 style={{ color: '#2D3748', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                    {t('form2_step4_address_placeholder')}
                    </h5>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>First Name</label>
                        <input
                          type="text"
                          className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          style={{
                            border: errors.firstName ? '1px solid #dc3545' : '1px solid #E2E8F0',
                            borderRadius: '6px',
                            padding: '10px'
                          }}
                        />
                        {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>Last Name</label>
                        <input
                          type="text"
                          className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          style={{
                            border: errors.lastName ? '1px solid #dc3545' : '1px solid #E2E8F0',
                            borderRadius: '6px',
                            padding: '10px'
                          }}
                        />
                        {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>Email</label>
                        <input
                          type="email"
                          className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          style={{
                            border: errors.email ? '1px solid #dc3545' : '1px solid #E2E8F0',
                            borderRadius: '6px',
                            padding: '10px'
                          }}
                        />
                        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>Phone</label>
                        <input
                          type="tel"
                          className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          style={{
                            border: errors.phone ? '1px solid #dc3545' : '1px solid #E2E8F0',
                            borderRadius: '6px',
                            padding: '10px'
                          }}
                        />
                        {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>Country</label>
                        <CountrySelect
                          value={formData.country}
                          onChange={(value) => handleInputChange({ target: { name: 'country', value }})}
                          style={{
                            border: errors.country ? '1px solid #dc3545' : '1px solid #E2E8F0',
                            borderRadius: '6px',
                            padding: '10px'
                          }}
                        />
                        {errors.country && <div className="invalid-feedback">{errors.country}</div>}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>Province/State</label>
                        <input
                          type="text"
                          className={`form-control ${errors.province ? 'is-invalid' : ''}`}
                          name="province"
                          value={formData.province}
                          onChange={handleInputChange}
                          style={{
                            border: errors.province ? '1px solid #dc3545' : '1px solid #E2E8F0',
                            borderRadius: '6px',
                            padding: '10px'
                          }}
                        />
                        {errors.province && <div className="invalid-feedback">{errors.province}</div>}
                      </div>
                      <div className="col-12">
                        <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>Address</label>
                        <input
                          type="text"
                          className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          style={{
                            border: errors.address ? '1px solid #dc3545' : '1px solid #E2E8F0',
                            borderRadius: '6px',
                            padding: '10px'
                          }}
                        />
                        {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                      </div>

                      <div className="rounded-2xl" >
                      <label className={labelClasses}>City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={inputClasses(errors.city)}
                        // style={{ 
                        //     padding: '10px',
                        //     borderRadius: '6px'   
                        // }}
                        
                      />
                      {errors.city && (
                        <p className={errorMessageClasses}>{errors.city}</p>
                      )}
                    </div>

                    <div>
                      <label className={labelClasses}>ZIP Code</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        maxLength="10"
                        className={inputClasses(errors.zipCode)}
                        // style={{ 
                        //     padding: '10px',
                        //     borderRadius: '6px'  
                        // }}
                      />
                      {errors.zipCode && (
                        <p className={errorMessageClasses}>{errors.zipCode}</p>
                      )}
                    </div>
                      
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="actions">
                  <div className="d-flex justify-content-between align-items-center mt-5" style={{ paddingBottom: '5px' }}>
                    <button
                      onClick={handleBack}
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
                        left: '20px',
                        border: 'none'
                      }}
                    >
                      <i className="fa fa-arrow-left"></i> Back
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={isProcessing}
                      className="btn"
                      style={{
                        backgroundColor: '#274171',
                        color: 'white',
                        padding: '10px 30px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '-170px',
                        position: 'relative',
                        right: '20px',
                        border: 'none',
                        opacity: isProcessing ? 0.7 : 1,
                        cursor: isProcessing ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isProcessing ? 'Processing...' : 'Next'} {!isProcessing && <i className="fa fa-arrow-right"></i>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div style={{ 
        width: '300px', 
        position: 'fixed', 
        right: 0, 
        top: 0, 
        height: '100vh',
        borderLeft: '1px solid rgba(0,0,0,0.1)',
        backgroundColor: '#091534'
      }}>
        <FormProgressSidebar currentStep={4} />
      </div>
    </div>
  );
};

export default PaymentForm;
