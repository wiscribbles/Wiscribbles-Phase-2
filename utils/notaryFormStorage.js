// Enhanced utility functions for Connect to Notary flow
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';

const NOTARY_FORM_DATA_KEY = 'notary_form_data';

// Save notary form data to localStorage (temporary storage during form filling)
export const saveNotaryFormData = (step, data) => {
  try {
    const existingData = getNotaryFormData();
    const updatedData = {
      ...existingData,
      [`step${step}`]: data,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(NOTARY_FORM_DATA_KEY, JSON.stringify(updatedData));
    console.log(`Notary form step ${step} data saved locally:`, data);
    return true;
  } catch (error) {
    console.error('Error saving notary form data:', error);
    return false;
  }
};

// Get notary form data from localStorage
export const getNotaryFormData = () => {
  try {
    const data = localStorage.getItem(NOTARY_FORM_DATA_KEY);
    if (!data) return {};
    
    const parsedData = JSON.parse(data);
    if (typeof parsedData !== 'object' || parsedData === null) {
      console.warn('Invalid notary form data structure, resetting...');
      clearNotaryFormData();
      return {};
    }
    
    return parsedData;
  } catch (error) {
    console.error('Error getting notary form data:', error);
    clearNotaryFormData();
    return {};
  }
};

// Clear notary form data from localStorage
export const clearNotaryFormData = () => {
  try {
    localStorage.removeItem(NOTARY_FORM_DATA_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing notary form data:', error);
    return false;
  }
};

// Validate meeting ID for ZegoCloud compatibility
export const validateMeetingId = (meetingId) => {
  // ZegoCloud room ID requirements:
  // - 1-64 characters
  // - Only alphanumeric, hyphens (-), underscores (_)
  // - Cannot be empty
  const zegoRoomIdRegex = /^[a-zA-Z0-9_-]{1,64}$/;
  return zegoRoomIdRegex.test(meetingId);
};

// Generate meeting ID for notary session (ZegoCloud compatible)
export const generateMeetingId = () => {
  // Use shorter timestamp (last 10 digits) + random suffix
  const shortTimestamp = Date.now().toString().slice(-10);
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  // Keep it short and simple for ZegoCloud compatibility
  const meetingId = `N${shortTimestamp}${randomSuffix}`;
  
  // Validate the generated ID
  if (!validateMeetingId(meetingId)) {
    console.error('Generated meeting ID is not ZegoCloud compatible:', meetingId);
    // Fallback to a simpler format
    return `N${Date.now().toString().slice(-8)}`;
  }
  
  console.log('Generated ZegoCloud-compatible meeting ID:', meetingId);
  return meetingId;
};

// Submit notary form data to Firebase with meeting scheduling
export const submitNotaryFormData = async (formData, scheduledDateTime = null) => {
  try {
    console.log('Submitting notary form data:', formData);

    // Generate unique identifiers
    const referenceNumber = `NOT-${uuidv4().substring(0, 8).toUpperCase()}`;
    const meetingId = generateMeetingId();

    // Validate required fields
    const requiredFields = ['step1', 'step2', 'step3'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Prepare submission data with enhanced structure for notary workflow
    const submissionData = {
      // Basic identification
      referenceNumber,
      meetingId,
      type: 'notary', // Distinguish from e-sign submissions
      
      // Form steps data
      step1: formData.step1,
      step2: formData.step2,
      step3: {
        ...formData.step3,
        signingOption: 'notary', // Force notary option
        meetingId, // Include meeting ID in step3
      },
      step4: formData.step4 || {}, // Payment data (if applicable)
      
      // Meeting and scheduling
      meeting: {
        id: meetingId,
        status: 'scheduled',
        scheduledDateTime: scheduledDateTime || new Date().toISOString(),
        participantIds: [], // Will be populated when users join
        notaryId: null, // Will be assigned when notary joins
        clientId: null, // Will be populated when client joins
        startedAt: null,
        endedAt: null,
        duration: null
      },
      
      // Document handling for notary flow
      document: {
        originalUrl: formData.step2?.documentUrl || formData.documentUrl,
        type: formData.step2?.documentType || 'document',
        status: 'pending_notarization',
        notarizedUrl: null, // Will be populated after notarization
        signatures: {}, // Will store signature data during video call
        completedFields: {} // Will track form completion during call
      },
      
      // Workflow status
      status: 'pending', // pending -> in_progress -> completed -> notarized
      workflowStage: 'awaiting_notary', // awaiting_notary -> in_meeting -> document_review -> completed
      
      // Timestamps
      submittedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      
      // Notary-specific fields
      notaryAssignment: {
        assignedNotaryId: null,
        assignedAt: null,
        acceptedAt: null,
        estimatedDuration: 30 // minutes
      },
      
      // Metadata
      metadata: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: 'en-US',
        submissionSource: 'web_form'
      }
    };

    console.log('Prepared submission data:', submissionData);

    // Submit to Firebase
    const docRef = await addDoc(collection(db, 'formSubmissions'), submissionData);
    
    const result = {
      success: true,
      data: {
        id: docRef.id,
        referenceNumber,
        meetingId,
        ...submissionData
      }
    };

    console.log('Notary form submission successful:', result);
    
    // Clear local storage after successful submission
    clearNotaryFormData();
    
    return result;

  } catch (error) {
    console.error('Error submitting notary form data:', error);
    throw error;
  }
};

// Retrieve notary session data by meeting ID (for video call)
export const getNotarySessionData = async (meetingId) => {
  try {
    console.log('Retrieving notary session data for meeting ID:', meetingId);

    const q = query(
      collection(db, 'formSubmissions'),
      where('meetingId', '==', meetingId),
      where('type', '==', 'notary')
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('No notary session found for this meeting ID');
    }

    const doc = querySnapshot.docs[0];
    const sessionData = {
      id: doc.id,
      ...doc.data()
    };

    console.log('Retrieved notary session data:', sessionData);
    return sessionData;

  } catch (error) {
    console.error('Error retrieving notary session data:', error);
    throw error;
  }
};

// Update notary session during video call
export const updateNotarySession = async (sessionId, updates) => {
  try {
    console.log('Updating notary session:', sessionId, updates);

    const sessionRef = doc(db, 'formSubmissions', sessionId);
    
    const updateData = {
      ...updates,
      lastUpdatedAt: new Date().toISOString()
    };

    await updateDoc(sessionRef, updateData);
    
    console.log('Notary session updated successfully');
    return { success: true };

  } catch (error) {
    console.error('Error updating notary session:', error);
    throw error;
  }
};

// Mark notary session as started
export const startNotarySession = async (meetingId, participantData) => {
  try {
    const sessionData = await getNotarySessionData(meetingId);
    
    const updates = {
      'meeting.status': 'in_progress',
      'meeting.startedAt': new Date().toISOString(),
      'workflowStage': 'in_meeting',
      status: 'in_progress',
      [`meeting.${participantData.role}Id`]: participantData.userId
    };

    await updateNotarySession(sessionData.id, updates);
    
    return { success: true, sessionId: sessionData.id };
  } catch (error) {
    console.error('Error starting notary session:', error);
    throw error;
  }
};

// Complete notary session with final document
export const completeNotarySession = async (meetingId, completionData) => {
  try {
    const sessionData = await getNotarySessionData(meetingId);
    
    const updates = {
      'meeting.status': 'completed',
      'meeting.endedAt': new Date().toISOString(),
      'document.status': 'notarized',
      'document.notarizedUrl': completionData.notarizedDocumentUrl,
      'document.signatures': completionData.signatures || {},
      workflowStage: 'completed',
      status: 'completed',
      completedAt: new Date().toISOString()
    };

    await updateNotarySession(sessionData.id, updates);
    
    return { success: true, sessionId: sessionData.id };
  } catch (error) {
    console.error('Error completing notary session:', error);
    throw error;
  }
};

// Get available notary sessions for notary dashboard
export const getAvailableNotarySessions = async (notaryId = null) => {
  try {
    let q;
    
    if (notaryId) {
      // Get sessions assigned to specific notary
      q = query(
        collection(db, 'formSubmissions'),
        where('type', '==', 'notary'),
        where('notaryAssignment.assignedNotaryId', '==', notaryId)
      );
    } else {
      // Get unassigned sessions
      q = query(
        collection(db, 'formSubmissions'),
        where('type', '==', 'notary'),
        where('status', '==', 'pending')
      );
    }

    const querySnapshot = await getDocs(q);
    const sessions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('Retrieved available notary sessions:', sessions.length);
    return sessions;

  } catch (error) {
    console.error('Error getting available notary sessions:', error);
    throw error;
  }
};

export default {
  saveNotaryFormData,
  getNotaryFormData,
  clearNotaryFormData,
  generateMeetingId,
  submitNotaryFormData,
  getNotarySessionData,
  updateNotarySession,
  startNotarySession,
  completeNotarySession,
  getAvailableNotarySessions
};
