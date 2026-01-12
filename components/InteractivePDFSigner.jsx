'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, FileText, MousePointer, Trash2, Check } from 'lucide-react';

const InteractivePDFSigner = ({ 
  pdfUrl, 
  onSignaturesReady,
  notaryName = "Notary Public",
  isNotary = false 
}) => {
  const [signatures, setSignatures] = useState([]);
  const [isAddingSignature, setIsAddingSignature] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  const iframeRef = useRef(null);
  const overlayRef = useRef(null);

  // Calculate relative position based on PDF dimensions
  const calculateRelativePosition = (clientX, clientY, rect) => {
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Convert to PDF coordinate system (0-1 range)
    const relativeX = x / rect.width;
    const relativeY = 1 - (y / rect.height); // PDF uses bottom-up coordinate system
    
    return { x: relativeX, y: relativeY };
  };

  // Handle click on PDF to add signature
  const handlePDFClick = (event) => {
    if (!isAddingSignature) return;
    
    const rect = overlayRef.current.getBoundingClientRect();
    const position = calculateRelativePosition(event.clientX, event.clientY, rect);
    
    const newSignature = {
      id: `sig-${Date.now()}`,
      page: currentPage,
      x: position.x,
      y: position.y,
      text: notaryName,
      type: 'notary-signature',
      timestamp: new Date().toISOString()
    };
    
    console.log('Placing new signature:', newSignature);
    setSignatures(prev => {
      const updated = [...prev, newSignature];
      console.log('Updated signatures array:', updated);
      return updated;
    });
    setIsAddingSignature(false);
  };

  // Remove signature
  const removeSignature = (signatureId) => {
    setSignatures(prev => prev.filter(sig => sig.id !== signatureId));
  };

  // Convert relative position to absolute pixels for display
  const getAbsolutePosition = (signature) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    return {
      x: signature.x * rect.width,
      y: (1 - signature.y) * rect.height // Convert back from PDF coordinate system
    };
  };

  // Signatures are now sent to parent explicitly via "Done" button
  // This prevents premature calls when component mounts

  return (
    <div className="interactive-pdf-signer" style={{ position: 'relative', height: '100%' }}>
      {/* Controls */}
      <div className="pdf-signature-controls p-3 bg-light border-bottom">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-1">
              <MousePointer size={16} className="me-2" />
              Click to Place Signature
            </h6>
            <small className="text-muted">
              {signatures.length} signature{signatures.length !== 1 ? 's' : ''} added
            </small>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              className={`btn btn-sm`}
              onClick={() => setIsAddingSignature(!isAddingSignature)}
              style={{
                backgroundColor: isAddingSignature ? '#274171' : 'transparent',
                color: isAddingSignature ? '#ffffff' : '#274171',
                border: `1px solid #274171`
              }}
            >
              {isAddingSignature ? (
                <>
                  <Check size={14} className="me-1" />
                  Click PDF to Sign
                </>
              ) : (
                <>
                  <MousePointer size={14} className="me-1" />
                  Add Signature
                </>
              )}
            </button>
            {signatures.length > 0 && (
              <>
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    console.log('Done button clicked with signatures:', signatures);
                    onSignaturesReady && onSignaturesReady(signatures);
                  }}
                  style={{
                    backgroundColor: '#274171',
                    color: '#ffffff',
                    border: 'none'
                  }}
                >
                  <Check size={14} className="me-1" />
                  Done ({signatures.length})
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => setSignatures([])}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#dc3545',
                    border: '1px solid #dc3545'
                  }}
                >
                  <Trash2 size={14} className="me-1" />
                  Clear All
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* PDF Container with Overlay */}
      <div 
        className="pdf-container"
        style={{ 
          position: 'relative', 
          height: 'calc(100% - 80px)',
          cursor: isAddingSignature ? 'crosshair' : 'default'
        }}
      >
        {/* PDF Iframe */}
        <iframe
          ref={iframeRef}
          src={pdfUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            pointerEvents: isAddingSignature ? 'none' : 'auto'
          }}
          title="PDF Document"
        />

        {/* Signature Overlay */}
        <div
          ref={overlayRef}
          className="signature-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: isAddingSignature ? 'auto' : 'none',
            zIndex: isAddingSignature ? 10 : 5
          }}
          onClick={handlePDFClick}
        >
          {/* Render signatures for current page */}
          {signatures
            .filter(sig => sig.page === currentPage)
            .map(signature => {
              const pos = getAbsolutePosition(signature);
              return (
                <div
                  key={signature.id}
                  className="signature-marker"
                  style={{
                    position: 'absolute',
                    left: `${pos.x - 75}px`, // Center signature
                    top: `${pos.y - 15}px`,
                    backgroundColor: 'rgba(39, 65, 113, 0.9)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    border: '2px solid #274171',
                    cursor: 'pointer',
                    fontFamily: 'cursive',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    minWidth: '150px',
                    textAlign: 'center',
                    pointerEvents: 'auto'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSignature(signature.id);
                  }}
                  title="Click to remove signature"
                >
                  {signature.text}
                  <X size={12} className="ms-2" style={{ opacity: 0.7 }} />
                </div>
              );
            })
          }

          {/* Instructions overlay when adding */}
          {isAddingSignature && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center',
                pointerEvents: 'none',
                zIndex: 20
              }}
            >
              <MousePointer size={24} className="mb-2" />
              <div>Click anywhere on the PDF to place your signature</div>
              <small className="text-muted">Click "Add Signature" again to cancel</small>
            </div>
          )}
        </div>
      </div>

      {/* Signature List */}
      {signatures.length > 0 && (
        <div className="signature-list p-2 bg-light border-top">
          <small className="text-muted d-block mb-2">Placed Signatures:</small>
          <div className="d-flex flex-wrap gap-2">
            {signatures.map(signature => (
              <span
                key={signature.id}
                className="badge d-flex align-items-center"
                style={{ 
                  cursor: 'pointer',
                  backgroundColor: '#274171',
                  color: '#ffffff'
                }}
                onClick={() => removeSignature(signature.id)}
                title="Click to remove"
              >
                {signature.text} (Page {signature.page})
                <X size={12} className="ms-1" />
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractivePDFSigner;
