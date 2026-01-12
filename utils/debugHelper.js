// Debug utility for E-Sign component troubleshooting

export const debugESign = {
  // Log comprehensive form data state
  logFormData: (formData) => {
    console.group('🔍 E-Sign Debug: Form Data');
    console.log('Form Data Object:', formData);
    console.log('Steps present:', Object.keys(formData || {}));
    console.log('Submission ID:', formData?.submissionId);
    
    if (formData?.step1) {
      console.log('Step 1 - User Info:', {
        firstName: formData.step1.firstName,
        lastName: formData.step1.lastName,
        email: formData.step1.email,
        jurisdiction: formData.step1.jurisdictionOfDocumentUse
      });
    }
    
    if (formData?.step2) {
      console.log('Step 2 - Document Type:', formData.step2.documentType);
    }
    
    if (formData?.documentForms) {
      console.log('Document Forms:', Object.keys(formData.documentForms));
      Object.entries(formData.documentForms).forEach(([type, data]) => {
        console.log(`${type} document:`, data.documentUrl ? '✅ Has URL' : '❌ No URL');
      });
    }
    console.groupEnd();
  },

  // Log submission data from Firebase
  logSubmissionData: (submissionData) => {
    console.group('🔍 E-Sign Debug: Submission Data');
    console.log('Submission Object:', submissionData);
    console.log('Document URL:', submissionData?.documentUrl);
    console.log('Approved URL:', submissionData?.approvedDocURL);
    console.log('Reference Number:', submissionData?.referenceNumber);
    console.log('Signed At:', submissionData?.signedAt);
    console.groupEnd();
  },

  // Test PDF URL accessibility
  testPdfUrl: async (url) => {
    if (!url) {
      console.warn('🔍 E-Sign Debug: No URL provided for testing');
      return false;
    }

    console.group('🔍 E-Sign Debug: PDF URL Test');
    console.log('Testing URL:', url);
    
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors' // Avoid CORS issues for testing
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const isAccessible = response.ok;
      console.log('URL accessible:', isAccessible ? '✅ Yes' : '❌ No');
      console.groupEnd();
      return isAccessible;
    } catch (error) {
      console.error('URL test failed:', error);
      console.log('URL accessible: ❌ No (Error)');
      console.groupEnd();
      return false;
    }
  },

  // Check localStorage health
  checkStorageHealth: () => {
    console.group('🔍 E-Sign Debug: Storage Health');
    
    try {
      const testKey = 'storage_test';
      localStorage.setItem(testKey, 'test');
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      console.log('LocalStorage working:', retrieved === 'test' ? '✅ Yes' : '❌ No');
      
      // Check form data
      const formDataRaw = localStorage.getItem('form2_data');
      console.log('Form data exists:', formDataRaw ? '✅ Yes' : '❌ No');
      
      if (formDataRaw) {
        try {
          const parsed = JSON.parse(formDataRaw);
          console.log('Form data valid JSON:', '✅ Yes');
          console.log('Form data size:', formDataRaw.length, 'characters');
        } catch (e) {
          console.log('Form data valid JSON:', '❌ No - Corrupted!');
        }
      }
      
    } catch (error) {
      console.error('Storage test failed:', error);
    }
    
    console.groupEnd();
  },

  // Comprehensive system check
  runSystemCheck: async (formData, submissionData) => {
    console.log('🔍 Starting E-Sign System Check...');
    
    // Check 1: Form Data
    this.logFormData(formData);
    
    // Check 2: Submission Data
    this.logSubmissionData(submissionData);
    
    // Check 3: Storage Health
    this.checkStorageHealth();
    
    // Check 4: PDF URL Accessibility
    const originalUrl = submissionData?.documentUrl;
    const signedUrl = submissionData?.approvedDocURL;
    
    if (originalUrl) {
      await this.testPdfUrl(originalUrl);
    }
    
    if (signedUrl) {
      await this.testPdfUrl(signedUrl);
    }
    
    console.log('🔍 E-Sign System Check Complete!');
  },

  // Check if submission is ready for signing
  validateReadyForSigning: (formData, submissionData) => {
    const issues = [];
    
    if (!formData) {
      issues.push('❌ No form data found');
    } else {
      if (!formData.step1) issues.push('❌ Missing step 1 (user info)');
      if (!formData.step2) issues.push('❌ Missing step 2 (document type)');
      if (!formData.submissionId) issues.push('❌ Missing submission ID');
    }
    
    if (!submissionData) {
      issues.push('❌ No submission data found');
    } else {
      if (!submissionData.documentUrl) issues.push('❌ Missing document URL');
      if (!submissionData.id) issues.push('❌ Missing submission ID');
    }
    
    console.group('🔍 E-Sign Debug: Ready for Signing Check');
    if (issues.length === 0) {
      console.log('✅ All checks passed - Ready for signing!');
    } else {
      console.log('❌ Issues found:');
      issues.forEach(issue => console.log(issue));
    }
    console.groupEnd();
    
    return issues.length === 0;
  }
};

// Export for use in components
export default debugESign;
