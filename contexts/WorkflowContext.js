'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Workflow states
export const WORKFLOW_STATES = {
  DOCUMENT_SELECTION: 'document_selection',
  FORM_FILLING: 'form_filling',
  SERVICE_SELECTION: 'service_selection', // e-sign vs notary
  PAYMENT: 'payment',
  VIDEO_CALL: 'video_call',
  DOCUMENT_SIGNING: 'document_signing',
  COMPLETED: 'completed'
};

// Form submission states
export const FORM_STATES = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress',
  AWAITING_NOTARY: 'awaiting_notary',
  BEING_NOTARIZED: 'being_notarized',
  SIGNED: 'signed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// User roles
export const USER_ROLES = {
  CLIENT: 'client',
  NOTARY: 'notary'
};

// Initial state
const initialState = {
  // Current workflow step
  currentStep: WORKFLOW_STATES.DOCUMENT_SELECTION,
  
  // Document and form data
  selectedDocumentType: null,
  selectedSubtype: null,
  documentConfig: null,
  formData: {},
  currentFormSection: 0,
  formErrors: {},
  formState: FORM_STATES.DRAFT,
  
  // Service selection
  selectedService: null, // 'e-sign' or 'notary'
  
  // User information
  userRole: USER_ROLES.CLIENT,
  userId: null,
  sessionId: null,
  
  // Video call data
  videoCallActive: false,
  notaryId: null,
  callStartTime: null,
  
  // Real-time collaboration
  isCollaborative: false,
  collaborators: [],
  lastSyncTime: null,
  
  // Payment information
  paymentData: null,
  paymentStatus: null,
  
  // Document status
  documentStatus: 'pending',
  finalDocumentUrl: null,
  signatures: {},
  
  // UI state
  isLoading: false,
  error: null,
  notifications: []
};

// Action types
const ACTION_TYPES = {
  SET_DOCUMENT_TYPE: 'SET_DOCUMENT_TYPE',
  SET_DOCUMENT_SUBTYPE: 'SET_DOCUMENT_SUBTYPE',
  SET_FORM_DATA: 'SET_FORM_DATA',
  UPDATE_FORM_FIELD: 'UPDATE_FORM_FIELD',
  SET_FORM_ERRORS: 'SET_FORM_ERRORS',
  CLEAR_FORM_ERRORS: 'CLEAR_FORM_ERRORS',
  NEXT_FORM_SECTION: 'NEXT_FORM_SECTION',
  PREV_FORM_SECTION: 'PREV_FORM_SECTION',
  SET_FORM_SECTION: 'SET_FORM_SECTION',
  SET_WORKFLOW_STEP: 'SET_WORKFLOW_STEP',
  SET_SERVICE_TYPE: 'SET_SERVICE_TYPE',
  SET_USER_ROLE: 'SET_USER_ROLE',
  START_VIDEO_CALL: 'START_VIDEO_CALL',
  END_VIDEO_CALL: 'END_VIDEO_CALL',
  ADD_COLLABORATOR: 'ADD_COLLABORATOR',
  REMOVE_COLLABORATOR: 'REMOVE_COLLABORATOR',
  SYNC_FORM_DATA: 'SYNC_FORM_DATA',
  SET_PAYMENT_DATA: 'SET_PAYMENT_DATA',
  ADD_SIGNATURE: 'ADD_SIGNATURE',
  SET_DOCUMENT_STATUS: 'SET_DOCUMENT_STATUS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  RESET_WORKFLOW: 'RESET_WORKFLOW'
};

