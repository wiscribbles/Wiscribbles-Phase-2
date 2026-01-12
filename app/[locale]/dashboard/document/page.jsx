'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Check, X, Eye, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { Nav } from 'react-bootstrap';
import { LuLayoutDashboard } from "react-icons/lu";
import { FiUser, FiFileText, FiCalendar, FiSettings, FiLogOut } from "react-icons/fi";
import { Poppins } from 'next/font/google';
import NotificationBell from '@/components/NotificationBell';
import { useAuthStore } from '@/store/authStore';
import { PDFDocument, rgb } from 'pdf-lib';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
});

// Initialize EmailJS
emailjs.init("nWH88iJVBzhSqWLzz");

const addFooterToPDF = async (pdfUrl, footerText) => {
  try {
    console.log('Starting PDF modification for Cloudinary URL...');

    const CLOUDINARY_CLOUD_NAME = 'dgyv432jt';
    const CLOUDINARY_UPLOAD_PRESET = 'WiScribbles';

    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    const response = await fetch(`${proxyUrl}${pdfUrl}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF from Cloudinary: ${response.statusText}`);
    }
    const pdfBytes = await response.arrayBuffer();
    
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      page.drawText(footerText, {
        x: 30,
        y: 30,
        size: 8,
        color: rgb(0.3, 0.3, 0.3),
      });
      const pageNumberText = `Page ${index + 1} of ${pages.length}`;
      page.drawText(pageNumberText, {
        x: width - 80,
        y: 15,
        size: 8,
        color: rgb(0.3, 0.3, 0.3),
      });
    });
    
    const modifiedPdfBytes = await pdfDoc.save();
    
    const formData = new FormData();
    formData.append('file', new Blob([modifiedPdfBytes], { type: 'application/pdf' }));
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!cloudinaryResponse.ok) {
      const errorData = await cloudinaryResponse.json();
      throw new Error(`Failed to upload modified PDF to Cloudinary: ${JSON.stringify(errorData)}`);
    }

    const cloudinaryData = await cloudinaryResponse.json();
    return cloudinaryData.secure_url;
    
  } catch (error) {
    console.error('Error modifying PDF:', error);
    throw error;
  }
};

const styles = {
  container: {
    padding: "24px",
    minHeight: "100vh",
    backgroundColor: "#ffffff",
    fontFamily: "Poppins, system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "32px",
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    padding: "4px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  statsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "32px",
    marginTop:"20px"
  },
  statCard: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e5e7eb",
  },
  statNumber: {
    fontSize: "24px",
    fontWeight: "700",
    margin: "0 0 4px 0",
  },
  statLabel: {
    fontSize: "14px",
    color: "#6b7280",
    margin: 0,
  },
  documentsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "24px",
    padding: "0 24px",
  },
  userCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  userHeader: {
    padding: "16px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "#3b82f6",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "600",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#111827",
    margin: "0 0 4px 0",
  },
  userEmail: {
    fontSize: "14px",
    color: "#6b7280",
    margin: 0,
  },
  documentsContainer: {
    padding: "16px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  documentCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "16px",
    backgroundColor: "#f9fafb",
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  documentHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  documentTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#111827",
    margin: 0,
  },
  statusBadge: {
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  documentInfo: {
    marginBottom: "16px",
  },
  documentDetail: {
    fontSize: "14px",
    color: "#6b7280",
    margin: "4px 0",
  },
  actionsContainer: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  button: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    transition: "all 0.2s",
  },
  primaryButton: {
    backgroundColor: "#3b82f6",
    color: "white",
  },
  successButton: {
    backgroundColor: "#10b981",
    color: "white",
  },
  dangerButton: {
    backgroundColor: "#ef4444",
    color: "white",
  },
  outlineButton: {
    backgroundColor: "transparent",
    border: "1px solid #d1d5db",
    color: "#374151",
  },
};

const getStatusColor = (status) => {
  switch (status) {
    case "approved":
      return { backgroundColor: "#dcfce7", color: "#166534" };
    case "rejected":
      return { backgroundColor: "#fee2e2", color: "#dc2626" };
    case "pending":
      return { backgroundColor: "#fef3c7", color: "#d97706" };
    default:
      return { backgroundColor: "#f3f4f6", color: "#374151" };
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case "approved":
      return <CheckCircle size={14} />;
    case "rejected":
      return <XCircle size={14} />;
    case "pending":
      return <Clock size={14} />;
    default:
      return <AlertCircle size={14} />;
  }
};

