import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { pdfUrl } = await request.json();
    
    if (!pdfUrl) {
      return NextResponse.json({
        success: false,
        error: 'PDF URL is required'
      });
    }

    console.log('Testing PDF URL:', pdfUrl);
    
    // Test fetching the PDF
    const response = await fetch(pdfUrl, {
      method: 'HEAD',
      headers: {
        'Accept': 'application/pdf,*/*',
        'User-Agent': 'Mozilla/5.0 (compatible; PDF-Tester/1.0)',
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `PDF not accessible: ${response.status} ${response.statusText}`,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      });
    }

    // Try to get the first few bytes to verify it's a PDF
    const testResponse = await fetch(pdfUrl, {
      headers: {
        'Range': 'bytes=0-10',
        'Accept': 'application/pdf,*/*',
      }
    });

    let isPDF = false;
    if (testResponse.ok) {
      const buffer = await testResponse.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      // Check for PDF signature %PDF
      isPDF = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
    }

    return NextResponse.json({
      success: true,
      accessible: true,
      isPDF,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
      status: response.status,
      message: isPDF ? 'PDF is accessible and valid' : 'File is accessible but may not be a valid PDF'
    });

  } catch (error) {
    console.error('PDF access test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test PDF access',
      details: error.message
    });
  }
}
