import { NextResponse } from 'next/server';

export async function GET(request) {
  const testUrls = [
    'https://res.cloudinary.com/dgyv432jt/raw/upload/v1753899848/documents/dxkzw7amn1coxjwbbj5t.pdf',
    'https://res.cloudinary.com/dgyv432jt/image/upload/v1753899848/documents/dxkzw7amn1coxjwbbj5t.pdf',
    'https://res.cloudinary.com/dgyv432jt/raw/upload/documents/dxkzw7amn1coxjwbbj5t.pdf',
  ];

  const results = [];

  for (const url of testUrls) {
    try {
      console.log(`Testing URL: ${url}`);
      const response = await fetch(url, { method: 'HEAD' }); // Just check headers
      results.push({
        url,
        status: response.status,
        statusText: response.statusText,
        accessible: response.ok,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      });
    } catch (error) {
      results.push({
        url,
        error: error.message,
        accessible: false
      });
    }
  }

  return NextResponse.json({ 
    success: true, 
    results,
    message: 'Tested different URL formats' 
  });
}
