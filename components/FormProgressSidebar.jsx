'use client';
import React from 'react';
import { FiUser, FiFileText, FiEdit, FiCreditCard, FiDownload } from 'react-icons/fi';

const FormProgressSidebar = ({ currentStep = 1 }) => {
  const steps = [
    { icon: <FiFileText size={20} />, label: 'Document Selection' },
    { icon: <FiUser size={20} />, label: 'Personal Information' },
    { icon: <FiEdit size={20} />, label: 'Signature & Notarization' },
    { icon: <FiCreditCard size={20} />, label: 'Payment Details' },
    { icon: <FiDownload size={20} />, label: 'Document Download' }
  ];

  return (
    <div className="h-100 bg-[#091534] text-white p-4" style={{ backgroundColor: '#091534' }}>
      <div className="d-flex flex-column h-100">
        {steps.map((step, index) => (
          <div key={index} className="d-flex align-items-center mb-4">
            <div 
              className={`rounded-circle d-flex align-items-center justify-content-center me-3`}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: currentStep > index ? '#091534' : 
                                currentStep === index + 1 ? '#fff' : 'transparent',
                border: '2px solid',
                borderColor: currentStep >= index + 1 ? '#fff' : '#6c757d'
              }}
            >
              <span style={{ 
                color: currentStep > index ? '#fff' : 
                       currentStep === index + 1 ? '#09123A' : '#6c757d'
              }}>
                {step.icon}
              </span>
            </div>
            <div>
              <p className="mb-0" style={{ 
                color: currentStep >= index + 1 ? '#fff' : '#6c757d',
                fontWeight: currentStep === index + 1 ? 'bold' : 'normal'
              }}>
                {step.label}
              </p>
            </div>
            
          </div>
        ))}
        
        {/* Progress percentage */}
        <div className="mt-auto">
          <p className="mb-2">{`${currentStep} to ${steps.length} step`}</p>
          <h3 className="mb-2">{`${Math.round((currentStep - 1) / (steps.length - 1) * 100)}% complete`}</h3>
          <div className="progress" style={{ height: '8px' }}>
            <div 
              className="progress-bar"
              style={{
                width: `${Math.round((currentStep - 1) / (steps.length - 1) * 100)}%`,
                backgroundColor: '#B4C8E8'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormProgressSidebar; 