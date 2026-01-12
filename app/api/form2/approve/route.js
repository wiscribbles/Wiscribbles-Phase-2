import { NextResponse } from 'next/server';
import { db } from '@/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Resend } from 'resend';
import { PDFDocument, rgb } from 'pdf-lib';

const resend = new Resend(process.env.RESEND_API_KEY);

function generateReferenceNumber() {
  const prefix = 'WS';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
}

// Function to process and upload approved document to approvedDocument folder
async function processAndUploadApprovedDocument(originalUrl, footerText, signingOption, referenceNumber, submissionData) {
  try {
    console.log('Processing approved document:', originalUrl);
    
    // Download the original document from Cloudinary
    const response = await fetch(originalUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`);
    }
    
    const pdfBytes = await response.arrayBuffer();
    
    // Load and modify the PDF
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    // Add annotations to each page
    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      
      // Add footer text with approval info
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
      
      // Add signing method indicator with proper legal text
      let signingText = '';
      const userName = `${submissionData.step1?.firstName || ''} ${submissionData.step1?.lastName || ''}`.trim() || 'User';
      const jurisdiction = submissionData.step1?.state || submissionData.step1?.country || 'N/A';
      const approvedDate = new Date().toLocaleDateString('en-GB'); // DD-MM-YY format
      
      if (signingOption === 'esign') {
        // For e-sign, use the detailed legal format
        signingText = `This document has been executed by ${userName} for use in the ${jurisdiction} through www.wiscribbles.com on ${approvedDate}, under reference number ${referenceNumber}`;
      } else {
        // For notary, use the detailed legal format with notary information
        const notaryName = submissionData.approvedBy?.name || 'Notary';
        
        signingText = `This document has been executed by ${userName} for use in the ${jurisdiction} and duly notarized by ${notaryName}, a commissioned notary public of ${jurisdiction}, through www.wiscribbles.com on ${approvedDate}, under reference number ${referenceNumber}`;
      }
      
      // Split long text into multiple lines if it's too long
      const maxWidth = width - 60; // Leave margins
      const words = signingText.split(' ');
      const lines = [];
      let currentLine = '';
      
      words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = testLine.length * 6; // Approximate character width
        
        if (textWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      // Draw each line
      lines.forEach((line, lineIndex) => {
        page.drawText(line, {
          x: 30,
          y: height - 30 - (lineIndex * 12), // Stack lines vertically
          size: 8,
          color: rgb(0.2, 0.2, 0.8),
        });
      });
      
      // Add reference number at top right
      page.drawText(`Ref: ${referenceNumber}`, {
        x: width - 120,
        y: height - 30,
        size: 10,
        color: rgb(0.2, 0.2, 0.8),
      });
      
      // Add approval stamp/watermark in center
      page.drawText('APPROVED', {
        x: width / 2 - 40,
        y: height / 2,
        size: 24,
        color: rgb(0.8, 0.2, 0.2),
        opacity: 0.3,
      });
    });
    
    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    
    // Upload to Cloudinary directly to approvedDocument folder
    const formData = new FormData();
    const uniqueFilename = `approved_${referenceNumber}_${Date.now()}`;
    const timestamp = Math.floor(Date.now() / 1000);
    
    formData.append('file', new Blob([modifiedPdfBytes], { type: 'application/pdf' }));
    formData.append('public_id', `approvedDocument/${uniqueFilename}`);
    formData.append('resource_type', 'raw');
    formData.append('timestamp', timestamp.toString());
    
    // Create signature for authenticated upload (you'll need to add your API secret)
    // For now, let's try with upload preset but force the folder
    formData.append('upload_preset', 'wiscribbles');
    formData.append('folder', 'approvedDocument');
    
    console.log('Uploading to Cloudinary with:');
    console.log('- public_id: approvedDocument/' + uniqueFilename);
    console.log('- folder: approvedDocument');
    console.log('- resource_type: raw');
    
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/dgyv432jt/raw/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(`Failed to upload approved document: ${JSON.stringify(errorData)}`);
    }
    
    const uploadData = await uploadResponse.json();
    console.log('Approved document uploaded successfully:', uploadData.secure_url);
    return uploadData.secure_url;
    
  } catch (error) {
    console.error('Error in processAndUploadApprovedDocument:', error);
    throw error;
  }
}

export async function POST(request) {
  try {
    const { submissionId, approved, notaryId, notaryName } = await request.json();

    // Get the submission document
    const submissionRef = doc(db, 'formSubmissions', submissionId);
    const submissionDoc = await getDoc(submissionRef);

    if (!submissionDoc.exists()) {
      return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissionDoc.data();
    const status = approved ? 'approved' : 'rejected';
    let referenceNumber = null;

    // If approved, generate reference number and send email
    if (approved) {
      referenceNumber = generateReferenceNumber();
      
      try {
        // Send email notification
        await resend.emails.send({
          from: 'WiScribble <notifications@wiscribble.com>',
          to: submission.step1.email,
          subject: 'Your Document Has Been Approved',
          html: `
            <h1>Document Approval Notification</h1>
            <p>Dear ${submission.step1.firstName} ${submission.step1.lastName},</p>
            <p>Your document has been approved by our notary team.</p>
            <p><strong>Reference Number:</strong> ${referenceNumber}</p>
            <p><strong>Document Type:</strong> ${submission.step2.documentType}</p>
            <p>Please keep this reference number for your records. You can use it to track your document status.</p>
            <p>Thank you for using WiScribble!</p>
          `
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Continue with the approval process even if email fails
      }
    }

    // Update the submission document
    const updateData = {
      status,
      referenceNumber: referenceNumber,
      approvedAt: new Date().toISOString(),
      approvedBy: {
        id: notaryId,
        name: notaryName
      }
    };

    // If approved and has documentUrl, process and upload to approvedDocuments folder
    if (approved && submission.step3?.documentUrl) {
      try {
        console.log('Processing document for approval:', submission.step3.documentUrl);
        // Process the document and upload to approvedDocuments folder
        const submissionWithApproval = {
          ...submission,
          approvedBy: {
            id: notaryId,
            name: notaryName
          }
        };
        
        const approvedDocURL = await processAndUploadApprovedDocument(
          submission.step3.documentUrl, 
          `Approved by ${notaryName} on ${new Date().toLocaleDateString()} - Ref: ${referenceNumber}`,
          submission.step3.signingOption || 'notary',
          referenceNumber,
          submissionWithApproval
        );
        updateData.approvedDocURL = approvedDocURL;
        console.log('Approved document URL set:', approvedDocURL);
      } catch (processError) {
        console.error('Error processing approved document:', processError);
        // If processing fails, still approve but without processed document
        updateData.approvedDocURL = null;
      }
    }

    await updateDoc(submissionRef, updateData);

    return NextResponse.json({ 
      success: true, 
      message: approved ? 'Document approved successfully' : 'Document rejected successfully',
      referenceNumber
    });

  } catch (error) {
    console.error('Error processing approval:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process approval' 
    }, { status: 500 });
  }
} 