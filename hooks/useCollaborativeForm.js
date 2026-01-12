'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useWorkflow } from '../contexts/WorkflowContext';
import { getRealtimeSync } from '../services/RealtimeSync';

/**
 * useCollaborativeForm - Hook for collaborative form editing
 * Integrates WorkflowContext with RealtimeSync service
 */
export const useCollaborativeForm = (options = {}) => {
  const { state, actions } = useWorkflow();
  const realtimeSync = useRef(null);
  const isInitialized = useRef(false);
  const lastSyncRef = useRef({});

  const {
    enableSync = true,
    syncDelay = 500, // Debounce sync calls
    maxRetries = 3,
    sessionId = null
  } = options;

  // Initialize real-time sync when needed
  const initializeSync = useCallback(async () => {
    if (!enableSync || isInitialized.current || !state.isCollaborative) {
      return;
    }

    try {
      // Get session ID from state or props
      const currentSessionId = sessionId || state.sessionId || generateSessionId();
      
      // Initialize realtime sync service
      realtimeSync.current = getRealtimeSync({
        syncInterval: 1000,
        maxRetries,
        useWebSocket: true // Enable WebSocket by default
      });

      // Set up event listeners
      setupSyncEventListeners();

      // Connect to sync service
      await realtimeSync.current.connect(
        currentSessionId,
        state.userId || generateUserId(),
        state.userRole
      );

      isInitialized.current = true;
      console.log('Collaborative form sync initialized');

    } catch (error) {
      console.error('Failed to initialize collaborative sync:', error);
      actions.addNotification('error', 'Failed to enable collaborative editing');
    }
  }, [state.isCollaborative, state.sessionId, state.userId, state.userRole, enableSync, sessionId, maxRetries]);

  // Set up event listeners for real-time sync
  const setupSyncEventListeners = useCallback(() => {
    if (!realtimeSync.current) return;

    // Handle incoming form updates
    realtimeSync.current.on('formUpdate', (data) => {
      console.log('Received form update:', data);
      
      // Avoid updating our own changes
      if (data.userId === state.userId) return;

      // Update form data without triggering another sync
      if (data.fieldId) {
        // Single field update
        actions.updateFormField(data.fieldId, data.formData[data.fieldId]);
      } else {
        // Bulk form data update
        actions.syncFormData(data.formData, data.timestamp);
      }

      // Show notification about remote changes
      const userRole = data.userRole === 'notary' ? 'Notary' : 'User';
      actions.addNotification(
        'info',
        `${userRole} updated the form`,
        3000
      );
    });

    // Handle incoming signature updates
    realtimeSync.current.on('signatureUpdate', (data) => {
      console.log('Received signature update:', data);
      
      if (data.userId === state.userId) return;

      actions.addSignature(data.fieldId, data.signature, data.signedBy);
      
      const userRole = data.userRole === 'notary' ? 'Notary' : 'User';
      actions.addNotification(
        'success',
        `${userRole} added a signature`,
        3000
      );
    });

    // Handle workflow status updates
    realtimeSync.current.on('workflowStatusUpdate', (data) => {
      console.log('Received workflow status update:', data);
      
      if (data.userId === state.userId) return;

      if (data.step) {
        actions.setWorkflowStep(data.step);
      }
      
      if (data.status) {
        actions.setDocumentStatus(data.status);
      }

      const userRole = data.userRole === 'notary' ? 'Notary' : 'User';
      actions.addNotification(
        'info',
        `${userRole} updated the workflow status`,
        3000
      );
    });

    // Handle user join/leave events
    realtimeSync.current.on('userJoined', (data) => {
      console.log('User joined:', data);
      actions.addCollaborator({
        id: data.userId,
        role: data.userRole,
        joinedAt: data.timestamp
      });

      const userRole = data.userRole === 'notary' ? 'Notary' : 'User';
      actions.addNotification(
        'success',
        `${userRole} joined the session`,
        3000
      );
    });

    realtimeSync.current.on('userLeft', (data) => {
      console.log('User left:', data);
      actions.removeCollaborator(data.userId);

      const userRole = data.userRole === 'notary' ? 'Notary' : 'User';
      actions.addNotification(
        'warning',
        `${userRole} left the session`,
        3000
      );
    });

    // Handle connection events
    realtimeSync.current.on('connected', () => {
      actions.addNotification(
        'success',
        'Collaborative editing enabled',
        3000
      );
    });

    realtimeSync.current.on('disconnected', () => {
      actions.addNotification(
        'warning',
        'Collaborative editing disconnected',
        5000
      );
    });

    realtimeSync.current.on('maxRetriesReached', () => {
      actions.addNotification(
        'error',
        'Failed to maintain collaborative connection',
        0 // Don't auto-dismiss
      );
    });

  }, [state.userId, actions]);

  // Debounced sync function
  const debouncedSync = useCallback((fieldId, value) => {
    if (!realtimeSync.current || !state.isCollaborative) return;

    // Clear existing timeout for this field
    if (lastSyncRef.current[fieldId]) {
      clearTimeout(lastSyncRef.current[fieldId]);
    }

    // Set new timeout
    lastSyncRef.current[fieldId] = setTimeout(() => {
      if (fieldId) {
        // Single field sync
        const fieldData = { [fieldId]: value };
        realtimeSync.current.syncFormData(fieldData, fieldId);
      } else {
        // Bulk sync
        realtimeSync.current.syncFormData(state.formData);
      }
      
      delete lastSyncRef.current[fieldId];
    }, syncDelay);

  }, [state.formData, state.isCollaborative, syncDelay]);

  // Sync form field changes
  const syncFormField = useCallback((fieldId, value) => {
    if (!enableSync || !state.isCollaborative) return;
    debouncedSync(fieldId, value);
  }, [enableSync, state.isCollaborative, debouncedSync]);

  // Sync signature changes
  const syncSignature = useCallback(async (fieldId, signature, signedBy) => {
    if (!enableSync || !state.isCollaborative || !realtimeSync.current) return;

    try {
      await realtimeSync.current.syncSignature(fieldId, signature, signedBy);
    } catch (error) {
      console.error('Failed to sync signature:', error);
    }
  }, [enableSync, state.isCollaborative]);

  // Sync workflow status changes
  const syncWorkflowStatus = useCallback(async (status, step) => {
    if (!enableSync || !state.isCollaborative || !realtimeSync.current) return;

    try {
      await realtimeSync.current.syncWorkflowStatus(status, step);
    } catch (error) {
      console.error('Failed to sync workflow status:', error);
    }
  }, [enableSync, state.isCollaborative]);

  // Force sync all form data
  const forceSyncFormData = useCallback(async () => {
    if (!realtimeSync.current || !state.isCollaborative) return;

    try {
      await realtimeSync.current.syncFormData(state.formData);
    } catch (error) {
      console.error('Failed to force sync form data:', error);
    }
  }, [state.formData, state.isCollaborative]);

  // Get sync status
  const getSyncStatus = useCallback(() => {
    if (!realtimeSync.current) {
      return {
        isConnected: false,
        isCollaborative: state.isCollaborative,
        sessionId: null,
        collaborators: state.collaborators
      };
    }

    return {
      ...realtimeSync.current.getStatus(),
      isCollaborative: state.isCollaborative,
      collaborators: state.collaborators
    };
  }, [state.isCollaborative, state.collaborators]);

  // Initialize sync when collaborative mode is enabled
  useEffect(() => {
    if (state.isCollaborative && enableSync && !isInitialized.current) {
      initializeSync();
    }
  }, [state.isCollaborative, enableSync, initializeSync]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (realtimeSync.current) {
        realtimeSync.current.disconnect();
        realtimeSync.current = null;
        isInitialized.current = false;
      }
      
      // Clear any pending timeouts
      Object.values(lastSyncRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      lastSyncRef.current = {};
    };
  }, []);

  // Listen for form data changes and sync them
  useEffect(() => {
    if (!state.isCollaborative || !enableSync) return;

    // Only sync if we have real changes (not from incoming updates)
    const now = Date.now();
    if (state.lastSyncTime && now - state.lastSyncTime < 100) {
      // This update is likely from an incoming sync, don't re-sync
      return;
    }

    // Debounce bulk sync of form data
    debouncedSync(null, null);
  }, [state.formData, state.isCollaborative, enableSync, debouncedSync, state.lastSyncTime]);

  return {
    // Sync functions
    syncFormField,
    syncSignature,
    syncWorkflowStatus,
    forceSyncFormData,
    
    // Status functions
    getSyncStatus,
    isCollaborative: state.isCollaborative,
    isConnected: realtimeSync.current?.isConnected || false,
    
    // Collaborator info
    collaborators: state.collaborators,
    
    // Service instance (for advanced usage)
    realtimeSync: realtimeSync.current
  };
};

// Helper functions
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateUserId() {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default useCollaborativeForm;
