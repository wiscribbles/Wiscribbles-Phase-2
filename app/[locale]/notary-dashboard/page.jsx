// 'use client';

// import React, { useEffect, useState } from 'react';
// import { useTranslations } from 'next-intl';
// import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
// import { db } from '@/firebase';
// import { useRouter } from 'next/navigation';
// import { ArrowLeft, Download, Check, X, Eye, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

// const styles = {
//   container: {
//     padding: "24px",
//     minHeight: "100vh",
//     backgroundColor: "#f9fafb",
//     fontFamily: "Poppins, system-ui, -apple-system, sans-serif",
//   },
//   header: {
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: "32px",
//   },
//   backButton: {
//     display: "flex",
//     alignItems: "center",
//     gap: "8px",
//     border: "none",
//     backgroundColor: "transparent",
//     cursor: "pointer",
//     fontSize: "14px",
//     fontWeight: "500",
//     color: "#374151",
//     padding: "4px",
//   },
//   title: {
//     fontSize: "28px",
//     fontWeight: "700",
//     color: "#111827",
//     margin: 0,
//   },
//   statsContainer: {
//     display: "grid",
//     gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
//     gap: "16px",
//     marginBottom: "32px",
//   },
//   statCard: {
//     backgroundColor: "white",
//     padding: "20px",
//     borderRadius: "12px",
//     boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
//     border: "1px solid #e5e7eb",
//   },
//   statNumber: {
//     fontSize: "24px",
//     fontWeight: "700",
//     margin: "0 0 4px 0",
//   },
//   statLabel: {
//     fontSize: "14px",
//     color: "#6b7280",
//     margin: 0,
//   },
//   documentsGrid: {
//     display: "grid",
//     gap: "24px",
//   },
//   userCard: {
//     backgroundColor: "white",
//     borderRadius: "12px",
//     boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
//     border: "1px solid #e5e7eb",
//     overflow: "hidden",
//   },
//   userHeader: {
//     padding: "20px",
//     borderBottom: "1px solid #e5e7eb",
//     display: "flex",
//     alignItems: "center",
//     gap: "12px",
//   },
//   avatar: {
//     width: "48px",
//     height: "48px",
//     borderRadius: "50%",
//     backgroundColor: "#3b82f6",
//     color: "white",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     fontSize: "16px",
//     fontWeight: "600",
//   },
//   userInfo: {
//     flex: 1,
//   },
//   userName: {
//     fontSize: "18px",
//     fontWeight: "600",
//     color: "#111827",
//     margin: "0 0 4px 0",
//   },
//   userEmail: {
//     fontSize: "14px",
//     color: "#6b7280",
//     margin: 0,
//   },
//   documentsContainer: {
//     padding: "20px",
//     display: "grid",
//     gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
//     gap: "20px",
//   },
//   documentCard: {
//     border: "1px solid #e5e7eb",
//     borderRadius: "8px",
//     padding: "16px",
//     backgroundColor: "#f9fafb",
//   },
//   documentHeader: {
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: "12px",
//   },
//   documentTitle: {
//     fontSize: "16px",
//     fontWeight: "600",
//     color: "#111827",
//     margin: 0,
//   },
//   statusBadge: {
//     padding: "4px 8px",
//     borderRadius: "12px",
//     fontSize: "12px",
//     fontWeight: "500",
//     display: "flex",
//     alignItems: "center",
//     gap: "4px",
//   },
//   documentInfo: {
//     marginBottom: "16px",
//   },
//   documentDetail: {
//     fontSize: "14px",
//     color: "#6b7280",
//     margin: "4px 0",
//   },
//   actionsContainer: {
//     display: "flex",
//     gap: "8px",
//     flexWrap: "wrap",
//   },
//   button: {
//     padding: "8px 12px",
//     borderRadius: "6px",
//     border: "none",
//     cursor: "pointer",
//     fontSize: "14px",
//     fontWeight: "500",
//     display: "flex",
//     alignItems: "center",
//     gap: "4px",
//     transition: "all 0.2s",
//   },
//   primaryButton: {
//     backgroundColor: "#3b82f6",
//     color: "white",
//   },
//   successButton: {
//     backgroundColor: "#10b981",
//     color: "white",
//   },
//   dangerButton: {
//     backgroundColor: "#ef4444",
//     color: "white",
//   },
//   outlineButton: {
//     backgroundColor: "transparent",
//     border: "1px solid #d1d5db",
//     color: "#374151",
//   },
// };

