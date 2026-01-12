// //used earlier now usign PaymentForm component as Form2-Step4

// 'use client';

// import React, { useState, useEffect } from 'react';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import { useTranslations } from 'next-intl';
// import FormProgressSidebar from './FormProgressSidebar';
// import CountrySelect from '@/components/CountrySelect';
// import { saveFormData, getFormData } from '@/utils/formStorage';

// const Form2step4 = () => {
//   const router = useRouter();
//   const t = useTranslations();
//   const [paymentMethod, setPaymentMethod] = useState('credit-card');
//   const [errors, setErrors] = useState({});
//   const [isProcessing, setIsProcessing] = useState(false);

//   const [formData, setFormData] = useState({
//     cardNumber: '',
//     cardholderName: '',
//     expiryMonth: '',
//     expiryYear: '',
//     cvv: '',
//     firstName: '',
//     lastName: '',
//     email: '',
//     phone: '',
//     country: '',
//     province: '',
//     address: '',
//     city: '',
//     zipCode: ''
//   });

//   // Load saved data when component mounts
//   useEffect(() => {
//     const savedData = getFormData().step4;
//     if (savedData) {
//       setPaymentMethod(savedData.paymentMethod || 'credit-card');
//       setFormData(prev => ({
//         ...prev,
//         ...savedData
//       }));
//     }
//   }, []);

//   // Save data when it changes
//   useEffect(() => {
//     saveFormData(4, {
//       paymentMethod,
//       ...formData
//     });
//   }, [paymentMethod, formData]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     let newValue = value;

//     if (name === "phone") {
//       // If the value contains non-digits, set error
//       if (/[^0-9]/.test(value)) {
//         setErrors(prev => ({
//           ...prev,
//           phone: "Enter numbers only"
//         }));
//       } else {
//         setErrors(prev => ({
//           ...prev,
//           phone: ""
//         }));
//       }
//       // Always strip non-digits from the value
//       newValue = value.replace(/[^0-9]/g, "");
//     }

//     setFormData(prev => ({
//       ...prev,
//       [name]: newValue
//     }));
//   };

//   const validateForm = () => {
//     const newErrors = {};
    
//     if (paymentMethod === 'credit-card') {
//       if (!formData.cardNumber) newErrors.cardNumber = 'Card number is required';
//       if (!formData.cardholderName) newErrors.cardholderName = 'Cardholder name is required';
//       if (!formData.expiryMonth) newErrors.expiryMonth = 'Expiry month is required';
//       if (!formData.expiryYear) newErrors.expiryYear = 'Expiry year is required';
//       if (!formData.cvv) newErrors.cvv = 'CVV is required';
//     }

//     if (!formData.firstName) newErrors.firstName = 'First name is required';
//     if (!formData.lastName) newErrors.lastName = 'Last name is required';
//     if (!formData.email) newErrors.email = 'Email is required';
//     if (!formData.phone) newErrors.phone = 'Phone is required';
//     if (!formData.country) newErrors.country = 'Country is required';
//     if (!formData.province) newErrors.province = 'Province is required';
//     if (!formData.address) newErrors.address = 'Address is required';
//     if (!formData.city) newErrors.city = 'City is required';
//     if (!formData.zipCode) newErrors.zipCode = 'ZIP code is required';

//     if (!/^[0-9]+$/.test(formData.phone)) {
//       newErrors.phone = "Phone number must contain only digits";
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // const handleNext = () => {
//   //   if (validateForm()) {
//   //     router.push('/video-call?from=form4');
//   //   }
//   // };

//   const handleBack = (e) => {
//     e.preventDefault();
//     router.push('/form2-page3');
//   };

//   return (
//     <div className="d-flex">
//       <div className="flex-grow-1" style={{ marginRight: '320px' }}>
//         <div className="mt-4 ml-4">
//           <Link legacyBehavior href="/">
//             <a>
//               <img
//                 src="/assets/images/logos/logo.png"
//                 alt="Logo"
//                 title="Logo"
//                 style={{ height: '70px' }}
//               />
//             </a>
//           </Link>
//         </div>

