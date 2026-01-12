"use client";
import React, { useState } from 'react';
import { Button, Container, Form, Alert } from 'react-bootstrap';
import PDFViewer from '@/components/PDFViewer';

const PDFTestPage = () => {
  const [pdfUrl, setPdfUrl] = useState('https://res.cloudinary.com/dgyv432jt/raw/upload/v1756295187/user-documents/PrintDupBill1_a90loj.pdf');
  const [testUrl, setTestUrl] = useState('');
  const [showViewer, setShowViewer] = useState(false);
  const [testResults, setTestResults] = useState('');

  const testPdfUrl = async (url) => {
    try {
      const response = await fetch(url);
      console.log('PDF fetch response:', response.status, response.statusText);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');
        
        setTestResults(`
✅ SUCCESS - PDF URL is accessible
Status: ${response.status} ${response.statusText}
Content-Type: ${contentType}
Content-Length: ${contentLength} bytes

URL: ${url}
        `);
        
        return true;
      } else {
        setTestResults(`
❌ FAILED - PDF URL not accessible
Status: ${response.status} ${response.statusText}
URL: ${url}
        `);
        return false;
      }
    } catch (error) {
      setTestResults(`
❌ ERROR - Failed to fetch PDF
Error: ${error.message}
URL: ${url}
      `);
      return false;
    }
  };

  const handleTestUrl = async () => {
    const urlToTest = testUrl || pdfUrl;
    const isAccessible = await testPdfUrl(urlToTest);
    if (isAccessible) {
      setPdfUrl(urlToTest);
      setShowViewer(true);
    }
  };

  const handleTestBrowserPreview = () => {
    const urlToTest = testUrl || pdfUrl;
    window.open(urlToTest, '_blank');
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4">PDF Preview Testing Page</h1>
      
      <div className="mb-4">
        <h3>Test PDF URL</h3>
        <Form.Group className="mb-3">
          <Form.Label>PDF URL to test:</Form.Label>
          <Form.Control
            type="text"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="Enter PDF URL or use default URL below"
          />
          <Form.Text className="text-muted">
            Default URL: {pdfUrl}
          </Form.Text>
        </Form.Group>
        
        <div className="d-flex gap-2 mb-3">
          <Button variant="primary" onClick={handleTestUrl}>
            Test URL & Show Preview
          </Button>
          <Button variant="outline-primary" onClick={handleTestBrowserPreview}>
            Open in Browser
          </Button>
        </div>
        
        {testResults && (
          <Alert variant={testResults.includes('✅') ? 'success' : 'danger'}>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
              {testResults}
            </pre>
          </Alert>
        )}
      </div>

      {showViewer && (
        <div className="mb-4">
          <h3>PDF Preview in Website</h3>
          <div style={{ border: '2px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
            <PDFViewer 
              pdfUrl={pdfUrl}
              title="Test PDF Preview"
            />
          </div>
        </div>
      )}

      <div className="mt-4">
        <h4>Testing Instructions:</h4>
        <ul>
          <li><strong>Test URL & Show Preview:</strong> Tests if the URL is accessible and shows it in the website's PDF viewer</li>
          <li><strong>Open in Browser:</strong> Opens the PDF directly in your browser (should download/show the file)</li>
          <li>Compare the behavior - browser should show the actual PDF, website should show the preview</li>
          <li>If the website preview fails but browser works, there might be a CORS or viewer issue</li>
        </ul>
      </div>

      <div className="mt-4">
        <h4>Expected Results:</h4>
        <ul>
          <li><strong>Browser:</strong> Should open/download the actual PDF file</li>
          <li><strong>Website Preview:</strong> Should show the PDF rendered in the react-pdf viewer component</li>
          <li>Both should work if the URL is correct and accessible</li>
        </ul>
      </div>
    </Container>
  );
};

export default PDFTestPage;
