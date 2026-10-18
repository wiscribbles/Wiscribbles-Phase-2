import { uploadFile } from '@/lib/storage/client';
// Utility functions to handle form data in localStorage

const FORM_DATA_KEY = 'form2_data';

export const saveFormData = (step, data) => {
  try {
    // Get existing data
    const existingData = getFormData();
    
    // Update data for current step
    const updatedData = {
      ...existingData,
      [`step${step}`]: data
    };
    
    // Save to localStorage
    localStorage.setItem(FORM_DATA_KEY, JSON.stringify(updatedData));
    return true;
  } catch (error) {
    console.error('Error saving form data:', error);
    return false;
  }
};

export const getFormData = () => {
  try {
    const data = localStorage.getItem(FORM_DATA_KEY);
    if (!data) return {};
    
    const parsedData = JSON.parse(data);
    // Validate the data structure
    if (typeof parsedData !== 'object' || parsedData === null) {
      console.warn('Invalid form data structure, resetting...');
      clearFormData();
      return {};
    }
    
    return parsedData;
  } catch (error) {
    console.error('Error getting form data:', error);
    console.warn('Clearing corrupted form data...');
    clearFormData();
    return {};
  }
};

export const clearFormData = () => {
  try {
    localStorage.removeItem(FORM_DATA_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing form data:', error);
    return false;
  }
};

// Save document-specific form data
export const saveDocumentFormData = (documentType, data) => {
  try {
    const existingData = getFormData();
    const updatedData = {
      ...existingData,
      documentForms: {
        ...existingData.documentForms,
        [documentType]: data
      }
    };
    localStorage.setItem(FORM_DATA_KEY, JSON.stringify(updatedData));
    return true;
  } catch (error) {
    console.error('Error saving document form data:', error);
    return false;
  }
};

// Get document-specific form data
export const getDocumentFormData = (documentType) => {
  try {
    const data = getFormData();
    return data.documentForms?.[documentType] || {};
  } catch (error) {
    console.error('Error getting document form data:', error);
    return {};
  }
};

// Save submission ID
export const saveSubmissionId = (submissionId) => {
  try {
    const existingData = getFormData();
    const updatedData = {
      ...existingData,
      submissionId: submissionId
    };
    localStorage.setItem(FORM_DATA_KEY, JSON.stringify(updatedData));
    return true;
  } catch (error) {
    console.error('Error saving submission ID:', error);
    return false;
  }
};

// Get submission ID
export const getSubmissionId = () => {
  try {
    const data = getFormData();
    return data.submissionId || null;
  } catch (error) {
    console.error('Error getting submission ID:', error);
    return null;
  }
};

// Utility function to upload a file to Firebase Storage
export const uploadStoredPdf = async (file, folder = '') => {
  // Name kept so existing call sites still work; the implementation is now
  // Firebase Storage via /api/uploads. Cloudinary is gone, along with the
  // cloud name and unsigned preset this function used to carry in the browser.
  if (!file) return null;
  const purpose = folder.includes('signature') ? 'signature'
    : folder.includes('identification') ? 'identification'
    : folder.includes('certificate') ? 'certificate'
    : 'generated';
  const { url } = await uploadFile(file, { purpose });
  return url;
};
