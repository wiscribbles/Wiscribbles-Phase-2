import { NextResponse } from 'next/server';
import { db } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

// Generate meeting ID for notary session
const generateMeetingId = () => {
  const timestamp = Date.now().toString();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `NOTARY-${timestamp}-${randomSuffix}`;
};

export async function POST(request) {
  try {
    const formData = await request.json();
    console.log('Received notary form data:', formData);

    // Generate unique identifiers
    const referenceNumber = `NOT-${uuidv4().substring(0, 8).toUpperCase()}`;
    const meetingId = generateMeetingId();

    // Validate required fields for notary workflow
    const requiredFields = {
      step1: ['firstName', 'lastName', 'email'],
      step2: ['documentType'],
      step3: ['signingOption']
    };

    // Check if all required steps exist
    const missingSteps = [];
    Object.keys(requiredFields).forEach(step => {
      if (!formData[step]) {
        missingSteps.push(step);
      } else {
        const missingFields = requiredFields[step].filter(field => !formData[step][field]);
        if (missingFields.length > 0) {
          missingSteps.push(`${step}(${missingFields.join(', ')})`);
        }
      }
    });

    if (missingSteps.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Missing required data: ${missingSteps.join(', ')}`
      }, { status: 400 });
    }

    // Extract user information for meeting setup
    const userName = `${formData.step1.firstName} ${formData.step1.lastName}`.trim();
    const userEmail = formData.step1.email;

    // Prepare comprehensive submission data for notary workflow
    const submissionData = {
      // Basic identification
      referenceNumber,
      meetingId,
      type: 'notary', // Distinguish from e-sign submissions
      
      // Form steps data
      step1: {
        ...formData.step1,
        submissionType: 'notary' // Mark as notary submission
      },
      step2: {
        ...formData.step2,
        requiresNotarization: true
      },
      step3: {
        ...formData.step3,
        signingOption: 'notary', // Force notary option
        meetingId, // Include meeting ID in step3
        documentStatus: 'pending_notarization'
      },
      step4: formData.step4 || {}, // Payment data (may be collected after meeting)
      
      // Meeting and scheduling configuration
      meeting: {
        id: meetingId,
        status: 'scheduled',
        scheduledDateTime: formData.scheduledDateTime || new Date().toISOString(),
        participantIds: [], // Will be populated when users join
        notaryId: null, // Will be assigned when notary accepts the session
        clientId: null, // Will be populated when client joins video call
        clientInfo: {
          name: userName,
          email: userEmail,
          id: null // Will be set when user logs in
        },
        videoCallConfig: {
          provider: 'zegocloud', // Using existing ZegoCloud integration
          roomId: meetingId,
          maxParticipants: 2,
          recordSession: true, // For notary compliance
          allowScreenShare: true
        },
        startedAt: null,
        endedAt: null,
        duration: null,
        timezone: formData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      
      // Document handling for notary workflow
      document: {
        originalUrl: formData.step2?.documentUrl || formData.documentUrl || null,
        type: formData.step2?.documentType || 'document',
        name: formData.step2?.documentName || 'Document',
        status: 'pending_notarization',
        notarizedUrl: null, // Will be populated after notarization
        requiresWitness: formData.step2?.requiresWitness || false,
        
        // Form fields that need to be completed during video call
        formFields: formData.documentFormFields || {},
        signatures: {}, // Will store signature data during video call
        completedFields: {}, // Will track form completion during call
        
        // Document compliance
        notaryRequirements: {
          identityVerification: true,
          witnessRequired: formData.step2?.requiresWitness || false,
          oathRequired: formData.step2?.requiresOath || false,
          journalEntry: true
        }
      },
      
      // Workflow status tracking
      status: 'pending', // pending -> assigned -> in_progress -> completed -> notarized
      workflowStage: 'awaiting_notary', // awaiting_notary -> assigned -> in_meeting -> document_review -> completed
      
      // Priority and urgency
      priority: formData.priority || 'normal', // normal, high, urgent
      estimatedDuration: formData.estimatedDuration || 30, // minutes
      
      // Timestamps
      submittedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      
      // Notary assignment and management
      notaryAssignment: {
        assignedNotaryId: null,
        assignedAt: null,
        acceptedAt: null,
        estimatedDuration: formData.estimatedDuration || 30, // minutes
        specialRequirements: formData.specialRequirements || null,
        languagePreference: formData.step1?.preferredLanguage || 'en',
        jurisdictionRequirement: formData.step1?.jurisdictionOfDocumentUse || null
      },
      
      // Client preferences and requirements
      clientPreferences: {
        preferredDateTime: formData.preferredDateTime || null,
        timeZone: formData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        communicationMethod: 'video_call',
        specialInstructions: formData.specialInstructions || null,
        accessibilityRequirements: formData.accessibilityRequirements || null
      },
      
      // Compliance and legal
      compliance: {
        identityDocumentRequired: true,
        identityDocumentProvided: false,
        witnessRequired: formData.step2?.requiresWitness || false,
        witnessProvided: false,
        jurisdictionCompliance: formData.step1?.jurisdictionOfDocumentUse || null,
        legalRequirements: []
      },
      
      // System metadata
      metadata: {
        userAgent: formData.userAgent || null,
        ipAddress: formData.ipAddress || null,
        timezone: formData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: formData.locale || 'en-US',
        submissionSource: 'web_form',
        deviceType: formData.deviceType || 'desktop',
        browserInfo: formData.browserInfo || null
      }
    };

    console.log('Prepared notary submission data:', submissionData);

    // Submit to Firebase Firestore
    const docRef = await addDoc(collection(db, 'formSubmissions'), submissionData);
    
    // Prepare response data
    const responseData = {
      success: true,
      data: {
        id: docRef.id,
        referenceNumber,
        meetingId,
        meetingUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/video-call?meetingId=${meetingId}`,
        status: 'pending',
        workflowStage: 'awaiting_notary',
        submittedAt: submissionData.submittedAt,
        estimatedWaitTime: '15-30 minutes', // Based on current notary availability
        nextSteps: [
          'Your notary session request has been submitted',
          'You will be notified when a notary accepts your session',
          'Please have your identification document ready',
          'Join the video call when notified'
        ]
      },
      message: 'Notary session request submitted successfully'
    };

    console.log('Notary submission successful:', responseData);
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Notary form submission error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: 'Failed to submit notary session request. Please try again.'
      },
      { status: 500 }
    );
  }
}

// GET method to retrieve notary session by meeting ID
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get('meetingId');

    if (!meetingId) {
      return NextResponse.json({
        success: false,
        error: 'Meeting ID is required'
      }, { status: 400 });
    }

    // Query Firestore for the session
    const { query, where, getDocs, collection } = await import('firebase/firestore');
    
    const q = query(
      collection(db, 'formSubmissions'),
      where('meetingId', '==', meetingId),
      where('type', '==', 'notary')
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return NextResponse.json({
        success: false,
        error: 'Notary session not found'
      }, { status: 404 });
    }

    const doc = querySnapshot.docs[0];
    const sessionData = {
      id: doc.id,
      ...doc.data()
    };

    return NextResponse.json({
      success: true,
      data: sessionData
    });

  } catch (error) {
    console.error('Error retrieving notary session:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