//         <div className="container">
//           <div className="row justify-content-center">
//             <div className="col-lg-10">
//               <div className="form-card bg-white p-4 rounded-3">
//                 {/* Page Title */}
//                 <div className="text-center mb-5">
//                   <h2 style={{ color: '#2D3748', fontSize: '28px', fontWeight: '600' }}>{t('Payment Details')}</h2>
//                   <p style={{ color: '#718096', fontSize: '16px', marginTop: '8px' }}>{t('Please Select Your preferred form of Payment')}</p>
//                 </div>

//                 {/* Payment Method Selection */}
//                 <div className="mb-4">
//                   <div className="row g-3">
//                     <div className="col-12">
//                       <div 
//                         className={`p-3 rounded cursor-pointer`}
//                         onClick={() => setPaymentMethod('credit-card')}
//                         style={{ 
//                           cursor: 'pointer',
//                           border: paymentMethod === 'credit-card' ? '2px solid #274171' : '1px solid #E2E8F0',
//                           backgroundColor: paymentMethod === 'credit-card' ? '#F7FAFC' : '#FFFFFF',
//                           transition: 'all 0.3s ease',
//                           boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
//                         }}
//                       >
//                         <div className="d-flex align-items-center">
//                           <img src="/assets/v3/img/creditCard.png" alt="Credit Card" style={{ width: '24px', marginRight: '12px' }} />
//                           <span style={{ color: '#2D3748', fontWeight: '500' }}>Credit Card</span>
//                         </div>
//                       </div>
//                     </div>
//                     <div className="col-12">
//                       <div 
//                         className={`p-3 rounded`}
//                         onClick={() => setPaymentMethod('paypal')}
//                         style={{ 
//                           cursor: 'pointer',
//                           border: paymentMethod === 'paypal' ? '2px solid #274171' : '1px solid #E2E8F0',
//                           backgroundColor: paymentMethod === 'paypal' ? '#F7FAFC' : '#FFFFFF',
//                           transition: 'all 0.3s ease',
//                           boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
//                         }}
//                       >
//                         <div className="d-flex align-items-center">
//                           <img src="/assets/v3/img/payPal.png" alt="PayPal" style={{ width: '24px', marginRight: '12px' }} />
//                           <span style={{ color: '#2D3748', fontWeight: '500' }}>PayPal</span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Credit Card Form */}
//                 {paymentMethod === 'credit-card' && (
//                   <div className="card mb-4" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
//                     <div className="card-body p-4">
//                       <h5 style={{ color: '#2D3748', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
//                         {t('Enter your Credit Card Details')}
//                       </h5>
//                       <div className="row g-3">
//                         <div className="col-12">
//                           <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>Card Number</label>
//                           <input
//                             type="text"
//                             className={`form-control ${errors.cardNumber ? 'is-invalid' : ''}`}
//                             name="cardNumber"
//                             value={formData.cardNumber}
//                             onChange={handleInputChange}
//                             placeholder="XXXX XXXX XXXX XXXX"
//                             maxLength="19"
//                             style={{
//                               border: errors.cardNumber ? '1px solid #dc3545' : '1px solid #E2E8F0',
//                               borderRadius: '6px',
//                               padding: '10px'
//                             }}
//                           />
//                           {errors.cardNumber && <div className="invalid-feedback">{errors.cardNumber}</div>}
//                         </div>
//                         <div className="col-12">
//                           <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>Cardholder Name</label>
//                           <input
//                             type="text"
//                             className={`form-control ${errors.cardholderName ? 'is-invalid' : ''}`}
//                             name="cardholderName"
//                             value={formData.cardholderName}
//                             onChange={handleInputChange}
//                             placeholder="John Doe"
//                             style={{
//                               border: errors.cardholderName ? '1px solid #dc3545' : '1px solid #E2E8F0',
//                               borderRadius: '6px',
//                               padding: '10px'
//                             }}
//                           />
//                           {errors.cardholderName && <div className="invalid-feedback">{errors.cardholderName}</div>}
//                         </div>
//                         <div className="col-md-4">
//                           <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>Expiry Month</label>
//                           <input
//                             type="text"
//                             className={`form-control ${errors.expiryMonth ? 'is-invalid' : ''}`}
//                             name="expiryMonth"
//                             value={formData.expiryMonth}
//                             onChange={handleInputChange}
//                             placeholder="MM"
//                             maxLength="2"
//                             style={{
//                               border: errors.expiryMonth ? '1px solid #dc3545' : '1px solid #E2E8F0',
//                               borderRadius: '6px',
//                               padding: '10px'
//                             }}
//                           />
//                           {errors.expiryMonth && <div className="invalid-feedback">{errors.expiryMonth}</div>}
//                         </div>
//                         <div className="col-md-4">
//                           <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>Expiry Year</label>
//                           <input
//                             type="text"
//                             className={`form-control ${errors.expiryYear ? 'is-invalid' : ''}`}
//                             name="expiryYear"
//                             value={formData.expiryYear}
//                             onChange={handleInputChange}
//                             placeholder="YYYY"
//                             maxLength="4"
//                             style={{
//                               border: errors.expiryYear ? '1px solid #dc3545' : '1px solid #E2E8F0',
//                               borderRadius: '6px',
//                               padding: '10px'
//                             }}
//                           />
//                           {errors.expiryYear && <div className="invalid-feedback">{errors.expiryYear}</div>}
//                         </div>
//                         <div className="col-md-4">
//                           <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>CVV</label>
//                           <input
//                             type="password"
//                             className={`form-control ${errors.cvv ? 'is-invalid' : ''}`}
//                             name="cvv"
//                             value={formData.cvv}
//                             onChange={handleInputChange}
//                             placeholder="***"
//                             maxLength="4"
//                             style={{
//                               border: errors.cvv ? '1px solid #dc3545' : '1px solid #E2E8F0',
//                               borderRadius: '6px',
//                               padding: '10px'
//                             }}
//                           />
//                           {errors.cvv && <div className="invalid-feedback">{errors.cvv}</div>}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {/* Billing Address */}
//                 <div className="card" style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
//                   <div className="card-body p-4">
//                     <h5 style={{ color: '#2D3748', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
//                       {t('Enter your Billing Address')}
//                     </h5>
//                     <div className="row g-3">
//                       <div className="col-md-6">
//                         <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>First Name</label>
//                         <input
//                           type="text"
//                           className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
//                           name="firstName"
//                           value={formData.firstName}
//                           onChange={handleInputChange}
//                           style={{
//                             border: errors.firstName ? '1px solid #dc3545' : '1px solid #E2E8F0',
//                             borderRadius: '6px',
//                             padding: '10px'
//                           }}
//                         />
//                         {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
//                       </div>
//                       <div className="col-md-6">
//                         <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>Last Name</label>
//                         <input
//                           type="text"
//                           className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
//                           name="lastName"
//                           value={formData.lastName}
//                           onChange={handleInputChange}
//                           style={{
//                             border: errors.lastName ? '1px solid #dc3545' : '1px solid #E2E8F0',
//                             borderRadius: '6px',
//                             padding: '10px'
//                           }}
//                         />
//                         {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
//                       </div>
//                       <div className="col-md-6">
//                         <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>Email</label>
//                         <input
//                           type="email"
//                           className={`form-control ${errors.email ? 'is-invalid' : ''}`}
//                           name="email"
//                           value={formData.email}
//                           onChange={handleInputChange}
//                           style={{
//                             border: errors.email ? '1px solid #dc3545' : '1px solid #E2E8F0',
//                             borderRadius: '6px',
//                             padding: '10px'
//                           }}
//                         />
//                         {errors.email && <div className="invalid-feedback">{errors.email}</div>}
//                       </div>
//                       <div className="col-md-6">
//                         <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>Phone</label>
//                         <input
//                           type="tel"
//                           className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
//                           name="phone"
//                           value={formData.phone}
//                           onChange={handleInputChange}
//                           style={{
//                             border: errors.phone ? '1px solid #dc3545' : '1px solid #E2E8F0',
//                             borderRadius: '6px',
//                             padding: '10px'
//                           }}
//                         />
//                         {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
//                       </div>
//                       <div className="col-md-6">
//                         <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>Country</label>
//                         <CountrySelect
//                           value={formData.country}
//                           onChange={(value) => handleInputChange({ target: { name: 'country', value }})}
//                           style={{
//                             border: errors.country ? '1px solid #dc3545' : '1px solid #E2E8F0',
//                             borderRadius: '6px',
//                             padding: '10px'
//                           }}
//                         />
//                         {errors.country && <div className="invalid-feedback">{errors.country}</div>}
//                       </div>
//                       <div className="col-md-6">
//                         <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>Province/State</label>
//                         <input
//                           type="text"
//                           className={`form-control ${errors.province ? 'is-invalid' : ''}`}
//                           name="province"
//                           value={formData.province}
//                           onChange={handleInputChange}
//                           style={{
//                             border: errors.province ? '1px solid #dc3545' : '1px solid #E2E8F0',
//                             borderRadius: '6px',
//                             padding: '10px'
//                           }}
//                         />
//                         {errors.province && <div className="invalid-feedback">{errors.province}</div>}
//                       </div>
//                       <div className="col-12">
//                         <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>Address</label>
//                         <input
//                           type="text"
//                           className={`form-control ${errors.address ? 'is-invalid' : ''}`}
//                           name="address"
//                           value={formData.address}
//                           onChange={handleInputChange}
//                           style={{
//                             border: errors.address ? '1px solid #dc3545' : '1px solid #E2E8F0',
//                             borderRadius: '6px',
//                             padding: '10px'
//                           }}
//                         />
//                         {errors.address && <div className="invalid-feedback">{errors.address}</div>}
//                       </div>
//                       <div className="col-md-6">
//                         <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>City</label>
//                         <input
//                           type="text"
//                           className={`form-control ${errors.city ? 'is-invalid' : ''}`}
//                           name="city"
//                           value={formData.city}
//                           onChange={handleInputChange}
//                           style={{
//                             border: errors.city ? '1px solid #dc3545' : '1px solid #E2E8F0',
//                             borderRadius: '6px',
//                             padding: '10px'
//                           }}
//                         />
//                         {errors.city && <div className="invalid-feedback">{errors.city}</div>}
//                       </div>
//                       <div className="col-md-6">
//                         <label className="form-label" style={{ color: '#4A5568', fontWeight: '500' }}>ZIP Code</label>
//                         <input
//                           type="text"
//                           className={`form-control ${errors.zipCode ? 'is-invalid' : ''}`}
//                           name="zipCode"
//                           value={formData.zipCode}
//                           onChange={handleInputChange}
//                           maxLength="10"
//                           style={{
//                             border: errors.zipCode ? '1px solid #dc3545' : '1px solid #E2E8F0',
//                             borderRadius: '6px',
//                             padding: '10px'
//                           }}
//                         />
//                         {errors.zipCode && <div className="invalid-feedback">{errors.zipCode}</div>}
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Form Actions */}
//                 <div className="actions">
//                   <div className="d-flex justify-content-between align-items-center mt-5" style={{ paddingBottom: '5px' }}>
//                     <button
//                       onClick={handleBack}
//                       className="btn"
//                       style={{ 
//                         backgroundColor: "#274171",
//                         color: 'white',
//                         padding: '10px 30px',
//                         display: 'inline-flex',
//                         alignItems: 'center',
//                         gap: '8px',
//                         marginRight: '465px',
//                         marginBottom: '-170px',
//                         position: 'relative',
//                         left: '20px',
//                         border: 'none'
//                       }}
//                     >
//                       <i className="fa fa-arrow-left"></i> Back
//                     </button>

//                     <Link href="/video-call?from=form4">
//                     <button
//                       // onClick={handleNext}
//                       disabled={isProcessing}
//                       className="btn"
//                       style={{
//                         backgroundColor: '#274171',
//                         color: 'white',
//                         padding: '10px 30px',
//                         display: 'inline-flex',
//                         alignItems: 'center',
//                         gap: '8px',
//                         marginBottom: '-170px',
//                         position: 'relative',
//                         right: '20px',
//                         border: 'none',
//                         opacity: isProcessing ? 0.7 : 1,
//                         cursor: isProcessing ? 'not-allowed' : 'pointer'
//                       }}
//                     >
//                       {isProcessing ? 'Processing...' : 'Next'} {!isProcessing && <i className="fa fa-arrow-right"></i>}
//                     </button>
//                     </Link>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Right Sidebar */}
//       <div style={{ 
//         width: '300px', 
//         position: 'fixed', 
//         right: 0, 
//         top: 0, 
//         height: '100vh',
//         borderLeft: '1px solid rgba(0,0,0,0.1)',
//         backgroundColor: '#091534'
//       }}>
//         <FormProgressSidebar currentStep={4} />
//       </div>
//     </div>
//   );
// };

// export default Form2step4;
