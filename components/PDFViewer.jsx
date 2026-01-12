'use client';

import React, { useState, useCallback } from 'react';

// Conditionally import react-pdf only on client side
let Document, Page, pdfjs;
if (typeof window !== 'undefined') {
  const ReactPDF = require('react-pdf');
  Document = ReactPDF.Document;
  Page = ReactPDF.Page;
  pdfjs = ReactPDF.pdfjs;
  
  // Use CDN worker to avoid Vercel build issues
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

const PDFViewer = ({ pdfUrl, onLoadSuccess, onLoadError, className = "" }) => {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1.0);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setCurrentPage(1);
    setLoading(false);
    setError(null);
    if (onLoadSuccess) {
      onLoadSuccess({ numPages });
    }
  }, [onLoadSuccess]);

  const onDocumentLoadError = useCallback((error) => {
    console.error('PDF load error:', error);
    console.warn('PDF.js failed, falling back to iframe viewer');
    setError('react-pdf-failed');
    setLoading(false);
    if (onLoadError) {
      onLoadError(error);
    }
  }, [onLoadError]);

  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 2.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  if (!pdfUrl) {
    return (
      <div className={`d-flex align-items-center justify-content-center h-100 ${className}`}>
        <div className="text-center text-muted">
          <i className="fa fa-file-pdf fa-5x mb-3"></i>
          <h5>No Document Available</h5>
          <p>Please upload a document to preview.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`d-flex align-items-center justify-content-center h-100 ${className}`}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5>Loading Document...</h5>
          <p className="text-muted">Please wait while we load your PDF.</p>
        </div>
      </div>
    );
  }

  if (error === 'react-pdf-failed') {
    // Fallback to iframe viewer when react-pdf fails
    return (
      <div className={`pdf-viewer h-100 d-flex flex-column ${className}`}>
        <div className="pdf-controls border-bottom p-2 bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <span className="badge bg-warning">
              <i className="fa fa-info-circle me-1"></i>
              Fallback Viewer
            </span>
            <a 
              href={pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-primary"
            >
              <i className="fa fa-external-link me-1"></i>
              Open in New Tab
            </a>
          </div>
        </div>
        <div className="flex-grow-1">
          <iframe
            src={pdfUrl}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title="PDF Document"
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`d-flex align-items-center justify-content-center h-100 ${className}`}>
        <div className="text-center text-danger">
          <i className="fa fa-exclamation-triangle fa-4x mb-3"></i>
          <h5>Failed to Load Document</h5>
          <p>{error}</p>
          <small className="text-muted">Please try refreshing the page.</small>
        </div>
      </div>
    );
  }

  // If components are not loaded (SSR), show fallback
  if (!Document || !Page) {
    return (
      <div className={`pdf-viewer h-100 d-flex flex-column ${className}`}>
        <div className="flex-grow-1">
          <iframe
            src={pdfUrl}
            width="100%"
            height="100%"
            style={{ border: 'none', minHeight: '600px' }}
            title="PDF Document"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`pdf-viewer h-100 d-flex flex-column ${className}`}>
      {/* PDF Controls */}
      <div className="pdf-controls border-bottom p-2 bg-light">
        <div className="d-flex justify-content-between align-items-center">
          {/* Page Navigation */}
          <div className="btn-group" role="group">
            <button 
              className="btn btn-sm btn-outline-secondary" 
              onClick={goToPrevPage} 
              disabled={currentPage <= 1}
            >
              <i className="fa fa-chevron-left"></i>
            </button>
            <span className="btn btn-sm btn-outline-secondary disabled">
              {currentPage} of {numPages}
            </span>
            <button 
              className="btn btn-sm btn-outline-secondary" 
              onClick={goToNextPage} 
              disabled={currentPage >= numPages}
            >
              <i className="fa fa-chevron-right"></i>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="btn-group" role="group">
            <button className="btn btn-sm btn-outline-secondary" onClick={zoomOut}>
              <i className="fa fa-minus"></i>
            </button>
            <span className="btn btn-sm btn-outline-secondary disabled">
              {Math.round(scale * 100)}%
            </span>
            <button className="btn btn-sm btn-outline-secondary" onClick={zoomIn}>
              <i className="fa fa-plus"></i>
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={resetZoom}>
              <i className="fa fa-refresh"></i>
            </button>
          </div>
        </div>
      </div>

      {/* PDF Document */}
      <div className="pdf-content flex-grow-1 overflow-auto p-3 bg-white">
        <div className="d-flex justify-content-center">
          <Document
            file={{
              url: pdfUrl,
              httpHeaders: {
                'Accept': 'application/pdf,*/*',
                'Cache-Control': 'no-cache'
              },
              withCredentials: false
            }}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="text-center p-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 small text-muted">Loading PDF from: {pdfUrl}</p>
              </div>
            }
            options={{
              cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
              cMapPacked: true,
              standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
              disableAutoFetch: false,
              disableStream: false,
              disableRange: false
            }}
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="pdf-page shadow-sm"
            />
          </Document>
        </div>
      </div>

      {/* Status Bar */}
      {numPages && (
        <div className="pdf-status border-top p-2 bg-light">
          <small className="text-muted">
            <i className="fa fa-file-pdf me-2"></i>
            PDF Document • {numPages} page{numPages > 1 ? 's' : ''} • Zoom: {Math.round(scale * 100)}%
          </small>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
