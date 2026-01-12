// Utility functions to handle document-specific form data in the database
import { generateSessionId, getUserId } from './sessionUtils';

// Generate a session ID if not already exists
const getOrCreateSessionId = () => {
  let sessionId = localStorage.getItem('wiscribble_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('wiscribble_session_id', sessionId);
  }
  return sessionId;
};

// Get user ID from authentication context or localStorage
const getCurrentUserId = () => {
  // Try to get from auth context first, then fallback to localStorage
  try {
    // You might want to integrate this with your auth system
    const userId = localStorage.getItem('wiscribble_user_id');
    return userId;
  } catch (error) {
    console.warn('Could not get user ID:', error);
    return null;
  }
};

// Save document form data to database
export const saveDocumentFormData = async (documentType, formData) => {
  try {
    const userId = getCurrentUserId();
    const sessionId = getOrCreateSessionId();
    
    console.log('Saving document form data:', { documentType, userId: userId || 'anonymous' });
    
    const response = await fetch('/api/document-forms/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        sessionId,
        documentType,
        formData
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to save document form data');
    }
    
    console.log('Document form data saved successfully:', result.data.id);
    return result.data;
    
  } catch (error) {
    console.error('Error saving document form data:', error);
    throw error;
  }
};

// Retrieve document form data from database
export const getDocumentFormData = async (documentType) => {
  try {
    const userId = getCurrentUserId();
    const sessionId = getOrCreateSessionId();
    
    console.log('Retrieving document form data:', { documentType, userId: userId || 'anonymous' });
    
    const params = new URLSearchParams({
      documentType,
      ...(userId ? { userId } : { sessionId })
    });
    
    const response = await fetch(`/api/document-forms/save?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to retrieve document form data');
    }
    
    console.log('Document form data retrieved:', result.data.status);
    return result.data.formData || {};
    
  } catch (error) {
    console.error('Error retrieving document form data:', error);
    // Return empty object as fallback
    return {};
  }
};

// Save document form data with auto-save functionality (debounced)
let saveTimeout = null;
export const autoSaveDocumentFormData = (documentType, formData, delayMs = 1000) => {
  // Clear existing timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  // Set new timeout for auto-save
  saveTimeout = setTimeout(async () => {
    try {
      await saveDocumentFormData(documentType, formData);
      console.log('Auto-saved document form data for:', documentType);
    } catch (error) {
      console.warn('Auto-save failed for document form:', error);
      // Don't throw error for auto-save failures
    }
  }, delayMs);
};

// Mark document form as submitted (update status)
export const markDocumentFormAsSubmitted = async (documentType) => {
  try {
    const userId = getCurrentUserId();
    const sessionId = getOrCreateSessionId();
    
    // Get current data first
    const currentData = await getDocumentFormData(documentType);
    
    // Update with submitted status
    const response = await fetch('/api/document-forms/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        sessionId,
        documentType,
        formData: currentData,
        status: 'submitted'
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to mark document form as submitted');
    }
    
    return result.data;
    
  } catch (error) {
    console.error('Error marking document form as submitted:', error);
    throw error;
  }
};

// Enhanced localStorage functions that also sync with database
export const saveDocumentFormDataLocalAndDB = async (documentType, formData) => {
  try {
    // Save to localStorage for immediate access
    const existingLocalData = JSON.parse(localStorage.getItem('form2_data') || '{}');
    const updatedLocalData = {
      ...existingLocalData,
      documentForms: {
        ...existingLocalData.documentForms,
        [documentType]: formData
      }
    };
    localStorage.setItem('form2_data', JSON.stringify(updatedLocalData));
    
    // Also save to database
    await saveDocumentFormData(documentType, formData);
    
    return true;
  } catch (error) {
    console.error('Error saving to local and DB:', error);
    return false;
  }
};

// Get document form data with fallback to localStorage
export const getDocumentFormDataWithFallback = async (documentType) => {
  try {
    // Try to get from database first
    const dbData = await getDocumentFormData(documentType);
    
    // If we got data from database, return it
    if (dbData && Object.keys(dbData).length > 0) {
      return dbData;
    }
    
    // Fallback to localStorage
    const localData = JSON.parse(localStorage.getItem('form2_data') || '{}');
    return localData.documentForms?.[documentType] || {};
    
  } catch (error) {
    console.error('Error getting document form data with fallback:', error);
    
    // Final fallback to localStorage only
    try {
      const localData = JSON.parse(localStorage.getItem('form2_data') || '{}');
      return localData.documentForms?.[documentType] || {};
    } catch (localError) {
      console.error('Error with localStorage fallback:', localError);
      return {};
    }
  }
};
