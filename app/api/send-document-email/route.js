import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      email, 
      documentUrl, 
      documentType = 'document',
      referenceNumber,
      userName = 'User',
      documentTypeName = 'Document'
    } = body;
    
    // Validate required fields
    if (!email || !documentUrl) {
      return NextResponse.json(
        { error: 'Email and document URL are required' },
        { status: 400 }
      );
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
    
    // Log the email sending attempt (for debugging)
    console.log('=== EMAIL API DEBUG ===');
    console.log('Sending document to:', email);
    console.log('Document URL:', documentUrl);
    console.log('Reference Number:', referenceNumber);
    
    // If EmailJS fails, we can implement alternative email sending here
    // For now, we'll return a success response with instructions
    
    // You could integrate with other email services here like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Nodemailer with SMTP
    
    // For now, return a response that indicates the email would be sent
    return NextResponse.json({
      success: true,
      message: 'Email request processed',
      fallbackUrl: documentUrl,
      recipient: email,
      instructions: `Document link: ${documentUrl}`,
      // In production, you'd actually send the email here
      note: 'Email service integration pending. Please use the direct download option for now.'
    });
    
  } catch (error) {
    console.error('Error in send-document-email API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process email request',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
