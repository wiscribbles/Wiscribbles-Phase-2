import { NextResponse } from 'next/server';
import { db } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const formData = await request.json();
    console.log('Received form data:', formData);

    // Generate UUID reference number
    const referenceNumber = uuidv4();

    // Upload files to Cloudinary if they exist
    const uploadFileToCloudinary = async (file, folder = '') => {
      if (!file) return null;

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'wiscribbles');
        formData.append('cloud_name', 'dgyv432jt');
        
        if (folder) {
          formData.append('folder', folder);
        }

        // Determine the correct endpoint based on file type
        const isPDF = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
        const uploadEndpoint = isPDF 
          ? 'https://api.cloudinary.com/v1_1/dgyv432jt/raw/upload'
          : 'https://api.cloudinary.com/v1_1/dgyv432jt/image/upload';
        
        // Add resource_type for PDFs
        if (isPDF) {
          formData.append('resource_type', 'raw');
        }

        const response = await fetch(uploadEndpoint,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.secure_url;
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
      }
    };

    // Upload identification image if it exists
    let identificationImageUrl = null;
    if (formData.identificationImage) {
      identificationImageUrl = await uploadFileToCloudinary(
        formData.identificationImage,
        'form_submissions/identification'
      );
    }

    // Upload signature image if it exists
    let signatureImageUrl = null;
    if (formData.signatureImage) {
      signatureImageUrl = await uploadFileToCloudinary(
        formData.signatureImage,
        'form_submissions/signatures'
      );
    }

    // Prepare the data for Firestore
    const formSubmissionData = {
      referenceNumber,
      step1: formData.step1 || {},
      step2: formData.step2 || {},
      step3: formData.step3 || {},
      step4: formData.step4 || {},
      step5: formData.step5 || {},
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    console.log('Saving to Firestore:', formSubmissionData);

    // Add the document to Firestore
    const docRef = await addDoc(collection(db, 'formSubmissions'), formSubmissionData);

    return NextResponse.json({ 
      success: true, 
      data: {
        id: docRef.id,
        referenceNumber,
        ...formSubmissionData
      },
      message: 'Form submitted successfully' 
    });

  } catch (error) {
    console.error('Form submission error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
} 