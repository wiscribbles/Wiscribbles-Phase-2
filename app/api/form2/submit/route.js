import { NextResponse } from 'next/server';
import { ALLOWED_DOCUMENT_TYPES, ALLOWED_IMAGE_TYPES, getTokenUrl, uniqueFilename, uploadBuffer } from '@/lib/storage/server';
import { adminDb } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const formData = await request.json();
    console.log('Received form data:', formData);

    // Generate UUID reference number
    const referenceNumber = uuidv4();

    // Upload files to Firebase Storage if they exist
        const uploadAttachment = async (file, folder = '') => {
      // Firebase Storage. Replaces an inline Cloudinary upload that carried
      // the cloud name and an unsigned preset.
      if (!file) return null;
      const buffer = Buffer.from(await file.arrayBuffer());
      const isPdf = file.type === 'application/pdf';
      const path = `form2/${folder || 'uploads'}/${uniqueFilename(file.name, isPdf ? 'document.pdf' : 'image')}`;
      const result = await uploadBuffer({
        buffer,
        path,
        contentType: file.type || 'application/octet-stream',
        allowedTypes: [...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_IMAGE_TYPES],
      });
      return getTokenUrl(result.path, result.token);
    };

    // Upload identification image if it exists
    let identificationImageUrl = null;
    if (formData.identificationImage) {
      identificationImageUrl = await uploadAttachment(
        formData.identificationImage,
        'form_submissions/identification'
      );
    }

    // Upload signature image if it exists
    let signatureImageUrl = null;
    if (formData.signatureImage) {
      signatureImageUrl = await uploadAttachment(
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
    const docRef = await adminDb().collection('formSubmissions').add(formSubmissionData);

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