// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useTranslations } from 'next-intl';
// import { db } from '@/firebase';
// import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

// const NotaryDashboard = () => {
//   const t = useTranslations();
//   const [submissions, setSubmissions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     // Query for pending submissions
//     const q = query(
//       collection(db, 'form_submissions'),
//       where('approvalStatus', '==', 'pending'),
//       orderBy('createdAt', 'desc')
//     );

//     // Subscribe to real-time updates
//     const unsubscribe = onSnapshot(q, 
//       (snapshot) => {
//         const submissionList = snapshot.docs.map(doc => ({
//           id: doc.id,
//           ...doc.data()
//         }));
//         setSubmissions(submissionList);
//         setLoading(false);
//       },
//       (error) => {
//         console.error('Error fetching submissions:', error);
//         setError(error.message);
//         setLoading(false);
//       }
//     );

//     // Cleanup subscription
//     return () => unsubscribe();
//   }, []);

//   const handleApproval = async (submissionId, approved) => {
//     try {
//       const response = await fetch('/api/form2/approve', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           submissionId,
//           approved,
//           notaryId: 'current-notary-id', // Replace with actual notary ID
//           notaryName: 'Current Notary' // Replace with actual notary name
//         })
//       });

//       const result = await response.json();
      
//       if (!result.success) {
//         throw new Error(result.error);
//       }

//       // The real-time listener will automatically update the UI
//     } catch (error) {
//       console.error('Error approving submission:', error);
//       setError(error.message);
//     }
//   };

//   if (loading) {
//     return <div className="p-4">Loading submissions...</div>;
//   }

//   if (error) {
//     return <div className="p-4 text-red-500">Error: {error}</div>;
//   }

//   return (
//     <div className="p-4">
//       <h1 className="text-2xl font-bold mb-4">Notary Dashboard</h1>
      
//       {submissions.length === 0 ? (
//         <p>No pending submissions</p>
//       ) : (
//         <div className="space-y-4">
//           {submissions.map((submission) => (
//             <div key={submission.id} className="border p-4 rounded-lg shadow">
//               <div className="flex justify-between items-start mb-4">
//                 <div>
//                   <h2 className="text-lg font-semibold">
//                     Submission #{submission.referenceNumber}
//                   </h2>
//                   <p className="text-sm text-gray-600">
//                     Submitted on: {new Date(submission.createdAt).toLocaleString()}
//                   </p>
//                 </div>
//                 <div className="flex space-x-2">
//                   <button
//                     onClick={() => handleApproval(submission.id, true)}
//                     className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
//                   >
//                     Approve
//                   </button>
//                   <button
//                     onClick={() => handleApproval(submission.id, false)}
//                     className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
//                   >
//                     Reject
//                   </button>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <h3 className="font-semibold mb-2">Personal Information</h3>
//                   <p>Name: {submission.personal_info.firstName} {submission.personal_info.lastName}</p>
//                   <p>Email: {submission.personal_info.email}</p>
//                   <p>Country: {submission.personal_info.countryOfResidence}</p>
//                 </div>

//                 <div>
//                   <h3 className="font-semibold mb-2">Document Information</h3>
//                   <p>Type: {submission.document_info.documentType}</p>
//                   <p>ID Type: {submission.personal_info.identificationType}</p>
//                   <p>ID Number: {submission.personal_info.licenseIdNumber}</p>
//                 </div>
//               </div>

//               {submission.personal_info.identificationImage && (
//                 <div className="mt-4">
//                   <h3 className="font-semibold mb-2">Identification Image</h3>
//                   <img
//                     src={submission.personal_info.identificationImage}
//                     alt="Identification"
//                     className="max-w-xs rounded"
//                   />
//                 </div>
//               )}

//               {submission.signature_info.signatureImage && (
//                 <div className="mt-4">
//                   <h3 className="font-semibold mb-2">Signature</h3>
//                   <img
//                     src={submission.signature_info.signatureImage}
//                     alt="Signature"
//                     className="max-w-xs rounded"
//                   />
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default NotaryDashboard; 