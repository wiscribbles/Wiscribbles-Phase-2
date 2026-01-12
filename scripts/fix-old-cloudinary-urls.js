// Script to fix old Cloudinary URLs in Firebase submissions
// This script updates document URLs from the old cloud (dvhrg7bkp) to the new cloud (dgyv432jt)

import { db } from '../firebase.js';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';

const OLD_CLOUD_NAME = 'dvhrg7bkp';
const NEW_CLOUD_NAME = 'dgyv432jt';

// Function to convert old URL to new URL
function convertCloudinaryUrl(oldUrl) {
  if (!oldUrl || typeof oldUrl !== 'string') return oldUrl;
  
  // Replace the old cloud name with the new one
  const newUrl = oldUrl.replace(
    `https://res.cloudinary.com/${OLD_CLOUD_NAME}`,
    `https://res.cloudinary.com/${NEW_CLOUD_NAME}`
  );
  
  // Also ensure PDFs use /raw/upload instead of /image/upload
  if (newUrl.includes('.pdf') && newUrl.includes('/image/upload/')) {
    return newUrl.replace('/image/upload/', '/raw/upload/');
  }
  
  return newUrl;
}

// Function to fix a specific submission by ID
export async function fixSpecificSubmission(submissionId) {
  try {
    console.log(`🔧 Fixing submission: ${submissionId}`);
    
    const submissionRef = doc(db, 'formSubmissions', submissionId);
    const submissionDoc = await getDoc(submissionRef);
    
    if (!submissionDoc.exists()) {
      console.error(`❌ Submission ${submissionId} not found`);
      return false;
    }
    
    const data = submissionDoc.data();
    let hasUpdates = false;
    const updates = {};
    
    // Check for document URLs in various possible locations
    const urlFields = [
      'documentUrl',
      'step3.documentUrl',
      'step1.identificationImageUrl',
      'approvedDocURL'
    ];
    
    urlFields.forEach(field => {
      const fieldParts = field.split('.');
      let value = data;
      
      // Navigate nested objects
      for (const part of fieldParts) {
        if (value && typeof value === 'object') {
          value = value[part];
        } else {
          value = undefined;
          break;
        }
      }
      
      if (value && typeof value === 'string' && value.includes(OLD_CLOUD_NAME)) {
        const newUrl = convertCloudinaryUrl(value);
        
        if (fieldParts.length === 1) {
          updates[field] = newUrl;
        } else {
          // Handle nested fields
          if (!updates[fieldParts[0]]) {
            updates[fieldParts[0]] = { ...data[fieldParts[0]] };
          }
          updates[fieldParts[0]][fieldParts[1]] = newUrl;
        }
        
        hasUpdates = true;
        console.log(`📝 Updating ${field}:`);
        console.log(`   Old: ${value}`);
        console.log(`   New: ${newUrl}`);
      }
    });
    
    if (hasUpdates) {
      await updateDoc(submissionRef, updates);
      console.log(`✅ Successfully updated submission ${submissionId}`);
      return true;
    } else {
      console.log(`ℹ️  No updates needed for submission ${submissionId}`);
      return true;
    }
    
  } catch (error) {
    console.error(`❌ Error fixing submission ${submissionId}:`, error);
    return false;
  }
}

// Function to fix all submissions with old URLs
export async function fixAllOldSubmissions() {
  try {
    console.log('🔍 Searching for submissions with old Cloudinary URLs...');
    
    const submissionsRef = collection(db, 'formSubmissions');
    const querySnapshot = await getDocs(submissionsRef);
    
    let totalSubmissions = 0;
    let fixedSubmissions = 0;
    
    for (const doc of querySnapshot.docs) {
      totalSubmissions++;
      const data = doc.data();
      
      // Check if this submission has any old URLs
      const hasOldUrls = JSON.stringify(data).includes(OLD_CLOUD_NAME);
      
      if (hasOldUrls) {
        console.log(`🔧 Found old URLs in submission: ${doc.id}`);
        const success = await fixSpecificSubmission(doc.id);
        if (success) fixedSubmissions++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total submissions checked: ${totalSubmissions}`);
    console.log(`   Submissions fixed: ${fixedSubmissions}`);
    
  } catch (error) {
    console.error('❌ Error fixing submissions:', error);
  }
}

// Usage examples:
// Fix specific submission: await fixSpecificSubmission('MtBwBDTXNgCbbsrwv951');
// Fix all submissions: await fixAllOldSubmissions();
