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

// Utility function to upload file to Cloudinary
export const uploadToCloudinary = async (file, folder = '') => {
  if (!file) return null;

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'wiscribbles');
    formData.append('cloud_name', 'dgyv432jt');

    if (folder) {
      formData.append('folder', folder);
    }

    // Determine the correct endpoint based on file type
    const isPDF = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
    const uploadEndpoint = isPDF 
      ? 'https://api.cloudinary.com/v1_1/dgyv432jt/raw/upload'
      : 'https://api.cloudinary.com/v1_1/dgyv432jt/image/upload';
    
    // Add resource_type for PDFs
    if (isPDF) {
      formData.append('resource_type', 'raw');
    }

    console.log(`Uploading ${isPDF ? 'PDF' : 'image'} to Cloudinary:`, file.name);

    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary upload failed:', response.status, errorText);
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Cloudinary upload successful:', data.secure_url);
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};
