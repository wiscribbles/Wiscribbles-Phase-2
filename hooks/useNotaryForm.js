import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  saveNotaryFormData, 
  getNotaryFormData, 
  clearNotaryFormData, 
  submitNotaryFormData,
  getNotarySessionData,
  updateNotarySession 
} from '@/utils/notaryFormStorage';

/**
 * Custom hook for managing notary form workflow
 * Handles form state, validation, submission, and video call integration
 */
export const useNotaryForm = (options = {}) => {
  const {
    autoSave = true,
    validateOnChange = true,
    clearOnSubmit = true
  } = options;

  // Form state management
  const [formData, setFormData] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submission, setSubmission] = useState(null);
  const [meetingId, setMeetingId] = useState(null);

  // Load saved form data on mount
  useEffect(() => {
    const savedData = getNotaryFormData();
    if (savedData && Object.keys(savedData).length > 0) {
      setFormData(savedData);
      console.log('Loaded notary form data:', savedData);
    }
  }, []);

  // Auto-save form data when it changes
  useEffect(() => {
    if (autoSave && Object.keys(formData).length > 0) {
      Object.keys(formData).forEach(step => {
        if (step.startsWith('step') && formData[step]) {
          const stepNumber = parseInt(step.replace('step', ''));
          saveNotaryFormData(stepNumber, formData[step]);
        }
      });
    }
  }, [formData, autoSave]);

  /**
   * Update form data for a specific step
   */
  const updateStepData = useCallback((step, data) => {
    setFormData(prev => ({
      ...prev,
      [`step${step}`]: {
        ...prev[`step${step}`],
        ...data
      }
    }));

    // Clear errors for updated fields
    if (errors[`step${step}`]) {
      setErrors(prev => ({
        ...prev,
        [`step${step}`]: {}
      }));
    }

    // Auto-save immediately
    if (autoSave) {
      saveNotaryFormData(step, data);
    }
  }, [autoSave, errors]);

  /**
   * Update individual field in current step
   */
  const updateField = useCallback((field, value) => {
    updateStepData(currentStep, { [field]: value });
  }, [currentStep, updateStepData]);

  /**
   * Validate form data for a specific step
   */
  const validateStep = useCallback((step, data = null) => {
    const stepData = data || formData[`step${step}`] || {};
    const stepErrors = {};

    switch (step) {
      case 1:
        if (!stepData.firstName?.trim()) stepErrors.firstName = 'First name is required';
        if (!stepData.lastName?.trim()) stepErrors.lastName = 'Last name is required';
        if (!stepData.email?.trim()) stepErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stepData.email)) {
          stepErrors.email = 'Please enter a valid email address';
        }
        if (!stepData.phone?.trim()) stepErrors.phone = 'Phone number is required';
        if (!stepData.jurisdictionOfDocumentUse?.trim()) {
          stepErrors.jurisdictionOfDocumentUse = 'Jurisdiction is required';
        }
        break;

      case 2:
        if (!stepData.documentType?.trim()) stepErrors.documentType = 'Document type is required';
        // Document URL is optional for notary flow as it can be uploaded during video call
        break;

      case 3:
        if (stepData.signingOption !== 'notary') {
          stepErrors.signingOption = 'Notary signing option is required';
        }
        // Add scheduling validation if appointment scheduling is implemented
        break;

      case 4:
        // Payment validation (if required before notary session)
        if (stepData.paymentRequired && !stepData.paymentMethod) {
          stepErrors.paymentMethod = 'Payment method is required';
        }
        break;

      default:
        break;
    }

    setErrors(prev => ({
      ...prev,
      [`step${step}`]: stepErrors
    }));

    return Object.keys(stepErrors).length === 0;
  }, [formData]);

  /**
   * Validate all form steps
   */
  const validateAllSteps = useCallback(() => {
    let isValid = true;
    for (let step = 1; step <= 3; step++) {
      if (!validateStep(step)) {
        isValid = false;
      }
    }
    return isValid;
  }, [validateStep]);

  /**
   * Move to next step with validation
   */
  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
      return true;
    }
    return false;
  }, [currentStep, validateStep]);

  /**
   * Move to previous step
   */
  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  /**
   * Go to specific step
   */
  const goToStep = useCallback((step) => {
    if (step >= 1 && step <= 5) {
      setCurrentStep(step);
    }
  }, []);

  /**
   * Submit notary form for scheduling
   */
  const submitForm = useCallback(async (additionalData = {}) => {
    if (!validateAllSteps()) {
      toast.error('Please complete all required fields before submitting');
      return { success: false, error: 'Validation failed' };
    }

    setIsSubmitting(true);
    try {
      console.log('Submitting notary form...', formData);

      // Prepare submission data
      const submissionData = {
        ...formData,
        ...additionalData,
        // Add metadata
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        userAgent: navigator.userAgent,
        submittedAt: new Date().toISOString()
      };

      // Use API route for submission
      const response = await fetch('/api/notary/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Submission failed');
      }

      console.log('Notary form submitted successfully:', result);

      // Update state with submission results
      setSubmission(result.data);
      setMeetingId(result.data.meetingId);

      // Clear local storage if requested
      if (clearOnSubmit) {
        clearNotaryFormData();
      }

      toast.success('Notary session scheduled successfully!');
      
      return result;

    } catch (error) {
      console.error('Error submitting notary form:', error);
      toast.error(error.message || 'Failed to schedule notary session');
      return { success: false, error: error.message };
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateAllSteps, clearOnSubmit]);

  /**
   * Load notary session data by meeting ID
   */
  const loadSession = useCallback(async (sessionMeetingId) => {
    setIsLoading(true);
    try {
      const sessionData = await getNotarySessionData(sessionMeetingId);
      setSubmission(sessionData);
      setMeetingId(sessionMeetingId);
      
      // Optionally load form data from session
      if (sessionData.step1 || sessionData.step2 || sessionData.step3) {
        const loadedFormData = {};
        if (sessionData.step1) loadedFormData.step1 = sessionData.step1;
        if (sessionData.step2) loadedFormData.step2 = sessionData.step2;
        if (sessionData.step3) loadedFormData.step3 = sessionData.step3;
        if (sessionData.step4) loadedFormData.step4 = sessionData.step4;
        
        setFormData(loadedFormData);
      }

      return sessionData;
    } catch (error) {
      console.error('Error loading notary session:', error);
      toast.error('Failed to load session data');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update notary session data
   */
  const updateSession = useCallback(async (sessionId, updates) => {
    try {
      await updateNotarySession(sessionId, updates);
      
      // Update local submission state
      setSubmission(prev => ({
        ...prev,
        ...updates
      }));

      return { success: true };
    } catch (error) {
      console.error('Error updating notary session:', error);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Clear all form data and reset state
   */
  const clearForm = useCallback(() => {
    setFormData({});
    setCurrentStep(1);
    setErrors({});
    setSubmission(null);
    setMeetingId(null);
    clearNotaryFormData();
    toast.success('Form cleared');
  }, []);

  /**
   * Get form progress percentage
   */
  const getProgress = useCallback(() => {
    const completedSteps = Object.keys(formData).filter(key => 
      key.startsWith('step') && formData[key] && Object.keys(formData[key]).length > 0
    ).length;
    
    return Math.round((completedSteps / 3) * 100); // 3 required steps
  }, [formData]);

  /**
   * Check if current step is valid
   */
  const isCurrentStepValid = useCallback(() => {
    return validateStep(currentStep);
  }, [currentStep, validateStep]);

  /**
   * Get errors for current step
   */
  const getCurrentStepErrors = useCallback(() => {
    return errors[`step${currentStep}`] || {};
  }, [currentStep, errors]);

  return {
    // State
    formData,
    currentStep,
    isLoading,
    isSubmitting,
    errors,
    submission,
    meetingId,
    
    // Actions
    updateStepData,
    updateField,
    nextStep,
    prevStep,
    goToStep,
    submitForm,
    loadSession,
    updateSession,
    clearForm,
    
    // Validation
    validateStep,
    validateAllSteps,
    isCurrentStepValid,
    getCurrentStepErrors,
    
    // Utilities
    getProgress,
    
    // Computed values
    isFormValid: validateAllSteps(),
    hasSubmission: !!submission,
    canProceedToNext: isCurrentStepValid(),
    completionPercentage: getProgress()
  };
};

export default useNotaryForm;