// const getStatusColor = (status) => {
//   switch (status) {
//     case "approved":
//       return { backgroundColor: "#dcfce7", color: "#166534" };
//     case "rejected":
//       return { backgroundColor: "#fee2e2", color: "#dc2626" };
//     case "pending":
//       return { backgroundColor: "#fef3c7", color: "#d97706" };
//     default:
//       return { backgroundColor: "#f3f4f6", color: "#374151" };
//   }
// };

// const getStatusIcon = (status) => {
//   switch (status) {
//     case "approved":
//       return <CheckCircle size={14} />;
//     case "rejected":
//       return <XCircle size={14} />;
//     case "pending":
//       return <Clock size={14} />;
//     default:
//       return <AlertCircle size={14} />;
//   }
// };

// const NotaryDashboard = () => {
//   const t = useTranslations();
//   const router = useRouter();
//   const [submissions, setSubmissions] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchSubmissions();
//   }, []);

//   const fetchSubmissions = async () => {
//     try {
//       const querySnapshot = await getDocs(collection(db, 'formSubmissions'));
//       const submissionsList = querySnapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       }));
//       setSubmissions(submissionsList);
//       setLoading(false);
//     } catch (error) {
//       console.error('Error fetching submissions:', error);
//       setLoading(false);
//     }
//   };

//   const handleApprove = async (submissionId) => {
//     try {
//       const response = await fetch('/api/form2/approve', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           submissionId,
//           approved: true,
//           notaryId: 'current-notary-id', // Replace with actual notary ID
//           notaryName: 'Current Notary' // Replace with actual notary name
//         })
//       });

//       const result = await response.json();
      
//       if (!result.success) {
//         throw new Error(result.error);
//       }

//       // Refresh submissions
//       fetchSubmissions();
//     } catch (error) {
//       console.error('Error approving submission:', error);
//     }
//   };

//   const handleReject = async (submissionId) => {
//     try {
//       const response = await fetch('/api/form2/approve', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           submissionId,
//           approved: false,
//           notaryId: 'current-notary-id', // Replace with actual notary ID
//           notaryName: 'Current Notary' // Replace with actual notary name
//         })
//       });

//       const result = await response.json();
      
//       if (!result.success) {
//         throw new Error(result.error);
//       }

//       // Refresh submissions
//       fetchSubmissions();
//     } catch (error) {
//       console.error('Error rejecting submission:', error);
//     }
//   };

//   if (loading) {
//     return (
//       <div style={styles.container}>
//         <div style={styles.header}>
//           <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
//             <button onClick={() => window.history.back()} style={styles.backButton}>
//               <ArrowLeft size={23} />
//             </button>
//             <h1 style={styles.title}>Notary Dashboard</h1>
//           </div>
//         </div>
//         <div className="flex items-center justify-center h-64">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
//         </div>
//       </div>
//     );
//   }

//   // Calculate stats
//   const totalDocuments = submissions.length;
//   const pendingDocuments = submissions.filter(doc => doc.status === 'pending').length;
//   const approvedDocuments = submissions.filter(doc => doc.status === 'approved').length;
//   const rejectedDocuments = submissions.filter(doc => doc.status === 'rejected').length;

//   return (
//     <div style={styles.container}>
//       {/* Header */}
//       <div style={styles.header}>
//         <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
//           <button onClick={() => window.history.back()} style={styles.backButton}>
//             <ArrowLeft size={23} />
//           </button>
//           <h1 style={styles.title}>Notary Dashboard</h1>
//         </div>
//       </div>

