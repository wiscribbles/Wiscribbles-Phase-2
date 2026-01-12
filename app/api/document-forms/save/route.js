import { NextResponse } from 'next/server';
import { db } from '@/firebase';
import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';

export async function POST(request) {
  try {
    const { userId, documentType, formData, sessionId } = await request.json();

    if (!documentType || !formData) {
      return NextResponse.json(
        { success: false, error: 'Document type and form data are required' },
        { status: 400 }
      );
    }

    // Create a unique identifier for this document form session
    // Use userId if available, otherwise use sessionId, or generate a temporary one
    const identifier = userId || sessionId || `temp_${Date.now()}`;
    const documentFormId = `${identifier}_${documentType}`;

    // Prepare the document form data
    const documentFormData = {
      id: documentFormId,
      userId: userId || null,
      sessionId: sessionId || null,
      documentType,
      formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft' // draft, submitted, completed
    };

    console.log('Saving document form data:', {
      documentFormId,
      documentType,
      userId: userId || 'anonymous',
      sessionId
    });

    // Save to Firebase
    const docRef = doc(db, 'documentForms', documentFormId);
    await setDoc(docRef, documentFormData, { merge: true });

    return NextResponse.json({
      success: true,
      data: {
        id: documentFormId,
        documentType,
        formData
      },
      message: 'Document form data saved successfully'
    });

  } catch (error) {
    console.error('Error saving document form data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save document form data',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const documentType = searchParams.get('documentType');

    if (!documentType) {
      return NextResponse.json(
        { success: false, error: 'Document type is required' },
        { status: 400 }
      );
    }

    // Create the same identifier logic as in POST
    const identifier = userId || sessionId;
    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'User ID or Session ID is required' },
        { status: 400 }
      );
    }

    const documentFormId = `${identifier}_${documentType}`;

    console.log('Retrieving document form data:', {
      documentFormId,
      documentType,
      userId: userId || 'anonymous',
      sessionId
    });

    // Get from Firebase
    const docRef = doc(db, 'documentForms', documentFormId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return NextResponse.json({
        success: true,
        data: {
          id: data.id,
          documentType: data.documentType,
          formData: data.formData,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          status: data.status
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        data: {
          id: null,
          documentType,
          formData: {},
          createdAt: null,
          updatedAt: null,
          status: 'new'
        }
      });
    }

  } catch (error) {
    console.error('Error retrieving document form data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve document form data',
        details: error.message
      },
      { status: 500 }
    );
  }
}
