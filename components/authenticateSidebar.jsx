'use client';
import React from 'react';
import { FiLock, FiFileText, FiCreditCard, FiCheckCircle } from 'react-icons/fi';

const AuthenticateSidebar = ({ currentStep = 1 }) => {
  const steps = [
    { icon: <FiLock size={20} />, label: 'Authenticate', description: 'Verify your document' },
    { icon: <FiFileText size={20} />, label: 'Document Preview', description: 'Review your document' },
    { icon: <FiCreditCard size={20} />, label: 'Payment & Download', description: 'Pay and download' }
  ];

  // Calculate progress percentage more accurately
  const progressPercentage = currentStep === 1 ? 0 : 
                            currentStep === 2 ? 50 : 
                            currentStep === 3 ? 100 : 0;

  return (
    <div className="h-100 text-white p-4 d-flex flex-column" style={{ backgroundColor: '#091534', position: 'relative', paddingBottom: '100px' }}>
      <div className="mb-4">
        <h5 className="text-white mb-2">Document Authentication</h5>
        <p className="text-muted small mb-0">Secure verification process</p>
      </div>
      
      <div className="flex-grow-1">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isActive = currentStep === stepNumber;
          const isInactive = currentStep < stepNumber;
          
          return (
            <div key={index} className="mb-4">
              <div className="d-flex align-items-start">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: isCompleted ? '#28A745' : 
                                    isActive ? '#274171' : 
                                    'transparent',
                    border: isInactive ? '2px solid #6c757d' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isCompleted ? (
                    <FiCheckCircle size={22} color="#fff" />
                  ) : (
                    <span style={{ 
                      color: isActive ? '#fff' : '#6c757d'
                    }}>
                      {isActive ? step.icon : stepNumber}
                    </span>
                  )}
                </div>
                <div className="flex-grow-1">
                  <p className="mb-1" style={{ 
                    color: isInactive ? '#6c757d' : '#fff',
                    fontWeight: isActive ? '600' : 'normal',
                    fontSize: '16px'
                  }}>
                    {step.label}
                  </p>
                  <p className="mb-0 small" style={{ 
                    color: isInactive ? '#495057' : '#B8C5D6',
                    fontSize: '13px'
                  }}>
                    {step.description}
                  </p>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div style={{ 
                  marginLeft: '20px',
                  marginTop: '8px',
                  marginBottom: '8px'
                }}>
                  <div style={{ 
                    width: '2px',
                    height: '25px',
                    backgroundColor: isCompleted ? '#28A745' : '#4A5568',
                    transition: 'background-color 0.3s ease'
                  }}></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Progress Bar at Bottom */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#0A1628',
        padding: '20px 24px',
        borderTop: '1px solid #1A2332'
      }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="small" style={{ color: '#B8C5D6' }}>Progress</span>
          <span className="font-weight-bold" style={{ color: '#fff', fontSize: '18px' }}>
            {progressPercentage}% Complete
          </span>
        </div>
        <div className="progress" style={{ height: '8px', backgroundColor: '#1A2332' }}>
          <div 
            className="progress-bar"
            style={{
              width: `${progressPercentage}%`,
              backgroundColor: progressPercentage === 100 ? '#28A745' : '#274171',
              transition: 'width 0.5s ease, background-color 0.3s ease'
            }}
          />
        </div>
        <p className="small text-muted mb-0 mt-2">
          Step {currentStep} of {steps.length}
        </p>
      </div>
    </div>
  );
};

export default AuthenticateSidebar;
