'use client';

import React from 'react';
import { getFormData } from '@/utils/formStorage';

const DebugFormData = () => {
  const [formData, setFormData] = React.useState(null);
  const [apiTest, setApiTest] = React.useState(null);

  const checkFormData = () => {
    const data = getFormData();
    setFormData(data);
    console.log('Current form data:', data);
  };

  const testNotaryAPI = async () => {
    try {
      setApiTest({ status: 'testing', message: 'Testing API...' });
      
      const testData = {
        step1: {
          firstName: 'Test',
          lastName: 'User', 
          email: 'test@example.com',
          dateOfBirth: '1990-01-01',
          countryOfResidence: 'US'
        },
        step2: {
          documentType: 'power-of-attorney'
        },
        step3: {
          signingOption: 'notary'
        }
      };

      console.log('Testing with data:', testData);

      const response = await fetch('/api/notary/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });

      console.log('Test response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Test API error:', errorText);
        throw new Error(`Status ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Test API result:', result);
      
      setApiTest({ 
        status: 'success', 
        message: 'API test successful!', 
        data: result 
      });
    } catch (error) {
      console.error('API test failed:', error);
      setApiTest({ 
        status: 'error', 
        message: `API test failed: ${error.message}` 
      });
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '5px',
      maxWidth: '400px',
      zIndex: 10000,
      fontSize: '12px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h4>🐛 Debug Panel</h4>
      
      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={checkFormData}
          style={{ 
            background: '#007bff', 
            color: 'white', 
            border: 'none', 
            padding: '5px 10px', 
            marginRight: '5px',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Check Form Data
        </button>
        
        <button 
          onClick={testNotaryAPI}
          style={{ 
            background: '#28a745', 
            color: 'white', 
            border: 'none', 
            padding: '5px 10px',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Test API
        </button>
      </div>

      {formData && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Form Data:</strong>
          <pre style={{ 
            background: '#f8f9fa', 
            padding: '5px', 
            fontSize: '10px', 
            maxHeight: '200px', 
            overflow: 'auto',
            marginTop: '5px'
          }}>
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      )}

      {apiTest && (
        <div style={{ marginBottom: '10px' }}>
          <strong>API Test:</strong>
          <div style={{ 
            background: apiTest.status === 'error' ? '#f8d7da' : 
                       apiTest.status === 'success' ? '#d4edda' : '#fff3cd',
            padding: '5px',
            marginTop: '5px',
            borderRadius: '3px'
          }}>
            {apiTest.message}
            {apiTest.data && (
              <pre style={{ fontSize: '10px', marginTop: '5px' }}>
                {JSON.stringify(apiTest.data, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugFormData;
