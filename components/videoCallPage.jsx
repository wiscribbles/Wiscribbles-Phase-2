'use client';

import { authFetch } from '@/utils/authFetch';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { getUserData } from '@/firebase';
import { useWorkflow, USER_ROLES } from '../contexts/WorkflowContext';
import { useCollaborativeForm } from '../hooks/useCollaborativeForm';
import DynamicFormRenderer from './DynamicFormRenderer/DynamicFormRenderer';
import SimplePDFViewer from './SimplePDFViewer';
import DocumentFormReadOnly from './DocumentFormReadOnly';
import FormDataPreview from './FormDataPreview';
import NotaryVerificationPanel from './NotaryVerificationPanel';
import NotaryAcknowledgmentModal from './NotaryAcknowledgmentModal';
import InteractivePDFSigner from './InteractivePDFSigner';
import SafeVideoCall from './SafeVideoCall';
import { getDocumentConfig } from '../config/documentTypes';
import { getNotarySessionData, updateNotarySession, startNotarySession } from '@/utils/notaryFormStorage';
import { getFormData, getSubmissionId } from '@/utils/formStorage';
import { getOrGenerateDocumentUrl, requiresPDFGeneration } from '@/utils/pdfGenerator';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { toast } from 'react-hot-toast';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// CSS to prevent ZegoCloud from taking over the entire page and center controls
if (typeof window !== 'undefined') {
  const styleId = 'video-call-custom-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Force ZegoCloud to stay within container */
      #video-call-container {
        position: relative !important;
        width: 100% !important;
        height: 100% !important;
        overflow: hidden !important;
      }
      
      /* Override ZegoCloud's fullscreen styles */
      .zego-model-parent,
      .zego-video-container,
      [class*="ZegoRoom"],
      [class*="ZegoVideo"],
      [class*="zego"] {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        max-width: 100% !important;
        max-height: 100% !important;
        z-index: 1 !important;
      }
      
      /* Center align ZegoCloud control buttons */
      [class*="CallBottom"],
      [class*="callBottom"],
      [class*="control-bar"],
      [class*="controlBar"],
      [class*="BottomBar"],
      [class*="bottomBar"] {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        padding: 10px !important;
        width: 100% !important;
      }
      
      /* Center the button groups inside control bar */
      [class*="CallBottom"] > div,
      [class*="callBottom"] > div,
      [class*="control"] > div,
      [class*="BottomBar"] > div {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        gap: 10px !important;
        margin: 0 auto !important;
        width: auto !important;
      }
      
      /* Ensure buttons are evenly spaced */
      [class*="CallBottom"] button,
      [class*="callBottom"] button,
      [class*="control"] button,
      [class*="BottomBar"] button {
        margin: 0 5px !important;
      }
      
      /* Fix ZegoCloud bottom controls positioning */
      .zegoCallBottom___2AMqD,
      [class*="zegoCallBottom"] {
        position: absolute !important;
        bottom: 20px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        display: flex !important;
        justify-content: center !important;
        width: auto !important;
        max-width: 90% !important;
      }
      
      /* Prevent body overflow */
      body.video-call-active {
        overflow: hidden !important;
      }
      
      /* Ensure our layout stays intact */
      .document-viewer-container {
        display: flex !important;
        height: calc(100vh - 200px) !important;
      }
      
      .document-viewer-container .row {
        width: 100% !important;
        margin: 0 !important;
      }
    `;
    document.head.appendChild(style);
  }
}

const VideoCallPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const meetingId = searchParams.get('meetingId');
  const documentType = searchParams.get('documentType');
  const [isLoading, setIsLoading] = useState(true);
  const [hasJoinedCall, setHasJoinedCall] = useState(false);
  const [showFormPanel, setShowFormPanel] = useState(false);
  const [leftPanelView, setLeftPanelView] = useState('document'); // 'form' or 'document'
  const [isReadyToSign, setIsReadyToSign] = useState(false);
  // Temporary flag to hide bottom action bar
  const [showBottomBar] = useState(false);
  const user = useAuthStore((s) => s.user);
  const [role, setRole] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Notary session state
  const [sessionData, setSessionData] = useState(null);
  const [isNotarySession, setIsNotarySession] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  
  // Document data state (similar to ESignDocument)
  const [formData, setFormData] = useState(null);
  const [submissionData, setSubmissionData] = useState(null);
  const [error, setError] = useState(null);
  
  // Notary signature and seal state
  const [isNotarizing, setIsNotarizing] = useState(false);
  const [documentNotarized, setDocumentNotarized] = useState(false);
  const [notarizedDocumentUrl, setNotarizedDocumentUrl] = useState(null);
  const [isClientSigning, setIsClientSigning] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [showNotarizedVersion, setShowNotarizedVersion] = useState(false);
  // Client signing state (optional visual confirmation)
  const [clientSigned, setClientSigned] = useState(false);
  const [clientSignedDocumentUrl, setClientSignedDocumentUrl] = useState(null);
  
  // Notary acknowledgment modal state
  const [showAcknowledgmentModal, setShowAcknowledgmentModal] = useState(false);
  const [acknowledgmentData, setAcknowledgmentData] = useState(null);
  
  // Interactive signature state
  const [notarySignatures, setNotarySignatures] = useState([]);
  const [showInteractiveSigner, setShowInteractiveSigner] = useState(false);
  
  // Debug: Monitor notarySignatures state changes
  useEffect(() => {
    console.log('notarySignatures state changed to:', notarySignatures);
  }, [notarySignatures]);
  
  // Workflow context
  const { state, actions, computed } = useWorkflow();
  
  // Collaborative form hook - can be enabled if real-time sync is needed
  // Currently disabled to prevent WebSocket connection errors
  // Set enableSync: true to enable real-time document collaboration
  const {
    syncFormField,
    syncSignature,
    isCollaborative,
    isConnected,
    collaborators
  } = useCollaborativeForm({
    sessionId: meetingId,
    enableSync: false // Set to true if you want real-time sync between participants
  });

  // Authentication check effect
  useEffect(() => {
    const checkAuth = async () => {
      // Check if user is accessing from member/notary dashboard
      if (from === 'member' || from === 'notary') {
        if (!user) {
          // Notary must be signed in when accessing from dashboard
          toast.error('Please sign in as a notary to access this meeting');
          // Store the video call URL to redirect back after login
          const returnUrl = `/video-call?meetingId=${meetingId}&from=${from}`;
          sessionStorage.setItem('returnUrl', returnUrl);
          router.push('/signIn');
          return;
        }
        
        // Check if user is actually a notary (you might want to check user role from Firebase)
        // For now, we'll assume if they're coming from member dashboard, they're a notary
        setRole('Notary');
        console.log('User authenticated as Notary:', user.email);
      } else {
        // No 'from' parameter or other values mean this is a regular user/client
        // They don't need authentication to join
        setRole('Client');
        console.log('User joining as Client');
      }
      setAuthChecked(true);
    };
    
    checkAuth();
  }, [from, user, meetingId, router]);

  useEffect(() => {
    // Role is now set in the auth check effect based on 'from' parameter
    // This effect only updates the workflow context ONCE when role is determined
    if (role && meetingId) {
      const workflowRole = role === 'Notary' ? USER_ROLES.NOTARY : USER_ROLES.CLIENT;
      const userId = user?.uid || 'guest-user';
      actions.setUserRole(workflowRole, userId, meetingId);
      actions.setServiceType('notary');
    }
  }, [role, meetingId]); // Remove 'actions' and 'user' from dependencies to prevent loops

  // Monitor notarization status for clients in real-time
  useEffect(() => {
    // Only set up listener if client role and session data is loaded
    if (role !== 'Client' || !meetingId || !sessionData?.id) {
      return;
    }
    
    console.log('Setting up real-time listener for client, session ID:', sessionData.id);
    // Set up real-time listener for notarization status
    // Use formSubmissions collection and document ID from sessionData
    const sessionRef = doc(db, 'formSubmissions', sessionData.id);
      
      const unsubscribe = onSnapshot(sessionRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          console.log('Real-time update received:', data.status, data.document?.status);
          
          // Check if document has been notarized (check multiple possible status fields)
          if (data.status === 'notarized' || data.status === 'completed' || data.document?.status === 'notarized') {
            console.log('Document notarized! Triggering client update...');
            console.log('Notarized document URL:', data.notarizedDocURL || data.document?.notarizedUrl);
            
            // Show success message
            toast.success('🎉 Your document has been notarized successfully!', {
              duration: 5000,
              icon: '✅',
            });
            
            // Set notarized state
            setDocumentNotarized(true);
            
            // Store notarized document URL if available (check both possible locations)
            const notarizedUrl = data.notarizedDocURL || data.document?.notarizedUrl;
            if (notarizedUrl) {
              setNotarizedDocumentUrl(notarizedUrl);
              console.log('Stored notarized URL for client:', notarizedUrl);
              
              // Also update submission data for immediate availability
              setSubmissionData(prevData => ({
                ...prevData,
                notarizedDocURL: notarizedUrl,
                status: 'notarized'
              }));
            }
            
            // Wait a moment for user to see the message, then redirect
            setTimeout(() => {
              toast.success('Redirecting to download your notarized document...', {
                duration: 2000,
              });
              setTimeout(() => {
                router.push('/form-step5');
              }, 2000);
            }, 3000);
          }
        }
      }, (error) => {
        console.error('Error monitoring notarization status:', error);
      });
      
      // Cleanup listener on unmount
      return () => unsubscribe();
  }, [role, meetingId, sessionData?.id, router]);

  // Load notary session data if available
  useEffect(() => {
    const loadNotarySession = async () => {
      if (!meetingId || sessionLoading) return;
      
      setSessionLoading(true);
      try {
        // Check if this is a notary session - the function returns data directly, not wrapped in success/data
        const sessionResult = await getNotarySessionData(meetingId);
        
        if (sessionResult) {
          setSessionData(sessionResult);
          setIsNotarySession(true);
          
          // Extract document type from step2 data or document object
          const docType = sessionResult.step2?.documentType || sessionResult.document?.type || 'document';
          if (docType && !state.selectedDocumentType) {
            const config = getDocumentConfig(docType);
            if (config) {
              actions.setDocumentType(docType, config);
            }
          }
          
          // Load form data from session - the structure is step1, step2, step3 directly
          const documentFormFields = sessionResult.document?.formFields || {};
          
          console.log('Loading notary session data:');
          console.log('Document type:', docType);
          console.log('Document form fields available:', Object.keys(documentFormFields));
          console.log('Document form fields data:', documentFormFields);
          
          const formDataToLoad = {
            step1: sessionResult.step1 || {},
            step2: sessionResult.step2 || {},
            step3: sessionResult.step3 || {},
            // Also include document form fields for the notary to generate the PDF
            // Structure it properly for PDF generation - documentForms should contain the document type as key
            documentForms: {
              [docType]: documentFormFields
            }
          };
          
          console.log('Final form data structure for notary:', formDataToLoad);
          setFormData(formDataToLoad);
          
          // Check if verification was already completed
          if (sessionResult.verificationComplete) {
            setVerificationComplete(true);
          }
          
          // Merge all form data from steps and update workflow state
          const allFormData = {
            ...sessionResult.step1 || {},
            ...sessionResult.step2 || {},
            ...sessionResult.step3 || {}
          };
          
          // Update workflow state with form data
          Object.entries(allFormData).forEach(([fieldId, value]) => {
            if (fieldId && value !== undefined && value !== null) {
              actions.updateFormField(fieldId, value);
            }
          });
          
          // Load any existing signatures from document.signatures
          if (sessionResult.document?.signatures) {
            Object.entries(sessionResult.document.signatures).forEach(([fieldId, signature]) => {
              if (signature && signature.data) {
                actions.addSignature(fieldId, signature.data, signature.signedBy);
              }
            });
          }
          
          toast.success('Notary session loaded successfully');
        } else {
          // Not a notary session, check for regular document type
          if (documentType && !state.selectedDocumentType) {
            const config = getDocumentConfig(documentType);
            if (config) {
              actions.setDocumentType(documentType, config);
            }
          }
        }
      } catch (error) {
        console.error('Error loading notary session:', error);
        
        // Fallback to regular document type if available
        if (documentType && !state.selectedDocumentType) {
          const config = getDocumentConfig(documentType);
          if (config) {
            actions.setDocumentType(documentType, config);
          }
        }
      } finally {
        setSessionLoading(false);
      }
    };
    
    // Add timeout fallback to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (sessionLoading) {
        setSessionLoading(false);
      }
    }, 5000); // 5 second timeout
    
    loadNotarySession();
    
    return () => clearTimeout(timeoutId);
  }, [meetingId]); // Remove dependencies that cause infinite loop

  // Initialize document configuration if not already set (for non-notary sessions)
  useEffect(() => {
    if (!isNotarySession && documentType && !state.selectedDocumentType && !sessionLoading) {
      const config = getDocumentConfig(documentType);
      if (config) {
        actions.setDocumentType(documentType, config);
      }
    }
  }, [documentType, state.selectedDocumentType, actions, isNotarySession, sessionLoading]);

  // Load form data and submission data for document preview
  useEffect(() => {
    const loadDocumentData = async () => {
      try {
        const savedFormData = getFormData();
        setFormData(savedFormData);

        // Get submission ID and fetch from Firebase if available
        const submissionId = getSubmissionId();
        if (submissionId) {
          const submissionRef = doc(db, 'formSubmissions', submissionId);
          const submissionDoc = await getDoc(submissionRef);
          
          if (submissionDoc.exists()) {
            setSubmissionData({ id: submissionId, ...submissionDoc.data() });
          }
        }
      } catch (error) {
        console.error('Error loading document data:', error);
        // Not critical for video call, so don't set error state
      }
    };

    loadDocumentData();
  }, []);

  // Handle form field changes with collaborative sync
  const handleFormFieldChange = async (fieldId, value) => {
    actions.updateFormField(fieldId, value);
    
    // Update session data if this is a notary session
    if (isNotarySession && sessionData && sessionData.id) {
      try {
        // Update the specific field in the form data structure
        const updatedData = {
          [`document.completedFields.${fieldId}`]: value,
          lastModified: new Date().toISOString(),
          lastModifiedBy: user?.uid || 'anonymous'
        };
        
        await updateNotarySession(sessionData.id, updatedData);
      } catch (error) {
        console.error('Error updating session data:', error);
      }
    }
    
    // Sync with other participants if collaborative
    if (isCollaborative && hasJoinedCall) {
      syncFormField(fieldId, value);
    }
  };

  // Handle signature changes with collaborative sync
  const handleSignatureChange = async (fieldId, signature) => {
    const signedBy = role === 'Notary' ? 'notary' : 'client';
    actions.addSignature(fieldId, signature, signedBy);
    
    // Update session data if this is a notary session
    if (isNotarySession && sessionData && meetingId) {
      try {
        const updatedSignatures = {
          ...sessionData.signatures || {},
          [fieldId]: {
            data: signature,
            signedBy,
            timestamp: new Date().toISOString(),
            userId: user?.uid || 'anonymous'
          }
        };
        
        await updateNotarySession(meetingId, {
          signatures: updatedSignatures,
          lastModified: new Date().toISOString(),
          lastModifiedBy: user?.uid || 'anonymous'
        });
      } catch (error) {
        console.error('Error updating session signatures:', error);
      }
    }
    
    // Sync with other participants if collaborative
    if (isCollaborative && hasJoinedCall) {
      syncSignature(fieldId, signature, signedBy);
    }
  };

  // Toggle form panel visibility
  const toggleFormPanel = () => {
    setShowFormPanel(!showFormPanel);
  };

  // Handle video call callbacks
  const handleVideoJoinRoom = () => {
    setHasJoinedCall(true);
    setIsLoading(false);
    // Start video call in workflow context
    const notaryId = role === 'Notary' ? user?.uid : 'notary_id';
    actions.startVideoCall(notaryId);
  };

  const handleVideoLeaveRoom = () => {
    // End video call in workflow context
    actions.endVideoCall();
    // Navigate based on role
    if (role === 'Notary') {
      // Notary returns to member dashboard
      router.push('/dashboard/member');
    } else {
      // Client goes to download page
      router.push('/form-step5');
    }
  };

  const handleVideoError = (errorMessage) => {
    setError(errorMessage);
    setIsLoading(false);
  };

  // Set loading to false once auth is checked
  useEffect(() => {
    if (authChecked && !sessionLoading) {
      setIsLoading(false);
    }
  }, [authChecked, sessionLoading]);

  // Handle notary signature and seal application
  const handleVerificationComplete = async (verificationData) => {
    try {
      // Store verification data in session
      if (sessionData?.id) {
        await updateNotarySession(sessionData.id, {
          verificationComplete: true,
          verificationData: verificationData,
          verificationTimestamp: new Date().toISOString(),
          verifiedBy: user?.uid || 'notary'
        });
      }
      
      setVerificationComplete(true);
      setShowVerification(false);
      toast.success('Identity verification completed successfully');
    } catch (error) {
      console.error('Error saving verification data:', error);
      toast.error('Failed to save verification data');
    }
  };

  // Handle interactive signature completion
  const handleNotarySignaturesReady = (signatures) => {
    console.log('Received signatures from InteractivePDFSigner:', signatures);
    setNotarySignatures(signatures);
    console.log('notarySignatures state should now be:', signatures);
    setShowInteractiveSigner(false);
    if (signatures.length > 0) {
      toast.success(`${signatures.length} signature${signatures.length > 1 ? 's' : ''} placed. Ready to notarize.`);
    } else {
      toast.info('No signatures placed.');
    }
  };

  // Toggle interactive signature mode
  const toggleInteractiveSignMode = () => {
    if (!documentUrl) {
      toast.error('Document must be loaded first');
      return;
    }
    setShowInteractiveSigner(!showInteractiveSigner);
    if (!showInteractiveSigner) {
      // Clear existing signatures when entering interactive mode
      setNotarySignatures([]);
    }
  };

  const handleNotarySignAndSeal = async () => {
    // Check if acknowledgment data is complete
    if (!acknowledgmentData) {
      setShowAcknowledgmentModal(true);
      toast.info('Please complete the notary acknowledgment details first');
      return;
    }
    
    if (!documentUrl) {
      toast.error('Document not available for notarization');
      return;
    }

    // Get client and notary names (compute locally to avoid scope issues)
    const clientName = formData?.step1 
      ? `${formData.step1.firstName || ''} ${formData.step1.lastName || ''}`.trim() 
      : (user?.email || 'Client');
    const notaryDisplayName = user?.displayName || user?.email || 'Notary';
    
    setIsNotarizing(true);
    
    // Log the request data for debugging
    const requestData = {
      sessionId: sessionData?.id || meetingId,
      documentUrl: documentUrl,
      notaryName: acknowledgmentData.notaryName || notaryDisplayName,
      notaryId: user?.uid || 'notary-id',
      notaryCommissionNumber: acknowledgmentData.notaryCommissionNumber || 'COMM-2024-001',
      clientName: acknowledgmentData.clientFullName || clientName,
      clientId: sessionData?.clientId || 'client-id',
      jurisdiction: acknowledgmentData.notaryState || formData?.step1?.jurisdictionOfDocumentUse || 'Not specified',
      documentType: currentDocumentType,
      acknowledgmentData: acknowledgmentData, // Include full acknowledgment data
      notarySignatures: notarySignatures // Include interactive signature positions
    };
    
    console.log('Sending notarization request with data:', requestData);
    
    try {
      // Call the notary-stamp-pdf API to apply signature and seal
      const response = await authFetch('/api/notary-stamp-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      console.log('Notarization API Response:', result);

      if (result.success) {
        // Document notarized successfully
        setDocumentNotarized(true);
        setNotarizedDocumentUrl(result.notarizedDocURL);
        setShowNotarizedVersion(true);
        
        // Update session with notarized document info to trigger client listener
        const sessionIdToUpdate = sessionData?.id || meetingId;
        if (sessionIdToUpdate) {
          console.log('Updating Firebase session:', sessionIdToUpdate);
          await updateNotarySession(sessionIdToUpdate, {
            'document.status': 'notarized',
            'document.notarizedUrl': result.notarizedDocURL,
            'document.notarizedAt': new Date().toISOString(),
            'document.notarizedBy': user?.uid,
            status: 'completed',  // This should trigger the client listener
            workflowStage: 'completed',
            completedAt: new Date().toISOString()
          });
          console.log('Firebase session updated successfully');
        }
        
        toast.success('Document successfully notarized and sealed!');
      } else {
        console.error('Notarization failed:', result);
        console.error('Error details:', result.error, result.details);
        const errorMessage = result.details || result.error || 'Unknown error occurred';
        setError(errorMessage);
        toast.error(`Failed to notarize: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error notarizing document:', error);
      console.error('Error details:', error.message, error.stack);
      setError(error.message || 'Failed to notarize document. Please try again.');
      toast.error(`Error: ${error.message || 'Failed to notarize document'}`);  
    } finally {
      setIsNotarizing(false);
    }
  };

  // Handle client signature during notary session
  const handleClientSignDocument = async () => {
    // If we have a submission like e-sign, stamp it for preview
    if (submissionData?.id) {
      setIsClientSigning(true);
      try {
        const response = await authFetch('/api/stamp-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId: submissionData.id }),
        });
        const result = await response.json();
        if (result.success) {
          setClientSigned(true);
          setClientSignedDocumentUrl(result.approvedDocURL);
          toast.success('Document signed by client');
        } else {
          toast.error(result.error || 'Failed to sign document');
        }
      } catch (e) {
        console.error('Client sign error:', e);
        toast.error('Failed to sign document');
      } finally {
        setIsClientSigning(false);
      }
    } 
    // Or if we have session data, update it
    else if (sessionData && user) {
      try {
        const clientDisplayName = formData?.step1 
          ? `${formData.step1.firstName || ''} ${formData.step1.lastName || ''}`.trim() 
          : (user?.email || 'User');
        const clientSignature = {
          signedBy: 'client',
          signedAt: new Date().toISOString(),
          userId: user.uid,
          userName: clientDisplayName
        };

        await updateNotarySession(sessionData.id, {
          'document.clientSignature': clientSignature,
          'document.status': 'client_signed',
          lastModified: new Date().toISOString(),
          lastModifiedBy: user.uid
        });

        setClientSigned(true);
        toast.success('Document signed successfully! Waiting for notary approval.');
      } catch (error) {
        console.error('Error signing document:', error);
        toast.error('Failed to sign document. Please try again.');
      }
    } 
    // Otherwise just mark as signed
    else {
      setClientSigned(true);
      toast.success('Client signature recorded');
    }
  };

  // Handle proceed to download (navigate to download page)
  const handleProceedToDownload = () => {
    router.push('/form-step5');
  };

  // Toggle between original and notarized document versions
  const toggleDocumentVersion = () => {
    setShowNotarizedVersion(!showNotarizedVersion);
  };
  
  // Handle saving acknowledgment data from modal
  const handleSaveAcknowledgment = async (data) => {
    setAcknowledgmentData(data);
    
    // Save to session if available
    if (sessionData?.id) {
      try {
        await updateNotarySession(sessionData.id, {
          acknowledgmentData: data,
          acknowledgmentCompleted: true,
          acknowledgmentTimestamp: new Date().toISOString()
        });
        toast.success('Acknowledgment details saved successfully! You can now proceed to notarize the document.');
      } catch (error) {
        console.error('Error saving acknowledgment data:', error);
        toast.error('Failed to save acknowledgment data');
      }
    } else {
      toast.success('Acknowledgment details saved! You can now proceed to notarize the document.');
    }
    
    setShowAcknowledgmentModal(false);
  };
  
  // Handle signatures from interactive signer
  const handleSignaturesReady = (signatures) => {
    setNotarySignatures(signatures);
    console.log('Notary signatures updated:', signatures);
  };

  const handleNext = () => {
    router.push('/form-step5');
  };

  const handleBack = () => {
    if (from === 'member' || from === 'notary') {
      // Notary goes back to member dashboard
      router.push('/dashboard/member');
    } else {
      // Client goes to download page (form-step5)
      router.push('/form-step5');
    }
  };

  // Get document URL for preview with PDF generation
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const getDocumentUrl = () => {
    // Return generated PDF URL if available
    if (generatedPdfUrl) {
      return generatedPdfUrl;
    }
    
    // Check session data for document URL (notary session structure)
    if (sessionData?.document?.originalUrl) {
      return sessionData.document.originalUrl;
    }
    if (sessionData?.documentUrl) {
      return sessionData.documentUrl;
    }
    if (sessionData?.step2?.documentUrl) {
      return sessionData.step2.documentUrl;
    }
    // Check submission data
    if (submissionData?.documentUrl) {
      return submissionData.documentUrl;
    }
    // Check form data for custom document
    if (formData?.step2?.documentType === 'custom-document' && 
        formData?.documentForms?.['custom-document']?.documentUrl) {
      return formData.documentForms['custom-document'].documentUrl;
    }
    // Check step2 data directly
    if (formData?.step2?.documentUrl) {
      return formData.step2.documentUrl;
    }
    return null;
  };

  // Generate PDF for form-based documents (for both client and notary)
  useEffect(() => {
    const generatePDFIfNeeded = async () => {
      if (!formData || !formData.step2?.documentType || generatedPdfUrl || pdfGenerating) {
        return;
      }

      const docType = formData.step2.documentType;
      
      // Check if document URL already exists
      const existingUrl = getDocumentUrl();
      if (existingUrl) {
        return;
      }

      // Only generate PDF for form-based documents
      if (requiresPDFGeneration(docType)) {
        setPdfGenerating(true);
        try {
          console.log('Generating PDF for document type:', docType);
          console.log('Form data available:', formData);
          console.log('Document forms available:', formData.documentForms);
          
          const pdfUrl = await getOrGenerateDocumentUrl(
            docType,
            formData,
            formData.documentForms || {}
          );
          
          if (pdfUrl) {
            setGeneratedPdfUrl(pdfUrl);
            console.log('PDF generated successfully:', pdfUrl);
            
            // For notary, update the session with the generated PDF URL
            if (role === 'Notary' && sessionData?.id && !sessionData.document?.originalUrl) {
              try {
                await updateNotarySession(sessionData.id, {
                  'document.originalUrl': pdfUrl,
                  lastModified: new Date().toISOString()
                });
                console.log('Updated notary session with generated PDF URL');
              } catch (error) {
                console.error('Error updating notary session with PDF URL:', error);
              }
            }
            
            toast.success('Document preview generated successfully!');
          }
        } catch (error) {
          console.error('Error generating PDF:', error);
          toast.error('Failed to generate document preview');
        } finally {
          setPdfGenerating(false);
        }
      }
    };

    generatePDFIfNeeded();
  }, [formData?.step2?.documentType, role, sessionData?.id]); // Include role and sessionData.id for notary updates

  const documentUrl = getDocumentUrl();
  // Fix userName to show correct name for both client and notary
  const getUserDisplayName = () => {
    if (role === 'Notary') {
      // For notary, use authenticated user's name or email
      return user?.displayName || user?.email || 'Notary';
    } else {
      // For client, use form data
      return formData?.step1 ? `${formData.step1.firstName || ''} ${formData.step1.lastName || ''}`.trim() : 'Client';
    }
  };
  const userName = getUserDisplayName();
  const currentDocumentType = sessionData?.documentType || documentType || state.selectedDocumentType || 'document';

  if (!authChecked || isLoading || sessionLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">{!authChecked ? 'Checking authentication...' : sessionLoading ? 'Loading session data...' : 'Setting up video call...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-danger">
              <h4>Error</h4>
              <p>{error}</p>
              <Link href="/form-step1" className="btn btn-primary">
                Start Over
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Main Content */}
        <div className="col-12">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center py-3 px-4 border-bottom">
          <Link href="/">
            <img
              src="/assets/images/logos/logo.png"
              style={{ height: '60px' }}
              alt="Logo"
            />
          </Link>
          <h4 className="mb-0" style={{ color: '#2D3748' }}>
            Video Call Document Review
          </h4>
          <button 
            onClick={handleBack}
            className="btn btn-sm" 
            style={{ backgroundColor: '#274171', color: 'white', border: 'none' }}
          >
            <i className="fa fa-arrow-left me-2"></i>
            Back
          </button>
          </div>

          {/* Document Information Panel */}
          <div className="bg-light border-bottom p-4">
          <div className="row">
            <div className="col-md-8">
                <h5 className="mb-1">
                  Video Call Session - {currentDocumentType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  {documentNotarized && (
                    <span className="badge bg-success ms-2">Notarized</span>
                  )}
                </h5>
                <p className="text-muted mb-0">
                  {hasJoinedCall 
                    ? role === 'Notary' 
                      ? 'Connected to video call. Review the client\'s document and proceed with notarization when ready.'
                      : 'Connected to video call with notary. Your document is displayed for review and signature.'
                    : role === 'Notary'
                      ? 'Preparing notary session. Waiting for connection...'
                      : 'Connecting to notary. Please wait...'
                  }
                </p>
                {/* Remove collaboration status since it's disabled */}
              </div>
              <div className="col-md-4 text-md-end">
                <div className="d-flex align-items-center justify-content-md-end">
                  <div className="me-3">
                    <small className="text-muted">{role === 'Notary' ? 'Notary:' : 'Participant:'}</small>
                    <div className="fw-bold">{userName}</div>
                  </div>
                  <i className={`fa ${role === 'Notary' ? 'fa-gavel' : 'fa-user-circle'} fa-2x text-primary`}></i>
                </div>
            </div>
          </div>
          </div>

          {/* Main Content Area - Document (Left) + Video Call (Right) */}
          <div className="document-viewer-container" style={{ height: 'calc(100vh - 200px)' }}>
            <div className="row h-100 g-0">
              {/* Left Panel - Document Preview only */}
              <div className="col-lg-8 h-100">
                <div className="h-100 border-end position-relative bg-white">
                  <div className="h-100 overflow-auto">
                    {pdfGenerating ? (
                      <div className="d-flex justify-content-center align-items-center h-100">
                        <div className="text-center text-muted">
                          <div className="spinner-border text-primary mb-3" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <h4>Generating Document Preview</h4>
                          <p className="mb-3">Converting form data to PDF...</p>
                          <small>This may take a few moments.</small>
                        </div>
                      </div>
                    ) : documentUrl ? (
                      showInteractiveSigner && role === 'Notary' ? (
                        <InteractivePDFSigner
                          pdfUrl={documentUrl}
                          onSignaturesReady={handleNotarySignaturesReady}
                          notaryName={acknowledgmentData?.notaryName || user?.displayName || user?.email || 'Notary Public'}
                          isNotary={true}
                        />
                      ) : (
                        <SimplePDFViewer 
                          pdfUrl={documentUrl}
                          className="h-100"
                          title={`${currentDocumentType.replace('-', ' ')} Document`}
                        />
                      )
                    ) : (
                      <div className="d-flex justify-content-center align-items-center h-100">
                        <div className="text-center text-muted">
                          <i className="fa fa-file-pdf-o fa-4x mb-3"></i>
                          <h4>Document Preview</h4>
                          <p className="mb-3">
                            {requiresPDFGeneration(currentDocumentType) 
                              ? 'Document preview will be generated from your form data.'
                              : 'No document available for preview.'
                            }
                          </p>
                          <small>
                            {requiresPDFGeneration(currentDocumentType)
                              ? 'Please ensure you have completed all required form fields.'
                              : 'The document will appear here during the notary session.'
                            }
                          </small>
                          {requiresPDFGeneration(currentDocumentType) && formData?.step2?.documentType && (
                            <div className="mt-3">
                              <button
                                onClick={() => {
                                  setGeneratedPdfUrl(null);
                                  setPdfGenerating(false);
                                }}
                                className="btn btn-primary btn-sm"
                                disabled={pdfGenerating}
                              >
                                <i className="fa fa-refresh me-2"></i>
                                Generate Preview
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Panel - Video Call with Actions at Bottom */}
              <div className="col-lg-4 h-100">
                <div className="h-100 bg-white d-flex flex-column">
                  {/* Verification panel removed - OCR verification done in form step 2 */}
                  
                  {/* Video Call Section */}
                  <div className="flex-grow-1 p-3">
                    <div className="h-100 d-flex flex-column">
                      {/* Use SafeVideoCall component */}
                      <div className="flex-grow-1">
                        <SafeVideoCall
                          meetingId={meetingId}
                          userName={userName || `User_${Math.floor(Math.random() * 10000)}`}
                          userId={user?.uid || Math.floor(Math.random() * 10000).toString()}
                          onJoinRoom={handleVideoJoinRoom}
                          onLeaveRoom={handleVideoLeaveRoom}
                          onError={handleVideoError}
                        />
                      </div>
                      <div className="mt-3 text-center">
                        {hasJoinedCall ? (
                          <div className="d-flex align-items-center justify-content-center">
                            <div 
                              className="rounded-circle me-2"
                              style={{ width: '8px', height: '8px', backgroundColor: '#10B981' }}
                            ></div>
                            <small className="text-success fw-medium">Live Session Active</small>
                          </div>
                        ) : (
                          <div className="d-flex align-items-center justify-content-center">
                            <div className="spinner-border spinner-border-sm me-2 text-warning" role="status"></div>
                            <small className="text-warning fw-medium">Connecting to notary...</small>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Right Action Panel (sticky) */}
                  <div className="p-3 border-top" style={{ position: 'sticky', bottom: 0, backgroundColor: '#fff' }}>
                    {role === 'Notary' ? (
                      <div className="d-grid gap-2">
                        {/* Add acknowledgment details button */}
                        {!acknowledgmentData && (
                          <button
                            className="btn py-3 mb-2 w-100"
                            onClick={() => setShowAcknowledgmentModal(true)}
                            style={{ 
                              fontSize: '15px', 
                              fontWeight: '600', 
                              backgroundColor: '#274171', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '8px',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#274171';
                              e.target.style.transform = 'translateY(-1px)';
                              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = '#274171';
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                            }}
                          >
                            <i className="fa fa-file-signature me-2"></i>
                            Add Notary Acknowledgment
                          </button>
                        )}
                        
                        {acknowledgmentData && (
                          <div className="alert mb-2" style={{ backgroundColor: '#d4f8e8', border: '1px solid #10b981', color: '#065f46' }}>
                            <div className="d-flex justify-content-between align-items-center">
                              <small className="d-flex align-items-center">
                                <i className="fa fa-check-circle me-2" style={{ color: '#10b981' }}></i>
                                <strong>Acknowledgment Completed</strong>
                              </small>
                              <button 
                                className="btn btn-sm" 
                                onClick={() => setShowAcknowledgmentModal(true)}
                                style={{ 
                                  fontSize: '12px',
                                  backgroundColor: '#274171',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '4px 12px'
                                }}
                              >
                                <i className="fa fa-edit me-1"></i>
                                Edit
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Interactive signature mode toggle button */}
                        {acknowledgmentData && documentUrl && (
                          <button
                            className="btn py-2 mb-2 w-100"
                            onClick={toggleInteractiveSignMode}
                            style={{ 
                              fontSize: '14px', 
                              fontWeight: '500', 
                              backgroundColor: showInteractiveSigner ? '#dc3545' : '#6c757d', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '8px',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <i className={`fa ${showInteractiveSigner ? 'fa-times' : 'fa-hand-pointer-o'} me-2`}></i>
                            {showInteractiveSigner ? 'Exit Signature Mode' : 'Place Signatures'}
                          </button>
                        )}
                        
                        {/* Show signature count when signatures are placed */}
                        {notarySignatures.length > 0 && (
                          <div className="alert mb-2" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', color: '#856404' }}>
                            <small className="d-flex align-items-center">
                              <i className="fa fa-signature me-2" style={{ color: '#ffc107' }}></i>
                              <strong>{notarySignatures.length} signature{notarySignatures.length > 1 ? 's' : ''} placed</strong>
                            </small>
                          </div>
                        )}
                        
                        {!documentNotarized ? (
                          <>
                            <button
                              className="btn py-3 position-relative"
                              onClick={!acknowledgmentData ? () => {
                                toast.error('Please complete the Notary Acknowledgment first');
                                setShowAcknowledgmentModal(true);
                              } : handleNotarySignAndSeal}
                              disabled={isNotarizing || !documentUrl || !acknowledgmentData}
                              style={{ 
                                fontSize: '16px', 
                                fontWeight: '600', 
                                backgroundColor: !acknowledgmentData ? '#9CA3AF' : '#274171', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '8px',
                                cursor: !acknowledgmentData ? 'not-allowed' : 'pointer',
                                opacity: !acknowledgmentData ? 0.7 : 1,
                                transition: 'all 0.3s ease'
                              }}
                              title={!acknowledgmentData ? 'Complete acknowledgment details first' : 'Notarize and seal the document'}
                            >
                              {isNotarizing ? (
                                <>
                                  <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                  Notarizing...
                                </>
                              ) : (
                                <>
                                  <i className="fa fa-stamp me-2"></i>
                                  Notarize & Seal
                                </>
                              )}
                            </button>
                            {!acknowledgmentData && (
                              <small className="text-muted text-center mt-1" style={{ fontSize: '12px' }}>
                                <i className="fa fa-info-circle me-1"></i>
                                Acknowledgment required before notarization
                              </small>
                            )}
                          </>
                        ) : (
                          // After notarization, show success message and end session button
                          <>
                            <div className="alert alert-success mb-2">
                              <div className="d-flex align-items-center">
                                <i className="fa fa-check-circle me-2"></i>
                                <div>
                                  <strong>Notarization Complete!</strong>
                                  <br />
                                  <small>Document has been successfully notarized and sealed.</small>
                                </div>
                              </div>
                            </div>
                            <button
                              className="btn py-3"
                              onClick={() => router.push('/dashboard/member')}
                              style={{ fontSize: '16px', fontWeight: '600', backgroundColor: '#274171', color: 'white', border: 'none', borderRadius: '8px' }}
                            >
                              <i className="fa fa-arrow-left me-2"></i>
                              Return to Dashboard
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="d-grid gap-2">
                        {documentNotarized ? (
                          // Show success state when document is notarized
                          <>
                            <div className="alert alert-success mb-2">
                              <div className="d-flex align-items-center">
                                <i className="fa fa-check-circle me-2"></i>
                                <div>
                                  <strong>Document Notarized!</strong>
                                  <br />
                                  <small>Your document has been successfully notarized.</small>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => router.push('/form-step5')}
                              className="btn py-3"
                              style={{ fontSize: '16px', fontWeight: '600', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px' }}
                            >
                              <i className="fa fa-download me-2"></i>
                              Download Notarized Document
                            </button>
                          </>
                        ) : (
                          // Normal client buttons
                          <>
                            <button
                              onClick={handleClientSignDocument}
                              className="btn py-3"
                              disabled={!hasJoinedCall || isClientSigning}
                              style={{ fontSize: '16px', fontWeight: '600', backgroundColor: hasJoinedCall ? '#274171' : '#9CA3AF', color: 'white', border: 'none', borderRadius: '8px' }}
                            >
                              {isClientSigning ? (
                                <>
                                  <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                  Signing...
                                </>
                              ) : (
                                <>
                                  <i className="fa fa-pen me-2"></i>
                                  Sign Document
                                </>
                              )}
                            </button>
                            <button
                              onClick={handleBack}
                              className="btn py-2"
                              style={{ fontSize: '14px', backgroundColor: 'transparent', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '8px' }}
                            >
                              End Session
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Notary Acknowledgment Modal */}
      <NotaryAcknowledgmentModal
        isOpen={showAcknowledgmentModal}
        onClose={() => setShowAcknowledgmentModal(false)}
        onSave={handleSaveAcknowledgment}
        documentType={currentDocumentType}
        clientData={formData?.step1 || sessionData?.step1}
        existingData={acknowledgmentData}
        sessionData={sessionData}
      />
    </div>
  );
};

export default VideoCallPage;