// Reducer function
function workflowReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_DOCUMENT_TYPE:
      return {
        ...state,
        selectedDocumentType: action.payload.documentType,
        selectedSubtype: action.payload.subtype || null,
        documentConfig: action.payload.config,
        formData: {},
        currentFormSection: 0,
        formErrors: {}
      };

    case ACTION_TYPES.SET_DOCUMENT_SUBTYPE:
      return {
        ...state,
        selectedSubtype: action.payload.subtype,
        documentConfig: action.payload.config,
        formData: {},
        currentFormSection: 0,
        formErrors: {}
      };

    case ACTION_TYPES.SET_FORM_DATA:
      return {
        ...state,
        formData: { ...state.formData, ...action.payload },
        lastSyncTime: Date.now()
      };

    case ACTION_TYPES.UPDATE_FORM_FIELD:
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.payload.fieldId]: action.payload.value
        },
        lastSyncTime: Date.now()
      };

    case ACTION_TYPES.SET_FORM_ERRORS:
      return {
        ...state,
        formErrors: { ...state.formErrors, ...action.payload }
      };

    case ACTION_TYPES.CLEAR_FORM_ERRORS:
      return {
        ...state,
        formErrors: action.payload?.fieldId 
          ? { ...state.formErrors, [action.payload.fieldId]: null }
          : {}
      };

    case ACTION_TYPES.NEXT_FORM_SECTION:
      return {
        ...state,
        currentFormSection: Math.min(
          state.currentFormSection + 1,
          (state.documentConfig?.sections?.length || 1) - 1
        )
      };

    case ACTION_TYPES.PREV_FORM_SECTION:
      return {
        ...state,
        currentFormSection: Math.max(state.currentFormSection - 1, 0)
      };

    case ACTION_TYPES.SET_FORM_SECTION:
      return {
        ...state,
        currentFormSection: action.payload
      };

    case ACTION_TYPES.SET_WORKFLOW_STEP:
      return {
        ...state,
        currentStep: action.payload
      };

    case ACTION_TYPES.SET_SERVICE_TYPE:
      return {
        ...state,
        selectedService: action.payload,
        isCollaborative: action.payload === 'notary'
      };

    case ACTION_TYPES.SET_USER_ROLE:
      return {
        ...state,
        userRole: action.payload.role,
        userId: action.payload.userId,
        sessionId: action.payload.sessionId
      };

    case ACTION_TYPES.START_VIDEO_CALL:
      return {
        ...state,
        videoCallActive: true,
        notaryId: action.payload.notaryId,
        callStartTime: Date.now(),
        currentStep: WORKFLOW_STATES.VIDEO_CALL
      };

    case ACTION_TYPES.END_VIDEO_CALL:
      return {
        ...state,
        videoCallActive: false,
        callStartTime: null
      };

    case ACTION_TYPES.ADD_COLLABORATOR:
      return {
        ...state,
        collaborators: [...state.collaborators, action.payload]
      };

    case ACTION_TYPES.REMOVE_COLLABORATOR:
      return {
        ...state,
        collaborators: state.collaborators.filter(c => c.id !== action.payload)
      };

    case ACTION_TYPES.SYNC_FORM_DATA:
      return {
        ...state,
        formData: { ...state.formData, ...action.payload.formData },
        lastSyncTime: action.payload.timestamp || Date.now()
      };

    case ACTION_TYPES.SET_PAYMENT_DATA:
      return {
        ...state,
        paymentData: action.payload.data,
        paymentStatus: action.payload.status
      };

    case ACTION_TYPES.ADD_SIGNATURE:
      return {
        ...state,
        signatures: {
          ...state.signatures,
          [action.payload.fieldId]: {
            signature: action.payload.signature,
            signedBy: action.payload.signedBy,
            signedAt: action.payload.signedAt || Date.now()
          }
        }
      };

    case ACTION_TYPES.SET_DOCUMENT_STATUS:
      return {
        ...state,
        documentStatus: action.payload.status,
        finalDocumentUrl: action.payload.url || state.finalDocumentUrl
      };

    case ACTION_TYPES.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case ACTION_TYPES.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case ACTION_TYPES.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, {
          id: Date.now(),
          ...action.payload
        }]
      };

    case ACTION_TYPES.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };

    case ACTION_TYPES.RESET_WORKFLOW:
      return {
        ...initialState,
        userId: state.userId,
        sessionId: state.sessionId
      };

    default:
      return state;
  }
}

// Create context
const WorkflowContext = createContext();

// Custom hook to use workflow context
export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