//       {/* Stats */}
//       <div style={styles.statsContainer}>
//         <div style={styles.statCard}>
//           <h3 style={{ ...styles.statNumber, color: "#3b82f6" }}>{totalDocuments}</h3>
//           <p style={styles.statLabel}>Total Documents</p>
//         </div>
//         <div style={styles.statCard}>
//           <h3 style={{ ...styles.statNumber, color: "#d97706" }}>{pendingDocuments}</h3>
//           <p style={styles.statLabel}>Pending Review</p>
//         </div>
//         <div style={styles.statCard}>
//           <h3 style={{ ...styles.statNumber, color: "#10b981" }}>{approvedDocuments}</h3>
//           <p style={styles.statLabel}>Approved</p>
//         </div>
//         <div style={styles.statCard}>
//           <h3 style={{ ...styles.statNumber, color: "#ef4444" }}>{rejectedDocuments}</h3>
//           <p style={styles.statLabel}>Rejected</p>
//         </div>
//       </div>

//       {/* Documents List */}
//       <div style={styles.documentsGrid}>
//         {submissions.map((submission) => (
//           <div key={submission.id} style={styles.userCard}>
//             <div style={styles.userHeader}>
//               <div style={styles.avatar}>
//                 {submission.step1?.firstName?.[0]}{submission.step1?.lastName?.[0]}
//               </div>
//               <div style={styles.userInfo}>
//                 <h3 style={styles.userName}>
//                   {submission.step1?.firstName} {submission.step1?.lastName}
//                 </h3>
//                 <p style={styles.userEmail}>{submission.step1?.email}</p>
//               </div>
//             </div>

//             <div style={styles.documentsContainer}>
//               <div style={styles.documentCard}>
//                 <div style={styles.documentHeader}>
//                   <h4 style={styles.documentTitle}>
//                     {submission.step2?.documentType || 'Document'}
//                   </h4>
//                   <div style={{ ...styles.statusBadge, ...getStatusColor(submission.status) }}>
//                     {getStatusIcon(submission.status)}
//                     {submission.status?.charAt(0).toUpperCase() + submission.status?.slice(1) || 'Pending'}
//                   </div>
//                 </div>

//                 <div style={styles.documentInfo}>
//                   <p style={styles.documentDetail}>
//                     <strong>Type:</strong> {submission.step1?.identificationType || 'N/A'}
//                   </p>
//                   <p style={styles.documentDetail}>
//                     <strong>ID Number:</strong> {submission.step1?.licenseIdNumber || 'N/A'}
//                   </p>
//                   <p style={styles.documentDetail}>
//                     <strong>Submitted:</strong> {new Date(submission.submittedAt).toLocaleDateString()}
//                   </p>
//                   {submission.status === 'approved' && submission.referenceNumber && (
//                     <p style={styles.documentDetail}>
//                       <strong>Reference Number:</strong> {submission.referenceNumber}
//                     </p>
//                   )}
//                 </div>

//                 <div style={styles.actionsContainer}>
//                   {submission.step1?.identificationImageUrl && (
//                     <button style={{ ...styles.button, ...styles.outlineButton }}>
//                       <Eye size={14} />
//                       View
//                     </button>
//                   )}
//                   {submission.step1?.identificationImageUrl && (
//                     <button style={{ ...styles.button, ...styles.outlineButton }}>
//                       <Download size={14} />
//                       Download
//                     </button>
//                   )}
//                   {submission.status !== 'approved' && submission.status !== 'rejected' && (
//                     <>
//                       <button
//                         style={{ ...styles.button, ...styles.successButton }}
//                         onClick={() => handleApprove(submission.id)}
//                       >
//                         <Check size={14} />
//                         Approve
//                       </button>
//                       <button
//                         style={{ ...styles.button, ...styles.dangerButton }}
//                         onClick={() => handleReject(submission.id)}
//                       >
//                         <X size={14} />
//                         Reject
//                       </button>
//                     </>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default NotaryDashboard; 