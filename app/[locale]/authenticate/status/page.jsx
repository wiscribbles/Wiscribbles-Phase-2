'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, getDownloadURL, listAll } from 'firebase/storage';
import { db, storage } from '@/firebase'; // Adjust import path as needed

const StatusPage = () => {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const referenceNumber = searchParams.get('referenceNumber');
  const documentId = searchParams.get('documentId'); // Add this to get document ID

  const [statusText, setStatusText] = useState('');
  const [statusIcon, setStatusIcon] = useState(null);
  const [iconColor, setIconColor] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    switch (status) {
      case 'approved':
        setStatusText('Document Approved');
        setStatusIcon(<CheckCircle size={80} />);
        setIconColor('#28A745'); // Green
        break;
      case 'rejected':
        setStatusText('Document Rejected');
        setStatusIcon(<XCircle size={80} />);
        setIconColor('#DC3545'); // Red
        break;
      case 'pending':
        setStatusText('Document Pending Approval');
        setStatusIcon(<Clock size={80} />);
        setIconColor('#FFC107'); // Yellow/Orange
        break;
      default:
        setStatusText('Status Unknown');
        setStatusIcon(<Clock size={80} />);
        setIconColor('#6C757D'); // Gray
        break;
    }
  }, [status]);

  useEffect(() => {
    if (referenceNumber || documentId) {
      fetchDocumentData();
    } else {
      setLoading(false);
    }
  }, [referenceNumber, documentId]);

  const fetchDocumentData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch by documentId first, then by referenceNumber
      if (documentId) {
        const docRef = doc(db, 'formSubmissions', documentId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('Document found by documentId:', data);
          
          // Log approved document details if status is approved
          if (data.status === 'approved') {
            console.log('🎉 APPROVED DOCUMENT DETAILS (via documentId):');
            console.log('- Original Document URL:', data.step3?.documentUrl);
            console.log('- Approved Document URL:', data.approvedDocURL);
            console.log('- Reference Number:', data.referenceNumber);
            console.log('- Approved By:', data.approvedBy?.name);
            console.log('- Approved At:', data.approvedAt);
            console.log('- Signing Method:', data.step3?.signingOption);
            
            // Log the text that would be added to the PDF
            const approvalText = `Approved by ${data.approvedBy?.name || 'Notary'} on ${new Date(data.approvedAt).toLocaleDateString()} - Ref: ${data.referenceNumber}`;
            console.log('📝 TEXT ADDED TO APPROVED PDF:');
            console.log('- Footer Text:', approvalText);
            
            // Show different signing method text based on option
            const userName = `${data.step1?.firstName || ''} ${data.step1?.lastName || ''}`.trim() || 'User';
            const jurisdiction = data.step1?.state || data.step1?.country || 'N/A';
            const approvedDate = new Date().toLocaleDateString('en-GB');
            
            if (data.step3?.signingOption === 'esign') {
              const esignText = `This document has been executed by ${userName} for use in the ${jurisdiction} through www.wiscribbles.com on ${approvedDate}, under reference number ${data.referenceNumber}`;
              console.log('- E-Sign Legal Text:', esignText);
            } else {
              const notaryName = data.approvedBy?.name || 'Notary';
              const notaryText = `This document has been executed by ${userName} for use in the ${jurisdiction} and duly notarized by ${notaryName}, a commissioned notary public of ${jurisdiction}, through www.wiscribbles.com on ${approvedDate}, under reference number ${data.referenceNumber}`;
              console.log('- Notary Legal Text:', notaryText);
            }
            
            console.log('- Reference Text:', `Ref: ${data.referenceNumber}`);
            console.log('- Approval Stamp:', 'APPROVED (watermark)');
            console.log('- Page Numbers:', 'Page X of Y (on each page)');
            
            // Log comparison
            console.log('🔗 URL COMPARISON:');
            console.log('- Same URL?', data.step3?.documentUrl === data.approvedDocURL);
            if (data.step3?.documentUrl === data.approvedDocURL) {
              console.warn('⚠️ WARNING: Original and approved URLs are the same! This means the stamped version was not uploaded to approvedDocument folder.');
            } else {
              console.log('✅ SUCCESS: Different URLs detected - stamped version was created.');
            }
          }
          
          setDocumentData(data);
          return;
        }
      }
      
      // If documentId didn't work or doesn't exist, try with referenceNumber
      if (referenceNumber) {
        // Search for document with matching referenceNumber
        const querySnapshot = await getDocs(
          query(collection(db, 'formSubmissions'), where('referenceNumber', '==', referenceNumber))
        );
        
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
          console.log('Document found by referenceNumber:', data);
          
          // Log approved document details if status is approved
          if (data.status === 'approved') {
            console.log('🎉 APPROVED DOCUMENT DETAILS:');
            console.log('- Original Document URL:', data.step3?.documentUrl);
            console.log('- Approved Document URL:', data.approvedDocURL);
            console.log('- Reference Number:', data.referenceNumber);
            console.log('- Approved By:', data.approvedBy?.name);
            console.log('- Approved At:', data.approvedAt);
            console.log('- Signing Method:', data.step3?.signingOption);
            
            // Log the text that would be added to the PDF
            const approvalText = `Approved by ${data.approvedBy?.name || 'Notary'} on ${new Date(data.approvedAt).toLocaleDateString()} - Ref: ${data.referenceNumber}`;
            console.log('📝 TEXT ADDED TO APPROVED PDF:');
            console.log('- Footer Text:', approvalText);
            
            // Show different signing method text based on option
            const userName = `${data.step1?.firstName || ''} ${data.step1?.lastName || ''}`.trim() || 'User';
            const jurisdiction = data.step1?.state || data.step1?.country || 'N/A';
            const approvedDate = new Date().toLocaleDateString('en-GB');
            
            if (data.step3?.signingOption === 'esign') {
              const esignText = `This document has been executed by ${userName} for use in the ${jurisdiction} through www.wiscribbles.com on ${approvedDate}, under reference number ${data.referenceNumber}`;
              console.log('- E-Sign Legal Text:', esignText);
            } else {
              const notaryName = data.approvedBy?.name || 'Notary';
              const notaryText = `This document has been executed by ${userName} for use in the ${jurisdiction} and duly notarized by ${notaryName}, a commissioned notary public of ${jurisdiction}, through www.wiscribbles.com on ${approvedDate}, under reference number ${data.referenceNumber}`;
              console.log('- Notary Legal Text:', notaryText);
            }
            
            console.log('- Reference Text:', `Ref: ${data.referenceNumber}`);
            console.log('- Approval Stamp:', 'APPROVED (watermark)');
            console.log('- Page Numbers:', 'Page X of Y (on each page)');
            
            // Log comparison
            console.log('🔗 URL COMPARISON:');
            console.log('- Same URL?', data.step3?.documentUrl === data.approvedDocURL);
            if (data.step3?.documentUrl === data.approvedDocURL) {
              console.warn('⚠️ WARNING: Original and approved URLs are the same! This means the stamped version was not uploaded to approvedDocument folder.');
            } else {
              console.log('✅ SUCCESS: Different URLs detected - stamped version was created.');
            }
          }
          
          setDocumentData(data);
          return;
        }
      }
      
      console.log('No document found with the provided reference:', { documentId, referenceNumber });
      
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async () => {
    if (!referenceNumber && !documentData) {
      alert('Reference number not available');
      return;
    }

    try {
      setIsDownloading(true);
      
      let downloadURL = null;
      
      // First, try to get the approved document URL from Firebase
      if (documentData && documentData.approvedDocURL) {
        downloadURL = documentData.approvedDocURL;
        console.log('Using approvedDocURL from Firebase:', downloadURL);
      } else if (documentData && documentData.documentUrl) {
        // Fallback to original document URL if approved version not available
        downloadURL = documentData.documentUrl;
        console.log('Using original documentUrl from Firebase:', downloadURL);
      } else {
        alert('Approved document not found. Please contact support.');
        return;
      }
      
      // Try to download the document
      try {
        // First, try to create a download link
        const link = document.createElement('a');
        link.href = downloadURL;
        link.download = `approved_document_${referenceNumber || 'document'}.pdf`;
        link.target = '_blank';
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`Document download initiated from: ${downloadURL}`);
        
        // If that doesn't work, fallback to opening in new tab
        setTimeout(() => {
          window.open(downloadURL, '_blank');
        }, 500);
      } catch (linkError) {
        console.warn('Download link failed, trying window.open:', linkError);
        window.open(downloadURL, '_blank');
      }
      
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download approved document. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Alternative method: List files in Storage and find by referenceNumber
  const downloadDocumentByListing = async () => {
    if (!referenceNumber) {
      alert('Reference number not available');
      return;
    }

    try {
      setIsDownloading(true);
      
      // If you know the specific folder structure, you can list files
      // This requires Firebase Storage Rules to allow listing
      const folderRef = ref(storage, `notarized-documents/${referenceNumber}/`);
      
      // Note: listAll() requires appropriate Firebase Storage security rules
      const fileList = await listAll(folderRef);
      
      if (fileList.items.length === 0) {
        alert('No documents found for this reference number');
        return;
      }
      
      // Get the first file (or filter for specific file types)
      const fileRef = fileList.items[0]; // or filter for .pdf files
      const downloadURL = await getDownloadURL(fileRef);
      
      // Trigger download
      const link = document.createElement('a');
      link.href = downloadURL;
      link.download = `notarized_document_${referenceNumber}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.logoContainer}>
        <Link legacyBehavior href="/">
          <a style={styles.logoLink}>
            <img
              src="/assets/images/logos/logo.png"
              style={styles.logoImage}
              alt="Logo"
              title="Logo"
            />
          </a>
        </Link>
      </div>

      <div style={styles.card}>
        <div style={{ ...styles.iconContainer, color: iconColor }}>
          {statusIcon}
        </div>
        <h2 style={styles.statusTitle}>{statusText}</h2>
        {referenceNumber && (
          <p style={styles.referenceNumberText}>
            Reference Number: <strong>{referenceNumber}</strong>
          </p>
        )}
        <p style={styles.message}>
          {status === 'approved' 
            ? 'Your document has been approved and is ready for download.' 
            : 'Your document status has been retrieved.'
          }
        </p>

        {/* Show download button for approved documents - more permissive logic */}
        {status === 'approved' && (
          <div style={styles.downloadSection}>
            {/* Show button if we have document data with URLs, or if we have referenceNumber */}
            {((documentData && (documentData.approvedDocURL || documentData.documentUrl)) || referenceNumber) && (
              <>
                <button
                  onClick={downloadDocument}
                  disabled={isDownloading || loading}
                  style={{
                    ...styles.downloadButton,
                    opacity: (isDownloading || loading) ? 0.6 : 1,
                    cursor: (isDownloading || loading) ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Download size={20} style={{ marginRight: '8px' }} />
                  {isDownloading ? 'Downloading...' : 'Download Approved Document'}
                </button>
                {documentData && documentData.approvedDocURL && (
                  <p style={styles.approvedDocText}>
                    ✓ This is the official approved document with authentication stamp
                  </p>
                )}
                {/* Show loading message if still fetching document data */}
                {loading && (
                  <p style={styles.loadingText}>
                    Loading document information...
                  </p>
                )}
              </>
            )}
            
            {/* Show message if document is approved but no download is available and not loading */}
            {!loading && !referenceNumber && (!documentData || (!documentData.approvedDocURL && !documentData.documentUrl)) && (
              <p style={styles.noDocumentText}>
                Approved document is being processed. Please check back later or contact support.
              </p>
            )}
          </div>
        )}

        <div style={styles.buttonContainer}>
          <Link legacyBehavior href="/">
            <a style={styles.returnHomeButton}>
              Return to Home
            </a>
          </Link>
          <Link legacyBehavior href="/forms2">
            <a style={styles.submitAnotherButton}>
              + Submit Another Document
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#F7FAFC',
    padding: '20px',
  },
  logoContainer: {
    marginBottom: '40px',
  },
  logoLink: {
    display: 'block',
  },
  logoImage: {
    height: '70px',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    textAlign: 'center',
    width: '100%',
    maxWidth: '500px',
  },
  iconContainer: {
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'center',
  },
  statusTitle: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: '10px',
  },
  referenceNumberText: {
    fontSize: '16px',
    color: '#4A5568',
    marginBottom: '20px',
  },
  message: {
    fontSize: '16px',
    color: '#718096',
    marginTop: '10px',
    marginBottom: '30px',
  },
  downloadSection: {
    marginBottom: '30px',
  },
  downloadButton: {
    backgroundColor: '#28A745',
    color: 'white',
    border: 'none',
    padding: '12px 25px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: '10px',
    transition: 'background-color 0.3s ease',
  },
  noDocumentText: {
    fontSize: '14px',
    color: '#E53E3E',
    fontStyle: 'italic',
  },
  approvedDocText: {
    fontSize: '14px',
    color: '#28A745',
    fontWeight: '500',
    marginTop: '8px',
    marginBottom: '0',
  },
  loadingText: {
    fontSize: '14px',
    color: '#718096',
    fontStyle: 'italic',
    marginTop: '8px',
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  returnHomeButton: {
    backgroundColor: '#2D3748',
    color: 'white',
    padding: '12px 25px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'background-color 0.3s ease',
  },
  submitAnotherButton: {
    backgroundColor: 'white',
    color: '#2D3748',
    border: '1px solid #E2E8F0',
    padding: '12px 25px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'background-color 0.3s ease, border-color 0.3s ease',
  },
};

export default StatusPage;