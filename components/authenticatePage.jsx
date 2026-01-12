'use client';
import React, { useState } from 'react';
import { FiUser, FiFileText, FiEdit, FiCreditCard, FiDownload } from 'react-icons/fi';
import AuthenticateSidebar from './authenticateSidebar';
import Link from 'next/link';
import Logo from './Logo';
import { db } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

const AuthenticatePage = () => {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [date, setDate] = useState({ day: '', month: '', year: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bypassDate, setBypassDate] = useState(false); // Temporary for testing
  const router = useRouter();

  const handleAuthenticate = async () => {
    setError('');
    
    // Validate inputs
    if (!referenceNumber.trim()) {
      setError('Please enter a reference number');
      return;
    }
    
    if (!date.day || !date.month || !date.year) {
      setError('Please enter the complete date');
      return;
    }
    
    // Format the date for comparison
    const formattedDate = `${date.day.padStart(2, '0')}-${date.month.padStart(2, '0')}-${date.year}`;
    
    setLoading(true);
    try {
      // Query for document with matching reference number
      const q = query(collection(db, 'formSubmissions'), where('referenceNumber', '==', referenceNumber));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data();
        const docId = querySnapshot.docs[0].id;
        
        // Extract and format the document's signed date
        let signedDate = '';
        let dateToUse = null;
        
        // Debug logging
        console.log('=== AUTHENTICATION DEBUG ===');
        console.log('Full Document data:', docData);
        console.log('notarizedAt raw:', docData.notarizedAt);
        console.log('notarizedAt type:', typeof docData.notarizedAt);
        if (docData.notarizedAt) {
          console.log('notarizedAt.seconds:', docData.notarizedAt.seconds);
          console.log('notarizedAt.toDate:', docData.notarizedAt.toDate);
        }
        console.log('approvedAt:', docData.approvedAt);
        console.log('submittedAt:', docData.submittedAt);
        
        if (docData.notarizedAt) {
          // For notarized documents - handle Firebase Timestamp
          try {
            if (docData.notarizedAt.seconds) {
              // Firebase Timestamp object
              dateToUse = new Date(docData.notarizedAt.seconds * 1000);
              console.log('Created date from seconds:', dateToUse);
            } else if (docData.notarizedAt.toDate && typeof docData.notarizedAt.toDate === 'function') {
              // Firestore Timestamp with toDate method
              dateToUse = docData.notarizedAt.toDate();
              console.log('Created date from toDate():', dateToUse);
            } else if (docData.notarizedAt._seconds) {
              // Sometimes Firebase returns with underscore
              dateToUse = new Date(docData.notarizedAt._seconds * 1000);
              console.log('Created date from _seconds:', dateToUse);
            } else if (typeof docData.notarizedAt === 'string') {
              // String date (ISO format or other)
              dateToUse = new Date(docData.notarizedAt);
              console.log('Created date from string:', dateToUse);
            } else if (typeof docData.notarizedAt === 'object' && docData.notarizedAt.toMillis) {
              // Firestore Timestamp with toMillis method
              dateToUse = new Date(docData.notarizedAt.toMillis());
              console.log('Created date from toMillis():', dateToUse);
            } else {
              // Try direct conversion
              dateToUse = new Date(docData.notarizedAt);
              console.log('Created date from direct conversion:', dateToUse);
            }
          } catch (err) {
            console.error('Error parsing notarizedAt:', err);
            dateToUse = null;
          }
        } else if (docData.approvedAt) {
          // For e-signed documents
          if (docData.approvedAt.seconds) {
            dateToUse = new Date(docData.approvedAt.seconds * 1000);
          } else if (docData.approvedAt.toDate) {
            dateToUse = docData.approvedAt.toDate();
          } else {
            dateToUse = new Date(docData.approvedAt);
          }
        } else if (docData.submittedAt) {
          // Fallback to submission date
          if (docData.submittedAt.seconds) {
            dateToUse = new Date(docData.submittedAt.seconds * 1000);
          } else if (docData.submittedAt.toDate) {
            dateToUse = docData.submittedAt.toDate();
          } else {
            dateToUse = new Date(docData.submittedAt);
          }
        }
        
        if (dateToUse && !isNaN(dateToUse.getTime())) {
          signedDate = `${dateToUse.getDate().toString().padStart(2, '0')}-${(dateToUse.getMonth() + 1).toString().padStart(2, '0')}-${dateToUse.getFullYear()}`;
          console.log('Date object created:', dateToUse);
          console.log('Date string:', dateToUse.toString());
        } else {
          console.log('ERROR: Could not create valid date from timestamp');
        }
        
        console.log('Formatted signed date from DB:', signedDate);
        console.log('User entered date:', formattedDate);
        console.log('Dates match?', signedDate === formattedDate);
        
        // Validate the date - try multiple formats
        let datesMatch = false;
        
        // Also try alternative date formats
        const userDay = parseInt(date.day);
        const userMonth = parseInt(date.month);
        const userYear = parseInt(date.year);
        
        if (dateToUse && !isNaN(dateToUse.getTime())) {
          const dbDay = dateToUse.getDate();
          const dbMonth = dateToUse.getMonth() + 1;
          const dbYear = dateToUse.getFullYear();
          
          console.log(`Comparing: User(${userDay}/${userMonth}/${userYear}) vs DB(${dbDay}/${dbMonth}/${dbYear})`);
          
          // Check if the numeric values match
          datesMatch = (userDay === dbDay && userMonth === dbMonth && userYear === dbYear);
        }
        
        if (!datesMatch && signedDate !== formattedDate && !bypassDate) {
          // Show helpful error with the expected date
          const errorMsg = signedDate 
            ? `The date does not match our records. Document was signed on: ${signedDate} (DD-MM-YYYY). You entered: ${formattedDate}` 
            : 'Could not retrieve the signing date from the document. Please contact support.';
          setError(errorMsg);
          setLoading(false);
          return;
        }
        
        // Log success
        console.log('Date validation passed!');
        
        // Store document data in sessionStorage for use in preview page
        sessionStorage.setItem('authenticatedDocument', JSON.stringify({
          documentId: docId,
          referenceNumber: referenceNumber,
          documentData: docData,
          dateSigned: signedDate
        }));
        
        // Redirect to document preview page
        router.push(`/authenticate/preview`);
      } else {
        setError('Document not found. Please check your reference number.');
      }
    } catch (err) {
      console.error('Error authenticating document:', err);
      setError('Error authenticating document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex">
      <div className="flex-grow-1" style={{ marginRight: '320px' }}>
        <div className="mt-4" style={{ marginLeft: '22px' }}>
          <Logo variant="dark" size="default" />
        </div>

        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="form-card bg-white p-4 rounded-3">
                <div className="text-center mb-5">
                  <h2 style={{ color: '#2D3748', fontSize: '28px', fontWeight: '600' }}>Authenticate</h2>
                  <p style={{ color: '#718096', fontSize: '16px', marginTop: '8px' }}>
                    Find the Documents you need and download them
                  </p>
                </div>

                {/* Reference Number Input */}
                <div className="row justify-content-center mb-4">
                  <div className="col-md-8">
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#2D3748', marginBottom: '8px' }}>Reference Number</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="WIS-XXXX-XXXXX"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#F7FAFC'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Date Input */}
                <div className="row justify-content-center mb-5">
                  <div className="col-md-8">
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#2D3748', marginBottom: '8px' }}>Date Signed</label>
                      <p className="text-muted small mb-2">Enter the date when the document was notarized or signed (DD/MM/YYYY)</p>
                      <div className="d-flex gap-2">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="DD"
                          value={date.day}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 2) setDate({ ...date, day: value });
                          }}
                          maxLength="2"
                          style={{
                            width: '80px',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            backgroundColor: '#F7FAFC'
                          }}
                        />
                        <span className="align-self-center" style={{ color: '#718096' }}>/</span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="MM"
                          value={date.month}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 2) setDate({ ...date, month: value });
                          }}
                          maxLength="2"
                          style={{
                            width: '80px',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            backgroundColor: '#F7FAFC'
                          }}
                        />
                        <span className="align-self-center" style={{ color: '#718096' }}>/</span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="YYYY"
                          value={date.year}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 4) setDate({ ...date, year: value });
                          }}
                          maxLength="4"
                          style={{
                            width: '100px',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            backgroundColor: '#F7FAFC'
                          }}
                        />
                      </div>
                      <div className="form-check mt-2">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="bypassDate" 
                          checked={bypassDate}
                          onChange={(e) => setBypassDate(e.target.checked)}
                        />
                        <label className="form-check-label text-muted small" htmlFor="bypassDate">
                          Skip date validation (Dev mode)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="row justify-content-center mb-3">
                    <div className="col-md-8">
                      <div className="alert alert-danger" role="alert">
                        <i className="fa fa-exclamation-circle me-2"></i>
                        {error}
                      </div>
                    </div>
                  </div>
                )}

                {/* Found Documents Section */}
                <div className="row justify-content-center">
                  <div className="col-md-8">
                    <div className="d-flex mt-2">
                      <button
                        className="btn"
                        onClick={handleAuthenticate}
                        disabled={loading || !referenceNumber || !date.day || !date.month || !date.year}
                        style={{
                          backgroundColor: '#274171',
                          color: 'white',
                          padding: '12px 20px',
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '18px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          border: 'none',
                          transition: 'background-color 0.3s ease',
                          opacity: (loading || !referenceNumber || !date.day || !date.month || !date.year) ? 0.6 : 1,
                        }}
                      >
                        {loading ? 'Authenticating...' : 'Authenticate'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        width: '300px', 
        position: 'fixed', 
        right: 0, 
        top: 0, 
        height: '100vh',
        borderLeft: '1px solid rgba(0,0,0,0.1)',
        backgroundColor: '#091534'
      }}>
        <AuthenticateSidebar currentStep={1} />
      </div>
    </div>
  );
};

export default AuthenticatePage; 