
import { requireUser } from '@/lib/serverAuth';
import { isTrustedDocumentUrl } from '@/lib/apiUtils';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';

async function uploadToCloudinary(fileBuffer) {
  try {
    // Convert buffer to base64 for upload
    const base64Data = Buffer.from(fileBuffer).toString('base64');
    const dataURI = `data:application/pdf;base64,${base64Data}`;
    
    console.log('Uploading PDF to Cloudinary, size:', fileBuffer.length, 'bytes');

    const uploadData = {
      file: dataURI,
      upload_preset: 'wiscribbles',
      folder: 'stamped-documents',
      resource_type: 'raw',
      public_id: `signed_document_${Date.now()}.pdf`
    };

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dgyv432jt/raw/upload`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary response not ok:', response.status, errorText);
      throw new Error(`Cloudinary upload failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Cloudinary upload successful:', data.secure_url);
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
  }
}

async function addFooterToPDF(pdfUrl, footerText, userSignatures = []) {
  console.log('Fetching PDF from URL:', pdfUrl);
  console.log('User signatures to place:', userSignatures);
  
  // Validate URL format
  if (!pdfUrl || typeof pdfUrl !== 'string') {
    throw new Error('Invalid PDF URL provided');
  }
  
  // Add retry logic for fetch
  if (!isTrustedDocumentUrl(pdfUrl)) throw new Error('Untrusted document URL');
  let lastError;
  let response;
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      response = await fetch(pdfUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf,*/*',
          'User-Agent': 'Mozilla/5.0 (compatible; WiScribbles-PDF-Processor/1.0)',
          'Cache-Control': 'no-cache',
        },
        // Add timeout
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });
      
      console.log(`PDF fetch attempt ${attempt} - status:`, response.status);
      console.log('PDF fetch response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details available');
        console.error('PDF fetch failed:', {
          attempt,
          status: response.status,
          statusText: response.statusText,
          url: pdfUrl,
          errorText
        });
        
        if (response.status === 404) {
          throw new Error('PDF document not found. The document may have been moved or deleted.');
        } else if (response.status === 403) {
          throw new Error('Access denied to PDF document. Please check document permissions.');
        } else {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
      }
      
      // Successful response, break out of retry loop
      break;
      
    } catch (error) {
      lastError = error;
      console.warn(`PDF fetch attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to fetch PDF after ${maxRetries} attempts. Last error: ${lastError.message}`);
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  const pdfBytes = await response.arrayBuffer();
  console.log('PDF bytes received:', pdfBytes.byteLength);
  
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  
  // Load fonts for signatures
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  pages.forEach((page, index) => {
    const { width, height } = page.getSize();
    
    // Add user signatures if provided
    if (userSignatures && userSignatures.length > 0) {
      console.log(`Processing ${userSignatures.length} user signatures for page ${index + 1}`);
      
      // Filter signatures for this page
      const pageSignatures = userSignatures.filter(sig => sig.page === (index + 1));
      
      pageSignatures.forEach(signature => {
        console.log(`Placing signature "${signature.text}" at (${signature.x}, ${signature.y}) on page ${signature.page}`);
        
        // Convert relative coordinates (0-1) to absolute coordinates
        const absoluteX = signature.x * width;
        const absoluteY = signature.y * height;
        
        // Calculate signature dimensions
        const signatureSize = 16;
        const textWidth = helveticaBold.widthOfTextAtSize(signature.text, signatureSize);
        const padding = 10;
        const boxHeight = 28;
        
        // Ensure signature doesn't go off page edges
        const minX = Math.max(padding, absoluteX - textWidth/2);
        const maxX = Math.min(width - textWidth - padding, minX);
        const finalX = Math.max(padding, maxX);
        const finalY = Math.max(boxHeight, Math.min(height - boxHeight, absoluteY));
        
        // Draw signature background box
        page.drawRectangle({
          x: finalX - padding,
          y: finalY - padding,
          width: textWidth + (padding * 2),
          height: boxHeight,
          color: rgb(0.15, 0.25, 0.45), // Brand blue background
          opacity: 1.0, // Full opacity for better visibility
        });
        
        // Draw signature text
        page.drawText(signature.text, {
          x: finalX,
          y: finalY + 2, // Center vertically in box
          size: signatureSize,
          font: helveticaBold,
          color: rgb(1, 1, 1), // White text
        });
        
        // Add small timestamp below signature box
        const timestamp = new Date(signature.timestamp).toLocaleDateString();
        page.drawText(`Signed: ${timestamp}`, {
          x: finalX,
          y: finalY - padding - 8,
          size: 7,
          font: helveticaFont,
          color: rgb(0.2, 0.2, 0.2),
        });
      });
    }
    
    // Add footer text
    page.drawText(footerText, {
      x: 30,
      y: 30,
      size: 8,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    // Add page numbers
    const pageNumberText = `Page ${index + 1} of ${pages.length}`;
    page.drawText(pageNumberText, {
      x: width - 80,
      y: 15,
      size: 8,
      color: rgb(0.3, 0.3, 0.3),
    });
  });

  return await pdfDoc.save();
}


export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request) {
  const { error: authError } = await requireUser(request);
  if (authError) return authError;

  try {
    const { submissionId, userSignatures } = await request.json();
    console.log('Processing submission ID:', submissionId);
    console.log('User signatures received:', userSignatures);

    if (!submissionId) {
      return NextResponse.json({ success: false, error: 'Submission ID is required' }, { status: 400 });
    }

    const submissionRef = adminDb().collection('formSubmissions').doc(submissionId);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissionDoc.data();
    console.log('Submission data:', submission);
    
    const originalDocUrl = submission.documentUrl;
    console.log('Original document URL:', originalDocUrl);

    if (!originalDocUrl) {
      return NextResponse.json({ 
        success: false, 
        error: 'No document URL found in submission. Please upload a document first.' 
      }, { status: 400 });
    }

    if (!originalDocUrl.toLowerCase().includes('.pdf')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Document is not a PDF file. Only PDF files can be stamped.' 
      }, { status: 400 });
    }

    // Generate reference number if not exists
    const referenceNumber = submission.referenceNumber || `WISS-${uuidv4().slice(0, 8)}`;
    console.log('Reference number:', referenceNumber);
    
    const userName = `${submission.step1?.firstName || ''} ${submission.step1?.lastName || ''}`.trim() || 'User';
    const jurisdiction = submission.step1?.jurisdictionOfDocumentUse || 'N/A';
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getFullYear()).slice(-2)}`;
    const signingOption = submission.step3?.signingOption || 'default';
    
    console.log('User info:', { userName, jurisdiction, signingOption });
    
    let footerText = '';
    if (signingOption === 'esign') {
      footerText = `This document has been executed by ${userName} for use in the ${jurisdiction} through www.wiscribbles.com on ${formattedDate}, under reference number ${referenceNumber}`;
    } else {
      footerText = `This document was processed by WiScribbles on ${formattedDate}. Reference Number: ${referenceNumber}`;
    }
    
    console.log('Footer text:', footerText);

    try {
      console.log('Adding footer and signatures to PDF...');
      const modifiedPdfBytes = await addFooterToPDF(originalDocUrl, footerText, userSignatures);
      console.log('PDF modified successfully, uploading to Cloudinary...');
      
      const approvedDocURL = await uploadToCloudinary(modifiedPdfBytes);
      console.log('Uploaded to Cloudinary:', approvedDocURL);

      // Update Firebase with both the approved URL and reference number
      const updateData = {
        approvedDocURL: approvedDocURL,
        referenceNumber: referenceNumber,
        signedAt: new Date().toISOString()
      };
      
      // Include signature information if signatures were placed
      if (userSignatures && userSignatures.length > 0) {
        updateData.userSignatures = userSignatures;
        updateData.signatureMethod = 'interactive';
        updateData.signatureCount = userSignatures.length;
      } else {
        updateData.signatureMethod = 'default';
        updateData.signatureCount = 0;
      }
      
      await submissionRef.update(updateData);
      
      console.log('Firebase updated successfully');

      return NextResponse.json({ 
        success: true, 
        approvedDocURL,
        referenceNumber,
        message: 'Document stamped and saved successfully'
      });
    } catch (pdfError) {
      console.error('PDF processing error:', pdfError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to process PDF document',
        details: pdfError.message 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in stamp-pdf API route:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to stamp and save PDF', 
      details: error.message 
    }, { status: 500 });
  }
}

