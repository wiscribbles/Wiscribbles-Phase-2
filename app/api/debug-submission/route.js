import { NextResponse } from 'next/server';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request) {
  try {
    const { submissionId } = await request.json();

    if (!submissionId) {
      return NextResponse.json({ success: false, error: 'Submission ID is required' }, { status: 400 });
    }

    const submissionRef = doc(db, 'formSubmissions', submissionId);
    const submissionDoc = await getDoc(submissionRef);

    if (!submissionDoc.exists()) {
      return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissionDoc.data();

    return NextResponse.json({ 
      success: true, 
      submission: submission,
      documentUrl: submission.documentUrl,
      step3DocumentUrl: submission.step3?.documentUrl,
      allKeys: Object.keys(submission),
      step3Keys: submission.step3 ? Object.keys(submission.step3) : null
    });

  } catch (error) {
    console.error('Error in debug-submission API route:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get submission data', 
      details: error.message 
    }, { status: 500 });
  }
}
