'use client';

import React from 'react';

const SimplePDFViewer = ({ pdfUrl, className = "", title = "PDF Document" }) => {
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

  return (
    <div className={`pdf-viewer h-100 d-flex flex-column ${className}`}>
      {/* Simple Header */}
      <div className="pdf-header border-bottom p-2 bg-light">
        <div className="d-flex justify-content-between align-items-center">
          <span className="small text-muted">
            <i className="fa fa-file-pdf me-2"></i>
            {title}
          </span>
          <div>
            <a 
              href={pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-sm"
              style={{ backgroundColor: '#274171', color: 'white', border: 'none' }}
              title="Open in new tab"
            >
              <i className="fa fa-external-link me-1"></i>
              Open
            </a>
          </div>
        </div>
      </div>

      {/* PDF Content - Direct iframe display */}
      <div className="pdf-content flex-grow-1 bg-white">
        <iframe
          src={pdfUrl}
          width="100%"
          height="100%"
          style={{ 
            border: 'none',
            minHeight: '500px'
          }}
          title={title}
          loading="lazy"
        >
          <div className="d-flex align-items-center justify-content-center h-100">
            <div className="text-center">
              <i className="fa fa-exclamation-triangle fa-3x mb-3 text-warning"></i>
              <h5>Unable to display PDF</h5>
              <p>Your browser doesn't support PDF preview.</p>
              <a 
                href={pdfUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn"
                style={{ backgroundColor: '#274171', color: 'white', border: 'none' }}
              >
                <i className="fa fa-external-link me-2"></i>
                Open PDF in New Tab
              </a>
            </div>
          </div>
        </iframe>
      </div>

      {/* Status Footer */}
      <div className="pdf-footer border-top p-2 bg-light">
        <small className="text-muted">
          <i className="fa fa-info-circle me-2"></i>
          PDF loaded from: {new URL(pdfUrl).hostname}
        </small>
      </div>
    </div>
  );
};

export default SimplePDFViewer;