const generateReferenceNumber = () => {
  const prefix = 'WIS';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

const sendApprovalEmail = async (userEmail, referenceNumber, userName) => {
  try {
    // Create template parameters with all possible variable names
    const templateParams = {
      to_email: userEmail,  // Standard EmailJS recipient field
      email: userEmail,     // Your template's email field
      to_name: userName,
      name: userName,       // Alternative name field
      reference_number: referenceNumber,
      ref_number: referenceNumber,
      reference: referenceNumber,
      code: referenceNumber,
      verification_code: referenceNumber,
      message: `Your document has been approved. Your reference number is: ${referenceNumber}`,
      subject: `Document Approved - Reference Number: ${referenceNumber}`
    };

    console.log('Preparing to send email with these parameters:', {
      serviceID: 'service_9wu43ho',
      templateID: 'template_bu0fm8i',
      templateParams: templateParams
    });

    const response = await emailjs.send(
      'service_9wu43ho',
      'template_bu0fm8i',
      templateParams,
      'nWH88iJVBzhSqWLzz'
    );

    console.log('EmailJS Response:', response);
    if (response.status === 200) {
      console.log('Email sent successfully with reference number:', referenceNumber);
    }
    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Failed parameters:', {
      email: userEmail,
      referenceNumber: referenceNumber,
      userName: userName
    });
    throw error;
  }
};

