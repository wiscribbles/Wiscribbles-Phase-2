import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const documentUrl = searchParams.get('url');
    const fileName = searchParams.get('filename') || 'document.pdf';
    
    if (!documentUrl) {
      return NextResponse.json(
        { error: 'Document URL is required' },
        { status: 400 }
      );
    }
    
    // Validate the URL is from Cloudinary or your trusted sources
    const allowedDomains = ['res.cloudinary.com', 'cloudinary.com'];
    const url = new URL(documentUrl);
    const isAllowed = allowedDomains.some(domain => url.hostname.includes(domain));
    
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Invalid document source' },
        { status: 403 }
      );
    }
    
    // Fetch the document from the URL
    const response = await fetch(documentUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch document' },
        { status: response.status }
      );
    }
    
    // Get the content type from the original response
    const contentType = response.headers.get('content-type') || 'application/pdf';
    
    // Get the document as array buffer
    const arrayBuffer = await response.arrayBuffer();
    
    // Create response with appropriate headers for download
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
        // Cache for 5 minutes
        'Cache-Control': 'private, max-age=300',
      },
    });
    
  } catch (error) {
    console.error('Error in download-document API:', error);
    return NextResponse.json(
      { error: 'Failed to process document download' },
      { status: 500 }
    );
  }
}

// Handle POST requests (if needed for more complex scenarios)
export async function POST(request) {
  try {
    const body = await request.json();
    const { documentUrl, fileName = 'document.pdf' } = body;
    
    if (!documentUrl) {
      return NextResponse.json(
        { error: 'Document URL is required' },
        { status: 400 }
      );
    }
    
    // Validate the URL is from Cloudinary or your trusted sources
    const allowedDomains = ['res.cloudinary.com', 'cloudinary.com'];
    const url = new URL(documentUrl);
    const isAllowed = allowedDomains.some(domain => url.hostname.includes(domain));
    
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Invalid document source' },
        { status: 403 }
      );
    }
    
    // Fetch the document
    const response = await fetch(documentUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch document' },
        { status: response.status }
      );
    }
    
    // Get the content type
    const contentType = response.headers.get('content-type') || 'application/pdf';
    
    // Get the document as array buffer
    const arrayBuffer = await response.arrayBuffer();
    
    // Create response with download headers
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Cache-Control': 'private, max-age=300',
      },
    });
    
  } catch (error) {
    console.error('Error in download-document POST:', error);
    return NextResponse.json(
      { error: 'Failed to process document download' },
      { status: 500 }
    );
  }
}
