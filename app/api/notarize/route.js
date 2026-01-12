import { NextResponse } from 'next/server';
import { db } from '@/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { PDFDocument, rgb } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';

async function uploadToCloudinary(fileBuffer) {
  try {
    // Create a FormData object for the upload
    const formData = new FormData();
    
    // Create a blob from the buffer
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    
    // Append the blob as a file
    formData.append('file', blob, 'stamped-document.pdf');
    formData.append('upload_preset', 'WiScribbles');
    formData.append('folder', 'approvedDocuments');
    formData.append('resource_type', 'raw');
    formData.append('access_mode', 'public'); // Ensure public access
    
    console.log('Uploading PDF to Cloudinary...');
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dgyv432jt/raw/upload`,
      {
        method: 'POST',
        body: formData, // Don't set Content-Type header, let FormData handle it
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary upload failed:', errorText);
      throw new Error(`Cloudinary upload failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Cloudinary upload successful:', data.secure_url);
    
    // Use the secure_url directly - it should be publicly accessible since we set access_mode to public
    return data.secure_url;
  } catch (error) {
    console.error('Error in uploadToCloudinary:', error);
    throw error;
  }
}

async function addFooterToPDF(pdfUrl, footerText) {
  try {
    console.log('Attempting to fetch PDF from:', pdfUrl);
    
    // Add headers to handle potential CORS issues
    const response = await fetch(pdfUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf,*/*',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF from Cloudinary: ${response.status} ${response.statusText}`);
    }
    
    console.log('PDF fetched successfully, processing...');
    const pdfBytes = await response.arrayBuffer();
    console.log('PDF bytes length:', pdfBytes.byteLength);
    
    if (pdfBytes.byteLength === 0) {
      throw new Error('PDF file is empty or corrupted');
    }
    
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    console.log('PDF loaded successfully, pages count:', pages.length);
    
    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      
      // Add footer text
      page.drawText(footerText, {
        x: 30,
        y: 30,
        size: 8,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      // Add page number
      const pageNumberText = `Page ${index + 1} of ${pages.length}`;
      page.drawText(pageNumberText, {
        x: width - 80,
        y: 15,
        size: 8,
        color: rgb(0.3, 0.3, 0.3),
      });
    });
    
    console.log('Footer and page numbers added, saving PDF...');
    const modifiedPdf = await pdfDoc.save();
    console.log('PDF modification completed successfully');
    
    return modifiedPdf;
  } catch (error) {
    console.error('Error in addFooterToPDF:', error);
    throw error;
  }
}

function generateReferenceNumber() {
  const prefix = 'WS';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
}

export async function POST(request) {
  try {
    const { submissionId, notaryId, notaryName } = await request.json();

    if (!submissionId) {
      return NextResponse.json({ success: false, error: 'Submission ID is required' }, { status: 400 });
    }

    const submissionRef = doc(db, 'formSubmissions', submissionId);
    const submissionDoc = await getDoc(submissionRef);

    if (!submissionDoc.exists()) {
      return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissionDoc.data();
    console.log('Submission data:', JSON.stringify(submission, null, 2));
    
    // The document URL should be in step3.documentUrl based on how Form2step3 saves it
    const originalDocUrl = submission.step3?.documentUrl || submission.documentUrl;
    console.log('Original document URL:', originalDocUrl);

    // Generate reference number
    const referenceNumber = generateReferenceNumber();
    const userName = `${submission.step1?.firstName || ''} ${submission.step1?.lastName || ''}`.trim() || 'User';
    // Check multiple possible fields for jurisdiction
    const jurisdiction = submission.step1?.jurisdiction || submission.step1?.jurisdictionOfDocumentUse || 'N/A';
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getFullYear()).slice(-2)}`;
    const signingOption = submission.step3?.signingOption || 'default';
    
    // Get notary information from the request
    const notaryNameForFooter = notaryName || 'Authorized Notary';
    
    console.log('Processing details:', {
      referenceNumber,
      userName,
      jurisdiction,
      formattedDate,
      signingOption,
      originalDocUrl
    });
    
    let approvedDocURL = null;
    
    // Always ensure we have some document URL to work with
    if (!originalDocUrl) {
      console.warn('No document URL found in submission. Setting approvedDocURL to null.');
      approvedDocURL = null;
    } else {
      console.log('=== STARTING PDF PROCESSING ===');
      console.log('Original document URL:', originalDocUrl);
      console.log('Document type check - is PDF?', originalDocUrl.toLowerCase().includes('.pdf'));
      
      // If the document is a PDF, process it with footer and page numbers
      try {
        if (originalDocUrl.toLowerCase().includes('.pdf')) {
          console.log('✓ PDF detected, starting processing...');
          
          let footerText = '';
          if (signingOption === 'esign') {
            footerText = `This document has been executed by ${userName} for use in the ${jurisdiction} through www.wiscribbles.com on ${formattedDate}, under reference number ${referenceNumber}`;
          } else {
            footerText = `This document has been executed by ${userName} for use in the ${jurisdiction} and duly notarized by ${notaryNameForFooter}, a commissioned notary public of ${jurisdiction}, through www.wiscribbles.com on ${formattedDate}, under reference number ${referenceNumber}`;
          }
          
          console.log('Footer text to be added:', footerText);
          console.log('About to call addFooterToPDF...');
          
          const modifiedPdfBytes = await addFooterToPDF(originalDocUrl, footerText);
          console.log('✓ PDF modification completed, modified size:', modifiedPdfBytes.byteLength);
          
          console.log('About to upload to Cloudinary...');
          approvedDocURL = await uploadToCloudinary(modifiedPdfBytes);
          
          console.log('=== COMPARISON ===');
          console.log('Original URL:  ', originalDocUrl);
          console.log('Approved URL:  ', approvedDocURL);
          console.log('URLs are same: ', originalDocUrl === approvedDocURL);
          console.log('=== END COMPARISON ===');
          
          if (originalDocUrl === approvedDocURL) {
            console.error('⚠️  WARNING: Approved URL is same as original URL - upload may have failed!');
          } else {
            console.log('✓ PDF processed successfully with new URL');
          }
        } else {
          // For non-PDF documents, use the original URL
          console.log('Document is not a PDF, using original URL');
          approvedDocURL = originalDocUrl;
        }
      } catch (pdfError) {
        console.error('=== PDF PROCESSING FAILED ===');
        console.error('Error details:', pdfError);
        console.error('Stack trace:', pdfError.stack);
        console.error('Using original document URL as fallback');
        console.error('=== END ERROR ===');
        // Fallback to original document URL if PDF processing fails
        approvedDocURL = originalDocUrl;
      }
    }
    
    console.log('=== FINAL RESULT ===');
    console.log('Final approvedDocURL:', approvedDocURL);
    console.log('Will be saved to Firebase:', approvedDocURL);

    // Update the submission document with approval data
    const updateData = {
      status: 'approved',
      referenceNumber: referenceNumber,
      approvedAt: new Date().toISOString(),
      approvedBy: {
        id: notaryId || 'system',
        name: notaryName || 'System'
      },
      approvedDocURL: approvedDocURL
    };

    await updateDoc(submissionRef, updateData);

    return NextResponse.json({ 
      success: true, 
      referenceNumber,
      approvedDocURL,
      message: 'Document notarized successfully'
    });

  } catch (error) {
    console.error('Error in notarize API route:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to notarize document', 
      details: error.message 
    }, { status: 500 });
  }
}
