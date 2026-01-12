// Generic React hook for document form database operations
// This hook provides all the functionality needed for document forms to save/load data

import { useState, useEffect, useCallback, useRef } from 'react';
import { saveDocumentFormDataLocalAndDB, getDocumentFormDataWithFallback, autoSaveDocumentFormData } from '@/utils/documentFormStorage';

/**
 * Generic document form hook that provides:
 * - Auto-loading from database
 * - Auto-saving with debounce
 * - Loading states and save status
 * - Form validation
 * - Field change handlers
 * 
 * @param {string} documentType - The document type (e.g., 'affidavit-of-identity')
 * @param {object} initialFormData - Initial form data structure
 * @param {array} requiredFields - Array of required field names
 * @param {function} customValidation - Optional custom validation function
 * @param {function} onFormDataChange - Callback when form data changes
 */
export const useDocumentForm = ({
  documentType,
  initialFormData = {},
  requiredFields = [],
  customValidation = null,
  onFormDataChange = () => {},
  autoSaveDelayMs = 2000
}) => {
  // State management
  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved', 'error'
  const [isValid, setIsValid] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Use refs to store stable references
  const onFormDataChangeRef = useRef(onFormDataChange);
  const customValidationRef = useRef(customValidation);
  const requiredFieldsRef = useRef(requiredFields);
  
  // Update refs when props change
  useEffect(() => {
    onFormDataChangeRef.current = onFormDataChange;
  }, [onFormDataChange]);
  
  useEffect(() => {
    customValidationRef.current = customValidation;
  }, [customValidation]);
  
  useEffect(() => {
    requiredFieldsRef.current = requiredFields;
  }, [requiredFields]);

  // Load initial data from database on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        console.log(`Loading ${documentType} form data from database...`);
        
        // Get data from database with localStorage fallback
        const savedData = await getDocumentFormDataWithFallback(documentType);
        
        if (savedData && Object.keys(savedData).length > 0) {
          console.log(`Loaded ${documentType} data:`, Object.keys(savedData));
          setFormData(prev => ({
            ...prev,
            ...savedData
          }));
        } else {
          console.log(`No existing ${documentType} data found`);
        }
      } catch (error) {
        console.error(`Error loading initial ${documentType} data:`, error);
        setSaveStatus('error');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, [documentType]);

  // Notify parent component when form data changes
  useEffect(() => {
    if (onFormDataChangeRef.current) {
      onFormDataChangeRef.current(formData);
    }
  }, [formData]);

  // Auto-save effect when form data changes (excluding initial load)
  useEffect(() => {
    if (!isLoading) {
      setSaveStatus('saving');
      
      // Auto-save with debounce
      autoSaveDocumentFormData(documentType, formData, autoSaveDelayMs);
      
      // Update save status after delay
      const statusTimeout = setTimeout(() => {
        setSaveStatus('saved');
      }, autoSaveDelayMs + 500);
      
      return () => clearTimeout(statusTimeout);
    }
  }, [formData, isLoading, documentType, autoSaveDelayMs]);

  // Validation effect
  useEffect(() => {
    const validateForm = () => {
      const errors = {};
      let valid = true;

      // Check required fields
      const currentRequiredFields = requiredFieldsRef.current || [];
      currentRequiredFields.forEach(field => {
        const value = formData[field];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors[field] = 'This field is required';
          valid = false;
        }
      });

      // Run custom validation if provided
      const currentCustomValidation = customValidationRef.current;
      if (currentCustomValidation) {
        const customErrors = currentCustomValidation(formData);
        if (customErrors && Object.keys(customErrors).length > 0) {
          Object.assign(errors, customErrors);
          valid = false;
        }
      }

      setValidationErrors(errors);
      setIsValid(valid);
      return valid;
    };

    validateForm();
  }, [formData]);

  // Field change handler
  const handleFieldChange = useCallback((field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear save status when user makes changes
    if (saveStatus === 'saved') {
      setSaveStatus('');
    }
  }, [saveStatus]);

  // Multiple fields change handler
  const handleMultipleFieldsChange = useCallback((updates) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
    
    // Clear save status when user makes changes
    if (saveStatus === 'saved') {
      setSaveStatus('');
    }
  }, [saveStatus]);

  // Radio change handler
  const handleRadioChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear save status when user makes changes
    if (saveStatus === 'saved') {
      setSaveStatus('');
    }
  }, [saveStatus]);

  // Force save function (for manual saves)
  const forceSave = useCallback(async () => {
    try {
      setSaveStatus('saving');
      await saveDocumentFormDataLocalAndDB(documentType, formData);
      setSaveStatus('saved');
      return true;
    } catch (error) {
      console.error(`Error force saving ${documentType} data:`, error);
      setSaveStatus('error');
      return false;
    }
  }, [documentType, formData]);

  // Reset form function
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setValidationErrors({});
    setSaveStatus('');
  }, [initialFormData]);

  // Update form data programmatically
  const updateFormData = useCallback((newData) => {
    setFormData(newData);
  }, []);

  // Get field error
  const getFieldError = useCallback((field) => {
    return validationErrors[field];
  }, [validationErrors]);

  // Check if field has error
  const hasFieldError = useCallback((field) => {
    return Boolean(validationErrors[field]);
  }, [validationErrors]);

  return {
    // State
    formData,
    isLoading,
    saveStatus,
    isValid,
    validationErrors,
    
    // Handlers
    handleFieldChange,
    handleMultipleFieldsChange,
    handleRadioChange,
    
    // Actions
    forceSave,
    resetForm,
    updateFormData,
    
    // Validation helpers
    getFieldError,
    hasFieldError,
    
    // Status indicators for UI
    isSaving: saveStatus === 'saving',
    isSaved: saveStatus === 'saved',
    hasError: saveStatus === 'error'
  };
};

export default useDocumentForm;