// Provider component
export const WorkflowProvider = ({ children }) => {
  const [state, dispatch] = useReducer(workflowReducer, initialState);

  // Helper functions
  const actions = {
    // Document and form actions
    setDocumentType: (documentType, config, subtype = null) => {
      dispatch({
        type: ACTION_TYPES.SET_DOCUMENT_TYPE,
        payload: { documentType, config, subtype }
      });
    },

    setDocumentSubtype: (subtype, config) => {
      dispatch({
        type: ACTION_TYPES.SET_DOCUMENT_SUBTYPE,
        payload: { subtype, config }
      });
    },

    updateFormField: (fieldId, value) => {
      dispatch({
        type: ACTION_TYPES.UPDATE_FORM_FIELD,
        payload: { fieldId, value }
      });
    },

    setFormData: (formData) => {
      dispatch({
        type: ACTION_TYPES.SET_FORM_DATA,
        payload: formData
      });
    },

    setFormErrors: (errors) => {
      dispatch({
        type: ACTION_TYPES.SET_FORM_ERRORS,
        payload: errors
      });
    },

    clearFormErrors: (fieldId) => {
      dispatch({
        type: ACTION_TYPES.CLEAR_FORM_ERRORS,
        payload: fieldId ? { fieldId } : null
      });
    },

    // Navigation actions
    nextFormSection: () => {
      dispatch({ type: ACTION_TYPES.NEXT_FORM_SECTION });
    },

    prevFormSection: () => {
      dispatch({ type: ACTION_TYPES.PREV_FORM_SECTION });
    },

    setFormSection: (sectionIndex) => {
      dispatch({
        type: ACTION_TYPES.SET_FORM_SECTION,
        payload: sectionIndex
      });
    },

    setWorkflowStep: (step) => {
      dispatch({
        type: ACTION_TYPES.SET_WORKFLOW_STEP,
        payload: step
      });
    },

    // Service and user actions
    setServiceType: (serviceType) => {
      dispatch({
        type: ACTION_TYPES.SET_SERVICE_TYPE,
        payload: serviceType
      });
    },

    setUserRole: (role, userId, sessionId) => {
      dispatch({
        type: ACTION_TYPES.SET_USER_ROLE,
        payload: { role, userId, sessionId }
      });
    },

    // Video call actions
    startVideoCall: (notaryId) => {
      dispatch({
        type: ACTION_TYPES.START_VIDEO_CALL,
        payload: { notaryId }
      });
    },

    endVideoCall: () => {
      dispatch({ type: ACTION_TYPES.END_VIDEO_CALL });
    },

    // Collaboration actions
    addCollaborator: (collaborator) => {
      dispatch({
        type: ACTION_TYPES.ADD_COLLABORATOR,
        payload: collaborator
      });
    },

    syncFormData: (formData, timestamp) => {
      dispatch({
        type: ACTION_TYPES.SYNC_FORM_DATA,
        payload: { formData, timestamp }
      });
    },

    // Signature actions
    addSignature: (fieldId, signature, signedBy) => {
      dispatch({
        type: ACTION_TYPES.ADD_SIGNATURE,
        payload: { fieldId, signature, signedBy }
      });
    },

    // Payment actions
    setPaymentData: (data, status) => {
      dispatch({
        type: ACTION_TYPES.SET_PAYMENT_DATA,
        payload: { data, status }
      });
    },

    // Document status actions
    setDocumentStatus: (status, url) => {
      dispatch({
        type: ACTION_TYPES.SET_DOCUMENT_STATUS,
        payload: { status, url }
      });
    },

    // UI actions
    setLoading: (loading) => {
      dispatch({
        type: ACTION_TYPES.SET_LOADING,
        payload: loading
      });
    },

    setError: (error) => {
      dispatch({
        type: ACTION_TYPES.SET_ERROR,
        payload: error
      });
    },

    addNotification: (type, message, duration = 5000) => {
      const id = Date.now();
      dispatch({
        type: ACTION_TYPES.ADD_NOTIFICATION,
        payload: { id, type, message, duration }
      });

      // Auto remove notification
      if (duration > 0) {
        setTimeout(() => {
          dispatch({
            type: ACTION_TYPES.REMOVE_NOTIFICATION,
            payload: id
          });
        }, duration);
      }
    },

    removeNotification: (id) => {
      dispatch({
        type: ACTION_TYPES.REMOVE_NOTIFICATION,
        payload: id
      });
    },

    // Reset workflow
    resetWorkflow: () => {
      dispatch({ type: ACTION_TYPES.RESET_WORKFLOW });
    }
  };

  // Auto-save to localStorage
  useEffect(() => {
    if (state.formData && Object.keys(state.formData).length > 0) {
      const workflowData = {
        selectedDocumentType: state.selectedDocumentType,
        formData: state.formData,
        currentFormSection: state.currentFormSection,
        selectedService: state.selectedService,
        currentStep: state.currentStep,
        savedAt: Date.now()
      };
      localStorage.setItem('workflowState', JSON.stringify(workflowData));
    }
  }, [state.formData, state.currentFormSection, state.selectedDocumentType]);

  // Load saved state on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('workflowState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Only restore if saved within last 24 hours
        if (Date.now() - parsed.savedAt < 24 * 60 * 60 * 1000) {
          if (parsed.selectedDocumentType) {
            actions.setDocumentType(parsed.selectedDocumentType, null);
          }
          if (parsed.formData) {
            actions.setFormData(parsed.formData);
          }
          if (parsed.currentFormSection !== undefined) {
            actions.setFormSection(parsed.currentFormSection);
          }
          if (parsed.selectedService) {
            actions.setServiceType(parsed.selectedService);
          }
          if (parsed.currentStep && parsed.currentStep !== WORKFLOW_STATES.VIDEO_CALL) {
            actions.setWorkflowStep(parsed.currentStep);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to restore workflow state:', error);
    }
  }, []);

  const contextValue = {
    state,
    actions,
    // Computed values
    computed: {
      isFormComplete: () => {
        if (!state.documentConfig?.sections) return false;
        return state.documentConfig.sections.every(section =>
          section.fields.every(field => {
            if (!field.required) return true;
            const value = state.formData[field.id];
            return value !== undefined && value !== null && value !== '';
          })
        );
      },
      
      getCurrentSection: () => {
        return state.documentConfig?.sections?.[state.currentFormSection] || null;
      },
      
      getFormProgress: () => {
        if (!state.documentConfig?.sections) return 0;
        const totalFields = state.documentConfig.sections.reduce((acc, section) => 
          acc + section.fields.length, 0);
        const completedFields = Object.values(state.formData).filter(value => 
          value !== undefined && value !== null && value !== '').length;
        return totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
      },
      
      canProceedToNext: () => {
        const currentSection = state.documentConfig?.sections?.[state.currentFormSection];
        if (!currentSection) return false;
        
        return currentSection.fields.every(field => {
          if (!field.required) return true;
          const value = state.formData[field.id];
          return value !== undefined && value !== null && value !== '';
        });
      }
    }
  };

  return (
    <WorkflowContext.Provider value={contextValue}>
      {children}
    </WorkflowContext.Provider>
  );
};

export default WorkflowContext;
