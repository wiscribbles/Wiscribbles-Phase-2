// PDF OCR Helper utility for document verification
// This module handles PDF text extraction for OCR verification

let pdfjsLib = null;
let isInitialized = false;

/**
 * Initialize PDF.js library with proper configuration
 */
export async function initializePdfJs() {
  if (isInitialized && pdfjsLib) {
    return pdfjsLib;
  }

  try {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      throw new Error('PDF.js can only be initialized in browser environment');
    }

    // Dynamic import to avoid SSR issues
    const pdfjs = await import('pdfjs-dist');
    
    // Configure worker with fallback options
    if (pdfjs.GlobalWorkerOptions) {
      // Try to use the worker file if available
      const workerSrc = `${window.location.origin}/pdf.worker.min.mjs`;
      
      // Test if worker file exists by trying to fetch it
      try {
        const response = await fetch(workerSrc, { method: 'HEAD' });
        if (response.ok) {
          pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
        } else {
          // Fallback to CDN version if local worker not found
          pdfjs.GlobalWorkerOptions.workerSrc = 
            `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
        }
      } catch (e) {
        // If fetch fails, use CDN fallback
        console.warn('Local PDF worker not accessible, using CDN fallback');
        pdfjs.GlobalWorkerOptions.workerSrc = 
          `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      }
    }

    pdfjsLib = pdfjs;
    isInitialized = true;
    return pdfjsLib;
  } catch (error) {
    console.error('Failed to initialize PDF.js:', error);
    throw error;
  }
}

/**
 * Extract text from PDF file for OCR verification
 * @param {File} file - The PDF file to process
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromPDF(file) {
  if (!file || file.type !== 'application/pdf') {
    throw new Error('Invalid file: Please provide a valid PDF file');
  }

  try {
    // Initialize PDF.js if not already done
    const pdfjs = await initializePdfJs();
    
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Create loading task with error handling
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      // Disable features that might cause issues
      disableRange: true,
      disableStream: true,
      disableAutoFetch: true,
      // Add error handling for corrupt PDFs
      stopAtErrors: false,
      // Increase timeout for large files
      isEvalSupported: false,
      disableFontFace: false,
    });
    
    // Handle loading errors
    loadingTask.onPassword = (updateCallback, reason) => {
      throw new Error('This PDF is password protected and cannot be processed');
    };
    
    const pdf = await loadingTask.promise;
    let fullText = '';
    const totalPages = pdf.numPages;

    // Extract text from each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items with proper spacing
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ');
        
        fullText += pageText + ' ';
        
        // Log progress for debugging
        console.log(`Extracted text from page ${pageNum}/${totalPages}`);
      } catch (pageError) {
        console.warn(`Error extracting text from page ${pageNum}:`, pageError);
        // Continue with other pages even if one fails
      }
    }

    // Clean up the PDF document
    pdf.destroy();

    return fullText.trim();
  } catch (error) {
    console.error('PDF text extraction error:', error);
    
    // Provide user-friendly error messages
    if (error.message.includes('Invalid PDF')) {
      throw new Error('The uploaded file appears to be corrupted or is not a valid PDF');
    } else if (error.message.includes('password')) {
      throw new Error('This PDF is password protected and cannot be processed');
    } else if (error.name === 'MissingPDFException') {
      throw new Error('Failed to load PDF file. Please try again');
    } else {
      throw new Error(`Failed to process PDF: ${error.message || 'Unknown error'}`);
    }
  }
}

/**
 * Verify document content against form data
 * @param {string} extractedText - Text extracted from PDF
 * @param {Object} formData - Form data to verify against
 * @returns {Object} - Verification result with details
 */
export function verifyDocumentContent(extractedText, formData) {
  if (!extractedText || extractedText.trim() === '') {
    return {
      success: false,
      error: 'No text could be extracted from the document. The PDF might be image-based or empty.',
      details: {}
    };
  }

  // Normalize text for better matching
  const cleanText = extractedText
    .replace(/[^a-zA-Z0-9\s\/\-\.]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();

  const { firstName, middleName, lastName, dateOfBirth } = formData;
  const verificationDetails = {};

  // Helper function to check name variations
  const checkNameVariations = (name, text) => {
    if (!name || name.trim() === '') return true;
    
    const cleanName = name.trim().toLowerCase();
    const variations = [
      cleanName,
      cleanName.replace(/\s+/g, ''), // Remove spaces
      cleanName.replace(/[^a-zA-Z]/g, ''), // Remove non-letters
    ];
    
    return variations.some(variant => {
      if (variant.length < 2) return false;
      return text.includes(variant);
    });
  };

  // Check each field
  verificationDetails.firstName = checkNameVariations(firstName, cleanText);
  verificationDetails.middleName = !middleName || middleName.trim() === '' || checkNameVariations(middleName, cleanText);
  verificationDetails.lastName = checkNameVariations(lastName, cleanText);

  // Check date of birth with multiple formats
  if (dateOfBirth) {
    const dateParts = dateOfBirth.split(/[-\/]/);
    const dateVariations = [];
    
    if (dateParts.length === 3) {
      const [year, month, day] = dateParts;
      dateVariations.push(
        `${month}/${day}/${year}`,
        `${day}/${month}/${year}`,
        `${year}-${month}-${day}`,
        `${year}/${month}/${day}`,
        `${day}-${month}-${year}`,
        `${month}-${day}-${year}`
      );
    }
    
    verificationDetails.dateOfBirth = dateVariations.some(dateStr => 
      cleanText.includes(dateStr.toLowerCase())
    );
  } else {
    verificationDetails.dateOfBirth = true; // Skip if not provided
  }

  // Determine overall success
  const success = verificationDetails.firstName && 
                 verificationDetails.lastName && 
                 verificationDetails.middleName;

  // Build error message if verification failed
  let errorMessage = '';
  if (!success) {
    const failedFields = [];
    if (!verificationDetails.firstName) failedFields.push(`First name "${firstName}"`);
    if (!verificationDetails.lastName) failedFields.push(`Last name "${lastName}"`);
    if (!verificationDetails.middleName && middleName) failedFields.push(`Middle name "${middleName}"`);
    if (!verificationDetails.dateOfBirth && dateOfBirth) failedFields.push('Date of birth');
    
    errorMessage = `The following information could not be found in the document: ${failedFields.join(', ')}. ` +
                  'Please ensure your document contains the exact information you entered.';
  }

  return {
    success,
    error: errorMessage,
    details: verificationDetails,
    extractedTextLength: extractedText.length
  };
}

/**
 * Reset PDF.js library (useful for error recovery)
 */
export function resetPdfJs() {
  pdfjsLib = null;
  isInitialized = false;
}
