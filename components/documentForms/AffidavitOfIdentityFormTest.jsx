'use client';
import React, { useState } from 'react';
import AffidavitOfIdentityForm from './AffidavitOfIdentityForm';

const AffidavitOfIdentityFormTest = () => {
  const [formData, setFormData] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleFormDataChange = (data) => {
    setFormData(data);
    console.log('Form data updated:', data);
  };

  const handleProceed = () => {
    console.log('Form submitted:', formData);
    setSubmitted(true);
    alert('Form validation passed! Form data logged to console.');
  };

  if (submitted) {
    return (
      <div style={{ 
        padding: '40px', 
        backgroundColor: '#d4edda', 
        border: '1px solid #c3e6cb', 
        borderRadius: '8px',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '40px auto'
      }}>
        <h2 style={{ color: '#155724', marginBottom: '16px' }}>✅ Form Submitted Successfully!</h2>
        <p style={{ color: '#155724', marginBottom: '20px' }}>
          All validation checks passed. The form data has been logged to the console.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Test Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <div style={{
        backgroundColor: '#e7f3ff',
        border: '1px solid #b3d9ff',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px',
        maxWidth: '800px',
        margin: '0 auto 20px'
      }}>
        <h3 style={{ color: '#0066cc', marginBottom: '8px' }}>🧪 Affidavit of Identity Form Test</h3>
        <p style={{ color: '#004499', margin: 0, fontSize: '14px' }}>
          Fill out the form below to test the validation logic. The "Proceed" button should only enable when all required fields are completed.
        </p>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          <strong>Test cases to try:</strong>
          <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
            <li>Fill all fields except identification - button should stay disabled</li>
            <li>Select "Other" ID type but don't fill description - button should stay disabled</li>
            <li>Fill all required fields - button should enable</li>
          </ul>
        </div>
      </div>
      
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <AffidavitOfIdentityForm
          formData={formData}
          onFormDataChange={handleFormDataChange}
          onProceed={handleProceed}
        />
      </div>
    </div>
  );
};

export default AffidavitOfIdentityFormTest;
