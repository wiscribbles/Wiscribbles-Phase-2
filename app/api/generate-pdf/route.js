import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Helper function to fetch document form data from database
const fetchDocumentFormData = async (documentType, userId, sessionId) => {
  try {
    const identifier = userId || sessionId;
    if (!identifier) {
      console.warn('No userId or sessionId provided for fetching document form data');
      return {};
    }

    const documentFormId = `${identifier}_${documentType}`;
    console.log('Fetching document form data:', { documentFormId, documentType, userId: userId || 'anonymous' });

    const docRef = doc(db, 'documentForms', documentFormId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('Found document form data in database:', Object.keys(data.formData || {}));
      return data.formData || {};
    } else {
      console.log('No document form data found in database for:', documentFormId);
      return {};
    }
  } catch (error) {
    console.error('Error fetching document form data from database:', error);
    return {};
  }
};

// Helper function to upload PDF buffer to Cloudinary
const uploadPDFToCloudinary = async (pdfBuffer, fileName) => {
  try {
    const formData = new FormData();
    
    // Create a File object from the buffer
    const pdfFile = new File([pdfBuffer], fileName, { 
      type: 'application/pdf' 
    });
    
    formData.append('file', pdfFile);
    formData.append('upload_preset', 'wiscribbles');
    formData.append('cloud_name', 'dgyv432jt');
    formData.append('resource_type', 'raw');
    formData.append('folder', 'generated_documents');

    const response = await fetch('https://api.cloudinary.com/v1_1/dgyv432jt/raw/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed: ${response.status}`);
    }

    const result = await response.json();
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

// Generate Affidavit of Identity PDF using pdf-lib
const generateAffidavitOfIdentityPDF = async (pdfDoc, formData) => {
  const { personalInfo, documentFormData } = formData;
  
  // Add a page
  const page = pdfDoc.addPage([612, 792]); // US Letter size
  const { width, height } = page.getSize();
  
  // Load fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let yPosition = height - 50;
  const lineHeight = 15;
  const margin = 50;
  
  // Title
  page.drawText('AFFIDAVIT OF IDENTITY', {
    x: width / 2 - 100,
    y: yPosition,
    size: 18,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 40;

  // Introduction
  page.drawText(`I, the Affiant, being duly sworn, hereby affirm on ${documentFormData.affirmDate || '[DATE]'} that:`, {
    x: margin,
    y: yPosition,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });
  yPosition -= 25;

  // Personal Information
  const statements = [
    `• My legal name is ${documentFormData.affiantName || personalInfo.firstName + ' ' + personalInfo.lastName}.`,
    `• My date of birth is ${documentFormData.dateOfBirth || personalInfo.dateOfBirth}.`,
    '• I currently reside at the following address:',
    `  ${documentFormData.currentAddress || 'Address not provided'}`,
    `• My telephone number is: ${documentFormData.phoneNumber || 'Phone not provided'}`,
    '• I have presented to the notary public:'
  ];
  
  statements.forEach(statement => {
    page.drawText(statement, {
      x: margin,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
  });

  // Identification types
  const identifications = [];
  if (documentFormData.driversLicense) identifications.push("Driver's License");
  if (documentFormData.passport) identifications.push("Passport");
  if (documentFormData.identityCard) identifications.push("Identity Card");
  if (documentFormData.otherIdType && documentFormData.otherIdDescription) {
    identifications.push(`Other: ${documentFormData.otherIdDescription}`);
  }
  
  if (identifications.length > 0) {
    identifications.forEach(id => {
      page.drawText(`  [ ] ${id}`, {
        x: margin + 20,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
    });
  } else {
    page.drawText('  [No identification types specified]', {
      x: margin + 20,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
  }
  
  yPosition -= 10;

  // Legal statements
  const legalStatements = [
    '• I understand that false statements on this Affidavit may be punishable by the fullest extent of the law.',
    'Under penalty of perjury, I hereby declare and affirm that the Affidavit is signed by me and all its',
    'contents, to the best of my knowledge, are true and correct.'
  ];
  
  legalStatements.forEach(statement => {
    page.drawText(statement, {
      x: margin,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
  });
  
  yPosition -= 20;

  // Signature section
  page.drawText(`Affiant's Signature: ${documentFormData.affiantSignature || '_________________________'}`, {
    x: margin,
    y: yPosition,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });
  yPosition -= 20;
  
  page.drawText(`Date: ${documentFormData.signatureDate || '_____________'}`, {
    x: margin,
    y: yPosition,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });
  yPosition -= 40;

  // Notary section
  page.drawText('NOTARY ACKNOWLEDGEMENT', {
    x: width / 2 - 80,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 25;
  
  const notaryText = 'A notary public or other officer completing this certificate verifies only the identity of the individual';
  page.drawText(notaryText, {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  yPosition -= 12;
  
  page.drawText('who signed the document to which this certificate is attached.', {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  yPosition -= 25;

  const notaryFields = [
    'State of _______________',
    'County of _______________',
    '',
    'On [DATE] before me, [NOTARY\'S NAME], personally appeared [AFFIANT\'S NAME] who proved to me',
    'on the basis of satisfactory evidence to be the person whose name is subscribed to the within',
    'instrument and acknowledged to me that they executed the same in their authorized capacity.',
    '',
    'I certify under PENALTY OF PERJURY under the laws of the State of [STATE] that the',
    'foregoing paragraph is true and correct.',
    '',
    'WITNESS my hand and official seal.',
    '',
    'Signature ____________________________',
    '[Notary Public Seal]'
  ];
  
  notaryFields.forEach(field => {
    if (field) {
      page.drawText(field, {
        x: margin,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
    yPosition -= lineHeight;
  });
};

// Generate Last Will and Testament PDF using pdf-lib
const generateLastWillTestamentPDF = async (pdfDoc, formData) => {
  const { personalInfo, documentFormData } = formData;
  
  const page = pdfDoc.addPage([612, 792]); // US Letter size
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let yPosition = height - 50;
  const lineHeight = 15;
  const margin = 50;
  
  // Title
  page.drawText('LAST WILL AND TESTAMENT', {
    x: width / 2 - 120,
    y: yPosition,
    size: 18,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 30;
  
  page.drawText(`of ${documentFormData.testatorName || personalInfo.firstName + ' ' + personalInfo.lastName || '[Name]'}`, {
    x: width / 2 - 80,
    y: yPosition,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 40;
  
  // Opening declaration
  const openingText = `I, ${documentFormData.testatorName || '[Name]'}, resident in the City of ${documentFormData.testatorCity || '[City]'}, County of ${documentFormData.testatorCounty || '[County]'}, State of ${documentFormData.testatorState || '[State]'}, being of sound mind, do hereby make this my Last Will and Testament.`;
  
  const words = openingText.split(' ');
  let line = '';
  
  words.forEach(word => {
    const testLine = line + (line ? ' ' : '') + word;
    const testWidth = font.widthOfTextAtSize(testLine, 12);
    
    if (testWidth > width - 2 * margin && line) {
      page.drawText(line, { x: margin, y: yPosition, size: 12, font });
      yPosition -= lineHeight;
      line = word;
    } else {
      line = testLine;
    }
  });
  
  if (line) {
    page.drawText(line, { x: margin, y: yPosition, size: 12, font });
    yPosition -= lineHeight * 2;
  }
  
  // Personal Representative section
  page.drawText('I. PERSONAL REPRESENTATIVE', {
    x: margin,
    y: yPosition,
    size: 14,
    font: boldFont,
  });
  yPosition -= 25;
  
  page.drawText(`I nominate ${documentFormData.personalRepName || '[Personal Representative Name]'} as Personal Representative.`, {
    x: margin,
    y: yPosition,
    size: 12,
    font,
  });
  yPosition -= lineHeight * 2;
  
  // Beneficiaries section
  page.drawText('II. DISPOSITION OF PROPERTY', {
    x: margin,
    y: yPosition,
    size: 14,
    font: boldFont,
  });
  yPosition -= 25;
  
  if (documentFormData.beneficiary1Name) {
    page.drawText(`To ${documentFormData.beneficiary1Name}: ${documentFormData.beneficiary1Property || 'As specified'}`, {
      x: margin,
      y: yPosition,
      size: 12,
      font,
    });
    yPosition -= lineHeight;
  }
  
  if (documentFormData.beneficiary2Name) {
    page.drawText(`To ${documentFormData.beneficiary2Name}: ${documentFormData.beneficiary2Property || 'As specified'}`, {
      x: margin,
      y: yPosition,
      size: 12,
      font,
    });
    yPosition -= lineHeight;
  }
  
  yPosition -= 30;
  
  // Signature section
  page.drawText('IN WITNESS WHEREOF, I have executed this Will.', {
    x: margin,
    y: yPosition,
    size: 12,
    font,
  });
  yPosition -= 40;
  
  page.drawText(`Testator: ${documentFormData.testatorPrintedName || documentFormData.testatorName || '_________________________'}`, {
    x: margin,
    y: yPosition,
    size: 12,
    font,
  });
};

// Generate Power of Attorney PDF using pdf-lib
const generatePowerOfAttorneyPDF = async (pdfDoc, documentType, formData) => {
  const { personalInfo, documentFormData } = formData;
  
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let yPosition = height - 50;
  const lineHeight = 15;
  const margin = 50;
  
  // Title based on document type
  const titleMap = {
    'power-of-attorney': 'POWER OF ATTORNEY',
    'durable-financial-power-of-attorney': 'DURABLE FINANCIAL POWER OF ATTORNEY',
    'limited-special-power-of-attorney': 'LIMITED SPECIAL POWER OF ATTORNEY',
    'real-estate-power-of-attorney': 'REAL ESTATE POWER OF ATTORNEY'
  };
  
  const title = titleMap[documentType] || 'POWER OF ATTORNEY';
  
  page.drawText(title, {
    x: width / 2 - (title.length * 4),
    y: yPosition,
    size: 16,
    font: boldFont,
  });
  yPosition -= 40;
  
  // Principal information
  const principalName = documentFormData.principalName || personalInfo.firstName + ' ' + personalInfo.lastName || '[Principal Name]';
  const attorneyName = documentFormData.agentName || documentFormData.attorneyName || '[Attorney-in-Fact Name]';
  
  page.drawText(`I, ${principalName}, hereby designate ${attorneyName} as my attorney-in-fact.`, {
    x: margin,
    y: yPosition,
    size: 12,
    font,
  });
  yPosition -= 25;
  
  // Powers granted
  if (documentFormData.powersGranted) {
    page.drawText(`Powers Granted: ${documentFormData.powersGranted}`, {
      x: margin,
      y: yPosition,
      size: 12,
      font,
    });
    yPosition -= lineHeight;
  }
  
  // Duration/Type
  if (documentFormData.durationType || documentFormData.effectiveDateOption) {
    const durationType = documentFormData.durationType || documentFormData.effectiveDateOption;
    page.drawText(`Type: ${durationType}`, {
      x: margin,
      y: yPosition,
      size: 12,
      font,
    });
    yPosition -= lineHeight;
  }
  
  // Special instructions
  if (documentFormData.specificInstructions || documentFormData.specialInstructions) {
    yPosition -= 15;
    page.drawText('Special Instructions:', {
      x: margin,
      y: yPosition,
      size: 12,
      font: boldFont,
    });
    yPosition -= 15;
    
    const instructions = documentFormData.specificInstructions || documentFormData.specialInstructions;
    const instructionWords = instructions.split(' ');
    let instructionLine = '';
    
    instructionWords.forEach(word => {
      const testLine = instructionLine + (instructionLine ? ' ' : '') + word;
      const testWidth = font.widthOfTextAtSize(testLine, 11);
      
      if (testWidth > width - 2 * margin && instructionLine) {
        page.drawText(instructionLine, { x: margin, y: yPosition, size: 11, font });
        yPosition -= lineHeight;
        instructionLine = word;
      } else {
        instructionLine = testLine;
      }
    });
    
    if (instructionLine) {
      page.drawText(instructionLine, { x: margin, y: yPosition, size: 11, font });
      yPosition -= lineHeight;
    }
  }
  
  yPosition -= 30;
  
  // Signature section
  page.drawText('IN WITNESS WHEREOF, I have executed this Power of Attorney.', {
    x: margin,
    y: yPosition,
    size: 12,
    font,
  });
  yPosition -= 40;
  
  page.drawText(`Principal: ${documentFormData.principalSignature || principalName || '_________________________'}`, {
    x: margin,
    y: yPosition,
    size: 12,
    font,
  });
  yPosition -= 30;
  
  page.drawText(`Attorney-in-Fact: ${documentFormData.attorneySignature || '_________________________'}`, {
    x: margin,
    y: yPosition,
    size: 12,
    font,
  });
};

// Generate generic document PDF using pdf-lib
const generateGenericDocumentPDF = async (pdfDoc, documentType, formData) => {
  const { personalInfo, documentInfo, documentFormData } = formData;
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let y = height - 50;
  const margin = 50;
  const lh = 16;

  const title = documentType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  page.drawText(title, { x: width / 2 - 80, y, size: 18, font: boldFont, color: rgb(0,0,0) });
  y -= 30;

  page.drawText('Personal Information', { x: margin, y, size: 14, font: boldFont });
  y -= 20;

  const lines = [];
  if (personalInfo.firstName || personalInfo.lastName) lines.push(`Name: ${personalInfo.firstName || ''} ${personalInfo.middleName || ''} ${personalInfo.lastName || ''}`.trim());
  if (personalInfo.email) lines.push(`Email: ${personalInfo.email}`);
  if (personalInfo.dateOfBirth) lines.push(`Date of Birth: ${personalInfo.dateOfBirth}`);
  if (personalInfo.countryOfResidence) lines.push(`Country of Residence: ${personalInfo.countryOfResidence}`);

  lines.forEach(l => { page.drawText(l, { x: margin, y, size: 12, font }); y -= lh; });
  y -= 10;

  if (documentFormData && Object.keys(documentFormData).length > 0) {
    page.drawText('Document Details', { x: margin, y, size: 14, font: boldFont });
    y -= 20;
    Object.entries(documentFormData).forEach(([key, value]) => {
      if (value && key !== 'signatures' && key !== 'documentUrl') {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
        page.drawText(`${label}: ${displayValue}`, { x: margin, y, size: 12, font });
        y -= lh;
      }
    });
    y -= 10;
  }

  page.drawText('Signatures', { x: margin, y, size: 14, font: boldFont });
  y -= 20;
  page.drawText('Client Signature: _________________________    Date: _____________', { x: margin, y, size: 12, font });
  y -= lh + 10;
  page.drawText('Notary Signature: _________________________    Date: _____________', { x: margin, y, size: 12, font });
  y -= lh + 10;
  page.drawText('[Notary Public Seal]', { x: margin, y, size: 12, font });
};

export async function POST(request) {
  try {
    const { documentType, formData, userId, sessionId } = await request.json();

    if (!documentType || !formData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing documentType or formData' 
      }, { status: 400 });
    }

    console.log('Generating PDF for:', documentType, 'userId:', userId || 'anonymous');

    // Fetch document-specific form data from database
    const dbDocumentFormData = await fetchDocumentFormData(documentType, userId, sessionId);
    
    // Merge database data with any passed form data (database takes precedence)
    const mergedFormData = {
      ...formData,
      documentFormData: {
        ...formData.documentFormData,
        ...dbDocumentFormData
      }
    };
    
    console.log('Merged form data contains:', {
      personalInfo: !!mergedFormData.personalInfo,
      documentInfo: !!mergedFormData.documentInfo,
      documentFormDataKeys: Object.keys(mergedFormData.documentFormData || {}),
      dbDataKeys: Object.keys(dbDocumentFormData)
    });

    // Create new PDF document (pdf-lib)
    const pdfDoc = await PDFDocument.create();

    // Generate content based on document type
    if (documentType === 'affidavit-of-identity') {
      await generateAffidavitOfIdentityPDF(pdfDoc, mergedFormData);
    } else if (documentType === 'last-will') {
      await generateLastWillTestamentPDF(pdfDoc, mergedFormData);
    } else if (documentType.includes('power-of-attorney')) {
      await generatePowerOfAttorneyPDF(pdfDoc, documentType, mergedFormData);
    } else {
      await generateGenericDocumentPDF(pdfDoc, documentType, mergedFormData);
    }

    // Serialize PDF to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // Upload to Cloudinary
    const fileName = `${documentType}-${Date.now()}.pdf`;
    const cloudinaryUrl = await uploadPDFToCloudinary(pdfBytes, fileName);

    console.log('PDF generated and uploaded successfully:', cloudinaryUrl);

    return NextResponse.json({
      success: true,
      pdfUrl: cloudinaryUrl,
      fileName: fileName
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate PDF'
    }, { status: 500 });
  }
}
