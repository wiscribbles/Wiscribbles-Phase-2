import { NextResponse } from 'next/server';
import { requireNotary } from '@/lib/serverAuth';
import { isTrustedDocumentUrl } from '@/lib/apiUtils';
import { adminDb } from '@/lib/firebaseAdmin';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

async function uploadToCloudinary(fileBuffer, fileName = 'notarized_document') {
  try {
    // Convert buffer to base64 for upload
    const base64Data = Buffer.from(fileBuffer).toString('base64');
    const dataURI = `data:application/pdf;base64,${base64Data}`;
    
    console.log('Uploading notarized PDF to Cloudinary, size:', fileBuffer.length, 'bytes');

    const uploadData = {
      file: dataURI,
      upload_preset: 'wiscribbles',
      folder: 'notarized-documents',
      resource_type: 'raw',
      public_id: `${fileName}_${Date.now()}.pdf`
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

async function addNotaryStampToPDF(pdfUrl, notaryInfo, clientInfo, acknowledgmentData, notarySignatures = []) {
  console.log('Fetching PDF from URL:', pdfUrl);
  console.log('Notary Info:', notaryInfo);
  console.log('Client Info:', clientInfo);
  console.log('Interactive Signatures to place:', notarySignatures);
  
  if (!isTrustedDocumentUrl(pdfUrl)) throw new Error('Untrusted document URL');
  // Fetch the PDF
  const response = await fetch(pdfUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status}`);
  }
  
  const pdfBytes = await response.arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  
  // Load a standard font
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Try to load the logo image for watermark
  let logoImage = null;
  try {
    // Load the logo from public directory
    const logoPath = path.join(process.cwd(), 'public', 'assets', 'images', 'logos', 'logo.png');
    console.log('Loading logo from:', logoPath);
    
    const logoBytes = await fs.readFile(logoPath);
    logoImage = await pdfDoc.embedPng(logoBytes);
    console.log('Logo loaded successfully');
  } catch (error) {
    console.log('Could not load logo image:', error.message);
    // Continue without logo if it fails
  }
  
  // Generate reference number if not exists
  const referenceNumber = notaryInfo.referenceNumber || `WISS-NOT-${uuidv4().slice(0, 8).toUpperCase()}`;
  
  // Format dates - DD-MM-YY format
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  }).replace(/\//g, '-'); // Convert slashes to dashes
  
  // Create notary stamp text with the specified format
  const notaryStampText = `This document has been executed by ${clientInfo.clientName} for use in the ${notaryInfo.jurisdiction || 'jurisdiction'}
and duly notarized by ${notaryInfo.notaryName}, a commissioned notary public of
${notaryInfo.jurisdiction || 'jurisdiction'}, through www.wiscribbles.com on ${formattedDate}, under reference
number ${referenceNumber}`;
  
  // Add stamp to each page
  pages.forEach((page, index) => {
    const { width, height } = page.getSize();
    
    // Add logo watermark to ALL pages - Enhanced visibility
    if (logoImage) {
      // Calculate logo dimensions for watermark - consistent size on all pages
      const logoWidth = 180; // Consistent size for all pages
      const logoAspectRatio = logoImage.width / logoImage.height;
      const logoHeight = logoWidth / logoAspectRatio;
      
      // Position logo in center of page
      const logoX = (width - logoWidth) / 2;
      const logoY = (height - logoHeight) / 2;
      
      // Draw semi-transparent logo watermark on ALL pages
      page.drawImage(logoImage, {
        x: logoX,
        y: logoY,
        width: logoWidth,
        height: logoHeight,
        opacity: 0.12,  // Consistent visibility on all pages
      });
      
      
      // Add notary details below the logo watermark (first page only)
      if (index === 0) {
        const textY = logoY - 30;
        
        // Center-aligned notary information
        const notaryNameWidth = notaryInfo.notaryName ? notaryInfo.notaryName.length * 7 : 80;
        page.drawText(notaryInfo.notaryName || 'Notary Public', {
          x: (width - notaryNameWidth) / 2,
          y: textY,
          size: 14,
          font: helveticaBold,
          color: rgb(0.15, 0.25, 0.45),
          opacity: 0.3,
        });
        
        const jurisdictionWidth = (notaryInfo.jurisdiction || 'Jurisdiction').length * 6;
        page.drawText(notaryInfo.jurisdiction || 'Jurisdiction', {
          x: (width - jurisdictionWidth) / 2,
          y: textY - 20,
          size: 12,
          font: helveticaFont,
          color: rgb(0.15, 0.25, 0.45),
          opacity: 0.3,
        });
        
        const commissionText = `Commission: ${notaryInfo.commissionNumber || 'PENDING'}`;
        const commissionWidth = commissionText.length * 5;
        page.drawText(commissionText, {
          x: (width - commissionWidth) / 2,
          y: textY - 35,
          size: 10,
          font: helveticaFont,
          color: rgb(0.15, 0.25, 0.45),
          opacity: 0.3,
        });
        
        // Add "NOTARIZED" text overlay
        page.drawText('NOTARIZED', {
          x: width / 2 - 60,
          y: textY - 55,
          size: 20,
          font: helveticaBold,
          color: rgb(0.2, 0.4, 0.6),
          opacity: 0.25,
        });
      }
    } else {
      // Fallback to text-only watermark if logo is not available
      if (index === 0) {
        page.drawText('NOTARIZED', {
          x: width / 2 - 100,
          y: height / 2,
          size: 60,
          font: helveticaBold,
          color: rgb(0.8, 0.1, 0.1),
          opacity: 0.2,
          rotate: degrees(45)
        });
      }
    }
    
    // Add notary stamp text at the bottom
    const lines = notaryStampText.split('\n');
    let yPosition = 40; // Slightly higher to accommodate 4 lines
    
    lines.forEach((line, lineIndex) => {
      page.drawText(line.trim(), {
        x: 30,
        y: yPosition - (lineIndex * 10),
        size: 7,
        font: helveticaFont,
        color: rgb(0.2, 0.2, 0.2),
      });
    });
    
    // Add page number
    const pageNumberText = `Page ${index + 1} of ${pages.length}`;
    page.drawText(pageNumberText, {
      x: width - 80,
      y: 15,
      size: 7,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    // Additional elements for first page only
    if (index === 0) {
      
      // Add notary seal box on the first page (top right corner)
      const sealBoxX = width - 180;
      const sealBoxY = height - 100;
      const sealBoxWidth = 150;
      const sealBoxHeight = 70;
      
      // Draw seal border
      page.drawRectangle({
        x: sealBoxX,
        y: sealBoxY,
        width: sealBoxWidth,
        height: sealBoxHeight,
        borderColor: rgb(0, 0, 0.5),
        borderWidth: 2,
      });
      
      // Add notary seal text
      page.drawText('NOTARY PUBLIC', {
        x: sealBoxX + 25,
        y: sealBoxY + 50,
        size: 10,
        font: helveticaBold,
        color: rgb(0, 0, 0.5),
      });
      
      page.drawText(notaryInfo.notaryName || 'Notary Name', {
        x: sealBoxX + 15,
        y: sealBoxY + 35,
        size: 8,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(`Commission: ${notaryInfo.commissionNumber || 'PENDING'}`, {
        x: sealBoxX + 15,
        y: sealBoxY + 22,
        size: 7,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(notaryInfo.jurisdiction || 'Jurisdiction', {
        x: sealBoxX + 15,
        y: sealBoxY + 10,
        size: 7,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      
      // Add signature lines on first page
      const signatureY = 120;
      
      // Client signature line
      page.drawLine({
        start: { x: 50, y: signatureY },
        end: { x: 250, y: signatureY },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      
      page.drawText('Client Signature', {
        x: 50,
        y: signatureY - 15,
        size: 8,
        font: helveticaFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      page.drawText(clientInfo.clientName || 'Client Name', {
        x: 50,
        y: signatureY + 5,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      
      // Notary signature line
      page.drawLine({
        start: { x: 300, y: signatureY },
        end: { x: 500, y: signatureY },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      
      page.drawText('Notary Signature', {
        x: 300,
        y: signatureY - 15,
        size: 8,
        font: helveticaFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      page.drawText(notaryInfo.notaryName || 'Notary Name', {
        x: 300,
        y: signatureY + 5,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
    }
    
    // Add interactive signatures if provided
    if (notarySignatures && notarySignatures.length > 0) {
      console.log(`Processing ${notarySignatures.length} interactive signatures for page ${index + 1}`);
      
      // Filter signatures for this page
      const pageSignatures = notarySignatures.filter(sig => sig.page === (index + 1));
      
      pageSignatures.forEach(signature => {
        console.log(`Placing signature "${signature.text}" at (${signature.x}, ${signature.y}) on page ${signature.page}`);
        
        // Convert relative coordinates (0-1) to absolute coordinates
        const absoluteX = signature.x * width;
        const absoluteY = signature.y * height;
        
        // Draw signature background box
        const textWidth = helveticaFont.widthOfTextAtSize(signature.text, 12);
        const padding = 8;
        
        page.drawRectangle({
          x: absoluteX - padding,
          y: absoluteY - padding,
          width: textWidth + (padding * 2),
          height: 20,
          color: rgb(0.15, 0.25, 0.45),
          opacity: 0.9,
        });
        
        // Draw signature text in cursive style
        page.drawText(signature.text, {
          x: absoluteX,
          y: absoluteY,
          size: 12,
          font: helveticaBold,
          color: rgb(1, 1, 1), // White text
        });
        
        // Add small timestamp below signature
        const timestamp = new Date(signature.timestamp).toLocaleDateString();
        page.drawText(`Signed: ${timestamp}`, {
          x: absoluteX,
          y: absoluteY - 15,
          size: 6,
          font: helveticaFont,
          color: rgb(0.3, 0.3, 0.3),
        });
      });
    }
  });
  
  // Add acknowledgment section if data is provided
  if (acknowledgmentData && acknowledgmentData.acknowledgmentText) {
    console.log('Adding acknowledgment section to PDF');
    
    // Add a new page for the acknowledgment
    const acknowledgmentPage = pdfDoc.addPage();
    const { width, height } = acknowledgmentPage.getSize();
    
    // Title
    acknowledgmentPage.drawText('NOTARY ACKNOWLEDGMENT', {
      x: width / 2 - 100,
      y: height - 80,
      size: 16,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    
    // Add acknowledgment details
    let yPosition = height - 120;
    
    // State and County
    if (acknowledgmentData.notaryState || acknowledgmentData.notaryCounty) {
      acknowledgmentPage.drawText(`State of ${acknowledgmentData.notaryState || '[STATE]'}`, {
        x: 50,
        y: yPosition,
        size: 11,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
      
      acknowledgmentPage.drawText(`County of ${acknowledgmentData.notaryCounty || '[COUNTY]'}`, {
        x: 50,
        y: yPosition,
        size: 11,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;
    }
    
    // Acknowledgment text (break into lines)
    const acknowledgmentLines = acknowledgmentData.acknowledgmentText.split('\n');
    const maxLineWidth = width - 100; // Leave margins
    const lineHeight = 14;
    
    acknowledgmentLines.forEach(line => {
      // Break long lines
      const words = line.split(' ');
      let currentLine = '';
      
      words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const textWidth = helveticaFont.widthOfTextAtSize(testLine, 10);
        
        if (textWidth > maxLineWidth && currentLine) {
          // Draw current line and start new one
          acknowledgmentPage.drawText(currentLine, {
            x: 50,
            y: yPosition,
            size: 10,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
          yPosition -= lineHeight;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      
      // Draw remaining text
      if (currentLine) {
        acknowledgmentPage.drawText(currentLine, {
          x: 50,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      }
      yPosition -= 5; // Extra space between paragraphs
    });
    
    // Add notary information
    yPosition -= 20;
    
    if (acknowledgmentData.notaryName) {
      acknowledgmentPage.drawText(`Notary Public: ${acknowledgmentData.notaryName}`, {
        x: 50,
        y: yPosition,
        size: 11,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
    }
    
    if (acknowledgmentData.notaryCommissionNumber) {
      acknowledgmentPage.drawText(`Commission Number: ${acknowledgmentData.notaryCommissionNumber}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
    }
    
    if (acknowledgmentData.notaryCommissionExpiry) {
      acknowledgmentPage.drawText(`Commission Expires: ${acknowledgmentData.notaryCommissionExpiry}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
    }
    
    // Add signature line for notary
    yPosition -= 30;
    acknowledgmentPage.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: 250, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    
    acknowledgmentPage.drawText('Notary Signature and Seal', {
      x: 50,
      y: yPosition - 15,
      size: 8,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    // Add date
    acknowledgmentPage.drawText(`Date: ${acknowledgmentData.notarizationDate || new Date().toLocaleDateString()}`, {
      x: 300,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    // Add witness section if witnesses are provided
    if (acknowledgmentData.witnessName1 || acknowledgmentData.witnessName2) {
      yPosition -= 50;
      acknowledgmentPage.drawText('WITNESSES:', {
        x: 50,
        y: yPosition,
        size: 11,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      yPosition -= 25;
      
      if (acknowledgmentData.witnessName1) {
        acknowledgmentPage.drawLine({
          start: { x: 50, y: yPosition },
          end: { x: 250, y: yPosition },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
        acknowledgmentPage.drawText(`Witness 1: ${acknowledgmentData.witnessName1}`, {
          x: 50,
          y: yPosition - 15,
          size: 9,
          font: helveticaFont,
          color: rgb(0.3, 0.3, 0.3),
        });
        if (acknowledgmentData.witnessAddress1) {
          acknowledgmentPage.drawText(`Address: ${acknowledgmentData.witnessAddress1}`, {
            x: 50,
            y: yPosition - 28,
            size: 8,
            font: helveticaFont,
            color: rgb(0.3, 0.3, 0.3),
          });
        }
      }
      
      if (acknowledgmentData.witnessName2) {
        yPosition -= 50;
        acknowledgmentPage.drawLine({
          start: { x: 300, y: yPosition + 50 },
          end: { x: 500, y: yPosition + 50 },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
        acknowledgmentPage.drawText(`Witness 2: ${acknowledgmentData.witnessName2}`, {
          x: 300,
          y: yPosition + 35,
          size: 9,
          font: helveticaFont,
          color: rgb(0.3, 0.3, 0.3),
        });
        if (acknowledgmentData.witnessAddress2) {
          acknowledgmentPage.drawText(`Address: ${acknowledgmentData.witnessAddress2}`, {
            x: 300,
            y: yPosition + 22,
            size: 8,
            font: helveticaFont,
            color: rgb(0.3, 0.3, 0.3),
          });
        }
      }
    }
  }

  return await pdfDoc.save();
}


export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request) {
  const { error: authError } = await requireNotary(request);
  if (authError) return authError;

  console.log('=== Notary Stamp PDF API Called ===');
  
  try {
    const body = await request.json();
    console.log('Request body received:', JSON.stringify(body, null, 2));
    
    const { 
      sessionId, 
      documentUrl, 
      notaryName, 
      notaryId,
      notaryCommissionNumber,
      clientName,
      clientId,
      jurisdiction,
      documentType,
      acknowledgmentData,
      notarySignatures 
    } = body;
    
    console.log('Processing notarization request:', {
      sessionId,
      notaryName,
      clientName,
      jurisdiction,
      documentType
    });

    if (!documentUrl) {
      console.error('ERROR: No document URL provided');
      return NextResponse.json({ 
        success: false, 
        error: 'No document URL provided',
        details: 'documentUrl field is missing or empty in request'
      }, { status: 400 });
    }
    
    console.log('Document URL to process:', documentUrl);

    // Prepare notary and client information
    const notaryInfo = {
      notaryName: notaryName || 'Authorized Notary',
      notaryId: notaryId,
      commissionNumber: notaryCommissionNumber || 'COMM-2024-001', // Default commission number
      jurisdiction: jurisdiction || 'Not Specified',
      referenceNumber: sessionId ? `WISS-NOT-${sessionId.slice(-8).toUpperCase()}` : null
    };
    
    const clientInfo = {
      clientName: clientName || 'Client',
      clientId: clientId
    };

    try {
      console.log('Adding notary stamp to PDF...');
      const modifiedPdfBytes = await addNotaryStampToPDF(documentUrl, notaryInfo, clientInfo, body.acknowledgmentData, notarySignatures);
      console.log('PDF notarized successfully, uploading to Cloudinary...');
      
      const notarizedDocUrl = await uploadToCloudinary(modifiedPdfBytes, 'notarized_document');
      console.log('Notarized document uploaded:', notarizedDocUrl);

      // If sessionId is provided, update the session/submission in Firebase
      if (sessionId) {
        try {
          // All notary sessions are stored in formSubmissions collection
          const submissionRef = adminDb.collection('formSubmissions').doc(sessionId);
          const submissionDoc = await submissionRef.get();
          
          if (submissionDoc.exists) {
            // Update with notarized document information
            await submissionRef.update({
              notarizedDocURL: notarizedDocUrl,
              notarizedAt: new Date().toISOString(),
              notarizedBy: notaryId,
              notaryName: notaryName,
              notaryCommissionNumber: notaryInfo.commissionNumber,
              status: 'notarized',
              referenceNumber: notaryInfo.referenceNumber,
              // Store acknowledgment data
              acknowledgmentData: acknowledgmentData || null,
              // Also update nested document object for consistency
              'document.notarizedUrl': notarizedDocUrl,
              'document.status': 'notarized',
              'document.notarizedAt': new Date().toISOString(),
              'document.notarizedBy': notaryId,
              'document.acknowledgmentData': acknowledgmentData || null
            });
            console.log('Form submission updated with notarized document:', sessionId);
            console.log('Notarized document URL saved:', notarizedDocUrl);
          } else {
            console.warn('No document found with ID:', sessionId);
            // Continue anyway - the document is still notarized
          }
        } catch (updateError) {
          console.error('Error updating Firebase document:', updateError);
          // Continue even if update fails - the notarized document is still available
        }
      }

      return NextResponse.json({ 
        success: true, 
        notarizedDocURL: notarizedDocUrl,
        referenceNumber: notaryInfo.referenceNumber,
        message: 'Document successfully notarized'
      });

    } catch (error) {
      console.error('ERROR in notarization process:', error);
      console.error('Error stack:', error.stack);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to notarize document',
        details: error.message || 'Unknown error in notarization process'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('CRITICAL ERROR in notary-stamp-pdf API:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message || 'Critical error occurred'
    }, { status: 500 });
  }
}
