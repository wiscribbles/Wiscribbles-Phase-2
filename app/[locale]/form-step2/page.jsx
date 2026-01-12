"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import FormProgressSidebar from '@/components/FormProgressSidebar';
import { saveFormData, getFormData } from '@/utils/formStorage';

export default function PersonalInformationPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split('/')?.[1] || '';
  const t = useTranslations();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    dateOfBirth: '',
    idType: 'drivers-license',
    idNumber: '',
    idExpiry: ''
  });

  // Load saved data when component mounts
  useEffect(() => {
    const savedData = getFormData().step2;
    if (savedData) {
      setFormData(prev => ({ ...prev, ...savedData }));
    }
  }, []);

  const handleInputChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    // Save to localStorage
    const allFormData = getFormData();
    saveFormData(2, {
      ...allFormData.step2,
      ...newData
    });
  };

  const handleNext = () => {
    // Basic validation
    const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Proceed to next step
    router.push(`/${locale}/form-step3`);
  };

  const handleBack = () => {
    router.push(`/${locale}/form-step1`);
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
        
        .section-title {
          color: #2D3748;
          font-size: 18px;
          font-weight: 600;
          margin-top: 20px;
          margin-bottom: 15px;
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
          
          .section-title {
            font-size: 16px;
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
                  <h2 className="form-title">Personal Information</h2>
                  <p className="form-subtitle">Please provide your personal details for the document</p>
                </div>

                <div className="form-content">
                  <div className="form-grid">
                    {/* First Name */}
                    <div className="form-field">
                      <label className="form-label">
                        First Name *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="Enter your first name"
                        required
                      />
                    </div>

                    {/* Last Name */}
                    <div className="form-field">
                      <label className="form-label">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Enter your last name"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div className="form-field">
                      <label className="form-label">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter your email address"
                        required
                      />
                    </div>

                    {/* Phone */}
                    <div className="form-field">
                      <label className="form-label">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Enter your phone number"
                        required
                      />
                    </div>

                    {/* Address */}
                    <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">
                        Street Address
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Enter your street address"
                      />
                    </div>

                    {/* City, State, Zip */}
                    <div className="form-field">
                      <label className="form-label">
                        City
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Enter your city"
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label">
                        State/Province
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder="Enter your state"
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label">
                        ZIP/Postal Code
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        placeholder="Enter your ZIP code"
                      />
                    </div>

                    {/* Country */}
                    <div className="form-field">
                      <label className="form-label">
                        Country
                      </label>
                      <select
                        className="form-select"
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                      >
                        <option value="">Select your country</option>
                        <option value="Barbados">Barbados</option>
                        <option value="Guyana">Guyana</option>
                        <option value="Jamaica">Jamaica</option>
                        <option value="Trinidad & Tobago">Trinidad & Tobago</option>
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="United Kingdom">United Kingdom</option>
                      </select>
                    </div>

                    {/* Date of Birth */}
                    <div className="form-field">
                      <label className="form-label">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      />
                    </div>

                    {/* ID Information */}
                    <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                      <h5 className="section-title">Identification Information</h5>
                    </div>

                    <div className="form-field">
                      <label className="form-label">
                        ID Type
                      </label>
                      <select
                        className="form-select"
                        value={formData.idType}
                        onChange={(e) => handleInputChange('idType', e.target.value)}
                      >
                        <option value="drivers-license">Driver's License</option>
                        <option value="passport">Passport</option>
                        <option value="national-id">National ID</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label className="form-label">
                        ID Number
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.idNumber}
                        onChange={(e) => handleInputChange('idNumber', e.target.value)}
                        placeholder="Enter your ID number"
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label">
                        ID Expiry Date
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.idExpiry}
                        onChange={(e) => handleInputChange('idExpiry', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="navigation-buttons">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={handleBack}
                    >
                      <i className="fa fa-arrow-left"></i> Back
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleNext}
                    >
                      Next <i className="fa fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      

      <div className="progress-sidebar">
        <FormProgressSidebar currentStep={2} />
      </div>
    </>
  );
}