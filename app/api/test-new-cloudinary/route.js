import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test a simple text file upload
    const testContent = "Hello World Test PDF Content";
    const testBlob = new Blob([testContent], { type: 'text/plain' });
    
    const formData = new FormData();
    formData.append('file', testBlob, 'test.txt');
    formData.append('upload_preset', 'wiscribbles');
    formData.append('cloud_name', 'dgyv432jt');
    formData.append('folder', 'test-uploads');

    const uploadResponse = await fetch(
      'https://api.cloudinary.com/v1_1/dgyv432jt/raw/upload',
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.text();
      return NextResponse.json({
        success: false,
        error: `Upload failed: ${uploadResponse.status}`,
        details: errorData
      });
    }

    const uploadData = await uploadResponse.json();
    
    // Test retrieving the uploaded file
    const testRetrieve = await fetch(uploadData.secure_url);
    const canRetrieve = testRetrieve.ok;
    
    return NextResponse.json({
      success: true,
      message: 'New Cloudinary account working!',
      uploadData: {
        url: uploadData.secure_url,
        public_id: uploadData.public_id
      },
      canRetrieve,
      testRetrieveStatus: testRetrieve.status
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error.message
    });
  }
}
