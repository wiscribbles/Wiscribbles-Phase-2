"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import FormProgressSidebar from '@/components/FormProgressSidebar';
import { saveFormData, getFormData } from '@/utils/formStorage';

const serviceOptions = [
  {
    id: 'e-sign',
    title: 'E-Sign Only',
    description: 'Digital signature only - no notary verification required',
    price: '$25',
    features: [
      'Digital signature',
      'PDF generation',
      'Email delivery',
      'Basic validation'
    ],
    icon: '✍️',
    recommended: false
  },
  {
    id: 'notary',
    title: 'Notary Service',
    description: 'Full notary verification with video call and official stamp',
    price: '$50',
    features: [
      'Digital signature',
      'Notary verification',
      'Video call session',
      'Official notary stamp',
      'Legal compliance',
      'PDF generation',
      'Email delivery'
    ],
    icon: '🏛️',
    recommended: true
  }
];

export default function ServiceSelectionPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split('/')?.[1] || '';
  const t = useTranslations();
  const [selectedService, setSelectedService] = useState(null);

  // Load saved data when component mounts
  useEffect(() => {
    const savedData = getFormData().step4;
    if (savedData && savedData.serviceType) {
      setSelectedService(savedData.serviceType);
    }
  }, []);

  const handleServiceSelect = (serviceId) => {
    setSelectedService(serviceId);
    
    // Save selection
    const formData = getFormData();
    saveFormData(4, {
      ...formData.step4,
      serviceType: serviceId
    });
  };

  const handleNext = () => {
    if (selectedService) {
      router.push(`/${locale}/form-step5`);
    } else {
      alert('Please select a service type to proceed');
    }
  };

  const handleBack = () => {
    router.push(`/${locale}/form-step3`);
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
        
        .service-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }
        
        .service-card {
          cursor: pointer;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          transition: all 0.3s ease;
          padding: 2rem;
          background-color: #FFFFFF;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          min-height: 200px;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          position: relative;
        }
        
        .service-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .service-card.selected {
          border: 2px solid #274171;
          background-color: #F7FAFC;
        }
        
        .service-card.recommended::before {
          content: "Recommended";
          position: absolute;
          top: -10px;
          right: 20px;
          background-color: #274171;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .service-icon {
          width: 60px;
          height: 60px;
          object-fit: contain;
          pointer-events: none;
        }
        
        .service-title {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #2D3748;
          text-align: center;
          pointer-events: none;
        }
        
        .service-description {
          margin: 0;
          font-size: 14px;
          color: #718096;
          text-align: center;
          pointer-events: none;
          line-height: 1.5;
        }
        
        .service-price {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #274171;
          text-align: center;
          pointer-events: none;
        }
        
        .service-features {
          list-style: none;
          padding: 0;
          margin: 0;
          text-align: center;
        }
        
        .service-features li {
          font-size: 13px;
          color: #718096;
          margin-bottom: 4px;
          pointer-events: none;
        }
        
        .service-features li:before {
          content: "✓";
          color: #274171;
          font-weight: bold;
          margin-right: 8px;
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
        
        .btn-primary:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
          transform: none;
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
          
          .service-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .service-card {
            padding: 1.5rem;
            min-height: 180px;
          }
          
          .service-icon {
            width: 50px;
            height: 50px;
          }
          
          .service-title {
            font-size: 18px;
          }
          
          .service-description {
            font-size: 13px;
          }
          
          .service-price {
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
          
          .service-grid {
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
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
          
          .service-grid {
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2.5rem;
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
          
          .service-card {
            padding: 1rem;
            min-height: 160px;
          }
          
          .service-icon {
            width: 40px;
            height: 40px;
          }
          
          .service-title {
            font-size: 16px;
          }
          
          .service-description {
            font-size: 12px;
          }
          
          .service-price {
            font-size: 14px;
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
                  <h2 style={{ color: '#2D3748', fontSize: '28px', fontWeight: '600' }}>Select Service Type</h2>
                  <p style={{ color: '#718096', fontSize: '16px', marginTop: '8px' }}>
                    Choose the type of service you need for your document
                  </p>
                </div>

                <div className="form-content">
                  <div className="row g-4">
                    {serviceOptions.map((service) => (
                      <div key={service.id} className="col-md-6">
                        <div
                          onClick={() => handleServiceSelect(service.id)}
                          className="service-card"
                          style={{
                            cursor: 'pointer',
                            border: selectedService === service.id ? '2px solid #274171' : '1px solid #E2E8F0',
                            borderRadius: '12px',
                            transition: 'all 0.3s ease',
                            padding: '30px',
                            backgroundColor: selectedService === service.id ? '#F7FAFC' : '#FFFFFF',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            position: 'relative',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            MozUserSelect: 'none',
                            msUserSelect: 'none'
                          }}
                        >
                          {service.recommended && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '-10px',
                                right: '20px',
                                backgroundColor: '#274171',
                                color: 'white',
                                padding: '5px 15px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}
                            >
                              RECOMMENDED
                            </div>
                          )}

                          <div className="text-center mb-3">
                            <div
                              style={{
                                fontSize: '48px',
                                marginBottom: '15px'
                              }}
                            >
                              {service.icon}
                            </div>
                            <h4 style={{ 
                              color: '#2D3748', 
                              fontWeight: '600',
                              marginBottom: '10px'
                            }}>
                              {service.title}
                            </h4>
                            <div
                              style={{
                                fontSize: '32px',
                                fontWeight: '700',
                                color: '#274171',
                                marginBottom: '10px'
                              }}
                            >
                              {service.price}
                            </div>
                            <p style={{ 
                              color: '#718096', 
                              fontSize: '14px',
                              marginBottom: '20px'
                            }}>
                              {service.description}
                            </p>
                          </div>

                          <div className="flex-grow-1">
                            <h6 style={{ 
                              color: '#2D3748', 
                              fontWeight: '600',
                              marginBottom: '15px'
                            }}>
                              What's included:
                            </h6>
                            <ul style={{ 
                              listStyle: 'none', 
                              padding: 0,
                              margin: 0
                            }}>
                              {service.features.map((feature, index) => (
                                <li
                                  key={index}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '8px',
                                    fontSize: '14px',
                                    color: '#4A5568'
                                  }}
                                >
                                  <span
                                    style={{
                                      color: '#274171',
                                      marginRight: '8px',
                                      fontSize: '16px'
                                    }}
                                  >
                                    ✓
                                  </span>
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {selectedService === service.id && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                width: '24px',
                                height: '24px',
                                backgroundColor: '#274171',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '14px'
                              }}
                            >
                              ✓
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

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
                      onClick={handleNext}
                      disabled={!selectedService}
                      style={{ 
                        backgroundColor: selectedService ? "#274171" : "#9CA3AF",
                        color: 'white',
                        padding: '10px 30px',
                        cursor: selectedService ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Next <i className="fa fa-arrow-right ms-2"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      

      <div className="progress-sidebar">
        <FormProgressSidebar currentStep={4} />
      </div>
    </>
  );
} 