const NotaryDashboard = () => {
  const t = useTranslations();
  const router = useRouter();
  const signOut = useAuthStore((state) => state.signOut);
  const [submissions, setSubmissions] = useState([]);
  const [pendingMeetings, setPendingMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [isNotary, setIsNotary] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    // Fetch pending meetings for notification bell
    const fetchPendingMeetings = async () => {
      const q = query(
        collection(db, 'formSubmissions'),
        where('status', '==', 'pending')
      );
      const querySnapshot = await getDocs(q);
      const meetings = querySnapshot.docs.map(doc => doc.data());
      setPendingMeetings(meetings);
    };
    fetchPendingMeetings();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'formSubmissions'));
      const submissionsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubmissions(submissionsList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (submission) => {
    try {
      setSendingEmail(true);
      
      // Call the notarization API which handles PDF stamping and Firebase updates
      const response = await fetch('/api/notarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ submissionId: submission.id }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to notarize document.');
      }

      // Send approval email
      const userEmail = submission.step1?.email;
      if (userEmail) {
        const userName = `${submission.step1?.firstName || ''} ${submission.step1?.lastName || ''}`.trim() || 'User';
        await sendApprovalEmail(userEmail, data.referenceNumber, userName);
      } else {
        console.warn('No user email found to send approval notification.');
      }

      await fetchSubmissions();
      alert('Document notarized successfully!');
      
    } catch (error) {
      console.error('Error approving submission:', error);
      alert(`Error approving document: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleReject = async (submissionId) => {
    try {
      const submissionRef = doc(db, 'formSubmissions', submissionId);
      await updateDoc(submissionRef, {
        status: 'rejected',
        rejectedAt: new Date().toISOString()
      });
      fetchSubmissions();
    } catch (error) {
      console.error('Error rejecting submission:', error);
    }
  };

  if (loading) {
    return (
      <div className={poppins.className}>
        <div className="d-none d-md-block position-fixed top-0 start-0" style={{ minWidth: 220, height: '100vh', backgroundColor: "#1C2434", color: "#fff", left: 0, zIndex: 1040, fontFamily: poppins.style.fontFamily }}>
          <div className="p-4">
            <div className="text-center mb-4">
              <img
                src="/assets/images/logos/logo-white.png"
                alt="WiScribbles Logo"
                style={{ maxWidth: "100px", height: "auto" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", height: "80vh" }}>
              <Nav className="flex-column" >
                <Nav.Link href="/dashboard" className="text-white mb-3 d-flex align-items-center">
                  <LuLayoutDashboard className="me-2" style={{ fontSize: '20px' }} /> Dashboard
                </Nav.Link>
                <Nav.Link href="/dashboard/profile" className="text-white mb-3 d-flex align-items-center ">
                  <FiUser className="me-2" style={{ fontSize: '20px' }} /> Profile
                </Nav.Link>
                {isNotary && (
                  <Nav.Link href="/dashboard/document" className="text-white mb-3 d-flex align-items-center">
                    <FiFileText className="me-2" style={{ fontSize: '20px' }} /> Documents
                  </Nav.Link>
                )}
                {isNotary && (
                  <Nav.Link href="/dashboard/member" className="text-white mb-2 d-flex align-items-center">
                    <FiFileText className="me-2" style={{ fontSize: '20px' }} /> Members
                  </Nav.Link>
                )}
                <Nav.Link href="/dashboard/calender" className="text-white mb-3 d-flex align-items-center">
                  <FiCalendar className="me-2" style={{ fontSize: '20px' }} /> Calender
                </Nav.Link>
                <Nav.Link href="/dashboard/settings" className="text-white mb-3 d-flex align-items-center">
                  <FiSettings className="me-2" style={{ fontSize: '20px' }} /> Settings
                </Nav.Link>
              </Nav>
              <div style={{ flexGrow: 1 }} />
              <Nav.Link href="/auth/signin" className="text-white mb-2 d-flex align-items-center">
                <FiLogOut className="me-2" style={{ fontSize: '20px' }} /> Logout
              </Nav.Link>
            </div>
          </div>
        </div>
        <div style={{ ...styles.container, marginLeft: '220px', fontFamily: poppins.style.fontFamily }}>
          <div style={styles.header}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <h1 style={styles.title}>Notary Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats1
  const totalDocuments = submissions.length;
  const pendingDocuments = submissions.filter(doc => doc.status === 'pending').length;
  const approvedDocuments = submissions.filter(doc => doc.status === 'approved').length;
  const rejectedDocuments = submissions.filter(doc => doc.status === 'rejected').length;

  return (
    <div className={poppins.className}>
      <div className="d-none d-md-block position-fixed top-0 start-0" style={{ minWidth: 220, height: '100vh', backgroundColor: "#1C2434", color: "#fff", left: 0, zIndex: 1040, fontFamily: poppins.style.fontFamily }}>
        <div className="p-4">
          <div className="text-center mb-4">
            <img
              src="/assets/images/logos/logo-white.png"
              alt="WiScribbles Logo"
              style={{ maxWidth: "100px", height: "auto" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", height: "80vh" }}>
            <Nav className="flex-column">
              <Nav.Link href="/dashboard" className="text-white mb-3 d-flex align-items-center">
                <LuLayoutDashboard className="me-2" style={{ fontSize: '20px' }} /> Dashboard
              </Nav.Link>
              <Nav.Link href="/dashboard/profile" className="text-white mb-3 d-flex align-items-center ">
                <FiUser className="me-2" style={{ fontSize: '20px' }} /> Profile
              </Nav.Link>
              {isNotary && (
                <Nav.Link href="/dashboard/document" className="text-white mb-3 d-flex align-items-center">
                  <FiFileText className="me-2" style={{ fontSize: '20px' }} /> Documents
                </Nav.Link>
              )}
              {isNotary && (
                <Nav.Link href="/dashboard/member" className="text-white mb-2 d-flex align-items-center">
                  <FiFileText className="me-2" style={{ fontSize: '20px' }} /> Members
                </Nav.Link>
              )}
              <Nav.Link href="/dashboard/calender" className="text-white mb-3 d-flex align-items-center">
                <FiCalendar className="me-2" style={{ fontSize: '20px' }} /> Calender
              </Nav.Link>
              <Nav.Link href="/dashboard/settings" className="text-white mb-3 d-flex align-items-center">
                <FiSettings className="me-2" style={{ fontSize: '20px' }} /> Settings
              </Nav.Link>
            </Nav>
            <div style={{ flexGrow: 1 }} />
            <Nav.Link
              as="button"
              className="text-white mb-2 d-flex align-items-center"
              style={{ background: 'none', border: 'none', textAlign: 'left' }}
              onClick={async () => {
                await signOut();
                router.push('/signIn');
              }}
            >
              <FiLogOut className="me-2" style={{ fontSize: '20px' }} /> Logout
            </Nav.Link>
          </div>
        </div>
      </div>
      <div style={{ ...styles.container, marginLeft: '220px',  fontFamily: poppins.style.fontFamily }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={styles.header}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <h1 style={styles.title}>Notary Dashboard</h1>
            </div>
          </div>
          <NotificationBell pendingMeetings={pendingMeetings} />
        </div>

        {/* Stats */}
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <h3 style={{ ...styles.statNumber, color: "#3b82f6" }}>{totalDocuments}</h3>
            <p style={styles.statLabel}>Total Documents</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={{ ...styles.statNumber, color: "#d97706" }}>{pendingDocuments}</h3>
            <p style={styles.statLabel}>Pending Review</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={{ ...styles.statNumber, color: "#10b981" }}>{approvedDocuments}</h3>
            <p style={styles.statLabel}>Approved</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={{ ...styles.statNumber, color: "#ef4444" }}>{rejectedDocuments}</h3>
            <p style={styles.statLabel}>Rejected</p>
          </div>
        </div>

        {/* Documents Grid */}
        <div style={styles.documentsGrid}>
          {submissions.map((submission) => (
            <div key={submission.id} style={styles.userCard}>
              {/* User Header */}
              <div style={styles.userHeader}>
                <div style={styles.avatar}>
                  {submission.step1?.firstName?.[0]}{submission.step1?.lastName?.[0]}
                </div>
                <div style={styles.userInfo}>
                  <h3 style={styles.userName}>
                    {submission.step1 ? 
                      `${submission.step1.firstName} ${submission.step1.middleName ? submission.step1.middleName + ' ' : ''}${submission.step1.lastName}` 
                      : 'N/A'}
                  </h3>
                  <p style={styles.userEmail}>{submission.step1?.email || 'N/A'}</p>
                </div>
              </div>

              {/* Document Card */}
              <div style={styles.documentsContainer}>
                <div style={styles.documentCard}>
                  <div style={styles.documentHeader}>
                    <h4 style={styles.documentTitle}>
                      {submission.step2?.documentType || 'Document'}
                    </h4>
                    <div style={{ ...styles.statusBadge, ...getStatusColor(submission.status) }}>
                      {getStatusIcon(submission.status)}
                      {submission.status?.charAt(0).toUpperCase() + submission.status?.slice(1) || 'Pending'}
                    </div>
                  </div>

                  <div style={styles.documentInfo}>
                    <p style={styles.documentDetail}>
                      <strong>Type:</strong> {submission.step1?.identificationType || 'N/A'}
                    </p>
                    <p style={styles.documentDetail}>
                      <strong>ID Number:</strong> {submission.step1?.licenseIdNumber || 'N/A'}
                    </p>
                    <p style={styles.documentDetail}>
                      <strong>Submitted:</strong> {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                    {submission.referenceNumber && (
                      <p style={styles.documentDetail}>
                        <strong>Reference Number:</strong> {submission.referenceNumber}
                      </p>
                    )}
                  </div>

                  <div style={styles.actionsContainer}>
                    {submission.step1?.identificationImageUrl && (
                      <button style={{ ...styles.button, ...styles.outlineButton }}>
                        <Eye size={14} />
                        View
                      </button>
                    )}
                    {submission.step1?.identificationImageUrl && (
                      <button style={{ ...styles.button, ...styles.outlineButton }}>
                        <Download size={14} />
                        Download
                      </button>
                    )}
                    {submission.status === 'approved' && submission.approvedDocURL && (
                      <button 
                        style={{ ...styles.button, ...styles.primaryButton }}
                        onClick={() => window.open(submission.approvedDocURL, '_blank')}
                      >
                        <Download size={14} />
                        Download Approved Document
                      </button>
                    )}
                    {submission.status !== 'approved' && submission.status !== 'rejected' && (
                      <>
                        <button
                          style={{ ...styles.button, ...styles.successButton }}
                          onClick={() => handleApprove(submission)}
                          disabled={sendingEmail}
                        >
                          {sendingEmail ? 'Sending...' : (
                            <>
                              <Check size={14} />
                              Approve
                            </>
                          )}
                        </button>
                        <button
                          style={{ ...styles.button, ...styles.dangerButton }}
                          onClick={() => handleReject(submission.id)}
                        >
                          <X size={14} />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotaryDashboard; 